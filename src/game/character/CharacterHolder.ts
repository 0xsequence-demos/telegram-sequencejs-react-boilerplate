import { Object3D, Scene } from "three";
import { dist2 } from "../utils/math";
import { distPerTile } from "../constants";
import Character from "./Character";
import { loadGLTF } from "../utils/loadGLTF";
import { xzDist } from "../utils/xzDist";
// import { removeFromArray } from "../removeFromArray";
// import Animation from "../Animation";
import World from "../World";
import AnimationManager from "../AnimationManager";
import { removeFromArray } from "../removeFromArray";
import Animation from "../Animation";

const __walkSpeed = 0.5;

export class CharacterHolder extends Object3D {
  party: boolean = false;
  private _coinBalance = 0;

  public get coinBalance() {
    return this._coinBalance;
  }
  public set coinBalance(value) {
    this._coinBalance = value;
    if (this.onCoinBalanceChange) {
      this.onCoinBalanceChange(value);
    }
  }
  onCoinBalanceChange: ((v: number) => void) | undefined;

  character: Character | undefined;
  worldspaceUiCoinTarget: Object3D;
  constructor(
    public scene: Scene,
    public world: World,
    public animationManager: AnimationManager,
    public altWorldspaceUiCoinTarget?: Object3D,
  ) {
    super();
    this.worldspaceUiCoinTarget = altWorldspaceUiCoinTarget || this;
    loadGLTF("quinn-the-bot.glb").then((gltf) => {
      gltf.scene.traverse((n) => {
        n.receiveShadow = true;
        n.castShadow = true;
      });
      this.character = new Character(gltf.scene, this);
    });
  }
  idledTime = 0;
  angleTarget = 0;

  update(time: number) {
    if (this.character) {
      this.character.happiness.target = this.party ? 1 : 0;
      this.character.update(time);
    }
  }
  updateIntent(
    inputMoveAngle: number,
    inputMoveMag: number,
    deltaTime: number,
  ) {
    if (inputMoveMag > 0.1) {
      this.idledTime = 0;
    } else {
      this.idledTime += deltaTime;
    }
    if (this.character) {
      this.character.idling.target = this.idledTime > 4 ? 1 : 0;
      this.character.running.target = Math.min(1, inputMoveMag * 2);
    }
    const mag = inputMoveMag * __walkSpeed;
    const walkX = Math.cos(inputMoveAngle) * mag;
    const walkY = Math.sin(inputMoveAngle) * mag;

    this.position.z += walkX;
    this.position.x -= walkY;

    if (dist2(walkX, walkY) > 0.01) {
      this.angleTarget = Math.atan2(walkX, walkY) + Math.PI * 0.5;
    }

    const cx = Math.round(this.position.x / distPerTile);
    const cy = Math.round(this.position.z / distPerTile);
    const locationKey = `${cx};${cy}`;

    for (const coin of this.world.items) {
      const p = coin.position.clone();
      p.applyMatrix4(coin.parent!.matrixWorld);
      if (xzDist(p, this.position) <= 1.8) {
        console.log("ding");
        this.world.itemsToDelete.push(coin);
        this.scene.attach(coin);
        const origin = coin.position.clone();
        let coinAdded = false;
        this.animationManager.animations.push(
          new Animation(
            (v) => {
              coin.scale.setScalar(1 - v * 0.75);
              coin.position.copy(origin);
              coin.position.y += v * 10;
              coin.position.lerp(this.worldspaceUiCoinTarget.position, v * v);
              if (!coinAdded && v > 0.85) {
                this.coinBalance++;
                coinAdded = true;
              }
            },
            () => this.scene.remove(coin),
            0.04,
          ),
        );
      }
    }
    if (this.world.itemsToDelete.length > 0) {
      for (const coin of this.world.itemsToDelete) {
        removeFromArray(this.world.items, coin);
      }
      this.world.itemsToDelete.length = 0;
    }
    const tileMeshExists = this.world.mapCache.has(locationKey)!;
    if (tileMeshExists) {
      if (this.world.availableTrees.includes(locationKey)) {
        const tileMesh = this.world.mapCache.get(locationKey)!;
        const tree = tileMesh.getObjectByName("treeTrunk")!;
        const p = tree.position.clone();
        p.applyMatrix4(tree.parent!.matrixWorld);
        const dist = xzDist(p, this.position);
        if (dist <= 1.8) {
          const dx = p.x - this.position.x;
          const dz = p.z - this.position.z;
          const a = Math.atan2(dz, dx);
          const gap = dist - 1.8;
          this.position.x += Math.cos(a) * gap;
          this.position.z += Math.sin(a) * gap;
        }
      }
      if (this.world.availableTowers.includes(locationKey)) {
        const tileMesh = this.world.mapCache.get(locationKey)!;
        const tower = tileMesh.getObjectByName("tower")!;
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * (i + 0.5)) / 4;
          const ix = Math.cos(a) * 3.25;
          const iy = Math.sin(a) * 3.25;
          const p = tower.position.clone();
          p.x += ix;
          p.z += iy;
          p.applyMatrix4(tower.parent!.matrixWorld);
          const dist = xzDist(p, this.position);
          if (dist <= 2) {
            const dx = p.x - this.position.x;
            const dz = p.z - this.position.z;
            const a = Math.atan2(dz, dx);
            const gap = dist - 2;
            this.position.x += Math.cos(a) * gap;
            this.position.z += Math.sin(a) * gap;
          }
        }
      }
    }
    let ad = this.rotation.y - this.angleTarget;
    if (ad > Math.PI) {
      ad -= Math.PI * 2;
    } else if (ad < -Math.PI) {
      ad += Math.PI * 2;
    }
    this.rotation.y -= ad * 0.5;
  }
}
