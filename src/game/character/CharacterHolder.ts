import { Object3D, Scene, Vector3 } from "three";
import { dist2 } from "../utils/math";
import { distPerTile, TREE_SCALE } from "../constants";
import Character from "./Character";
import { loadGLTF } from "../utils/loadGLTF";
import { xzDist } from "../utils/xzDist";
// import { removeFromArray } from "../removeFromArray";
// import Animation from "../Animation";
import World from "../World";
import AnimationManager from "../AnimationManager";
import { removeFromArray } from "../removeFromArray";
import Animation from "../Animation";
import Tree from "../Tree";
import Safe from "../Safe";
import Chest from "../Chest";
import { sharedGameState } from "../sharedGameState";
import { ValueSignal } from "../utils/ValueSignal";
import { clamp } from "../clamp";
import { getTileType } from "../tileTypeCache";

const __walkSpeed = 0.5;
const __tempPos = new Vector3();

export class CharacterHolder extends Object3D {
  party: boolean = false;

  character: Character | undefined;
  worldspaceUiCoinTarget: Object3D;
  constructor(
    public scene: Scene,
    public world: World,
    public animationManager: AnimationManager,
    public altWorldspaceUiCoinTarget?: Object3D,
    private coinsInPocket = new ValueSignal(0),
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

    for (const item of this.world.items) {
      const p = item.position.clone();
      p.applyMatrix4(item.parent!.matrixWorld);
      if (xzDist(p, this.position) <= 1.8) {
        // console.log("ding");
        this.world.itemsToDelete.push(item);
        this.scene.attach(item);
        const origin = item.position.clone();
        let coinAdded = false;
        this.animationManager.animations.push(
          new Animation(
            (v) => {
              item.scale.setScalar((1 - v * 0.75) * item.userData.defaultScale);
              item.position.copy(origin);
              item.position.y += v * 10;
              item.position.lerp(this.worldspaceUiCoinTarget.position, v * v);
              if (!coinAdded && v > 0.85) {
                this.coinsInPocket.value++;
                coinAdded = true;
              }
            },
            () => this.scene.remove(item),
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
      const tileMesh = this.world.mapCache.get(locationKey)!;
      if (tileMesh.name === "water") {
        console.log("water");
        __tempPos.x = clamp(
          this.position.x,
          tileMesh.position.x - (getTileType(cx - 1, cy) === "water" ? 4 : 3),
          tileMesh.position.x + (getTileType(cx + 1, cy) === "water" ? 4 : 3),
        );
        __tempPos.z = clamp(
          this.position.z,
          tileMesh.position.z - (getTileType(cx, cy - 1) === "water" ? 4 : 3),
          tileMesh.position.z + (getTileType(cx, cy + 1) === "water" ? 4 : 3),
        );
        const dist = xzDist(__tempPos, this.position);
        const dx = __tempPos.x - this.position.x;
        const dz = __tempPos.z - this.position.z;
        const a = Math.atan2(dz, dx);
        const gap = dist - 2;
        this.position.x += Math.cos(a) * gap;
        this.position.z += Math.sin(a) * gap;
      } else if (
        this.world.knownChests.includes(locationKey) &&
        !this.world.openedChests.includes(locationKey)
      ) {
        // console.log("open");
        const tileMesh = this.world.mapCache.get(locationKey)!;
        const chest = tileMesh.getObjectByName("chest")!;
        const p = chest.position.clone();
        p.applyMatrix4(chest.parent!.matrixWorld);
        const dist = xzDist(p, this.position);
        if (dist <= 2.2) {
          if (chest instanceof Chest) {
            if (chest.health > 0) {
              chest.shake = 0.2;
              chest.health--;
            } else {
              this.world.openedChests.push(locationKey);
              this.scene.attach(chest);
              chest.open();
              const origin = chest.position.clone();
              const origScale = chest.scale.x;
              const hinges = chest.getObjectByName("hinges");
              if (hinges) {
                this.animationManager.animations.push(
                  new Animation(
                    (v) => {
                      hinges.rotation.x = v * 2;
                    },
                    () => {
                      this.animationManager.animations.push(
                        new Animation(
                          (v) => {
                            const v2 = v * v * v * v;
                            chest.scale.setScalar((1 - v2 * 0.95) * origScale);
                            chest.position.copy(origin);
                            chest.position.y -= v2 * 0.2;
                            // chest.position.lerp(this.position, v * v);
                          },
                          () => this.scene.remove(chest),
                          0.01,
                        ),
                      );
                    },
                    0.02,
                  ),
                );
              }
            }
          }
          const dx = p.x - this.position.x;
          const dz = p.z - this.position.z;
          const a = Math.atan2(dz, dx);
          const gap = dist - 2.2;
          this.position.x += Math.cos(a) * gap;
          this.position.z += Math.sin(a) * gap;
        }
      } else if (this.world.knownSafes.includes(locationKey)) {
        // console.log("deposit");
        const tileMesh = this.world.mapCache.get(locationKey)!;
        const safe = tileMesh.getObjectByName("safe")!;
        const p = safe.position.clone();
        p.applyMatrix4(safe.parent!.matrixWorld);
        const dist = xzDist(p, this.position);
        if (dist <= 3.2) {
          if (safe instanceof Safe) {
            safe.shake = 0.2;
            safe.deposit(
              sharedGameState.coinsInPocket,
              sharedGameState.walletAddress,
              sharedGameState.coinsInPocket.value,
            );
          }
          const dx = p.x - this.position.x;
          const dz = p.z - this.position.z;
          const a = Math.atan2(dz, dx);
          const gap = dist - 3.2;
          this.position.x += Math.cos(a) * gap;
          this.position.z += Math.sin(a) * gap;
        }
      } else if (
        this.world.knownTrees.includes(locationKey) &&
        !this.world.harvestedTrees.includes(locationKey)
      ) {
        // console.log("chop");
        const tileMesh = this.world.mapCache.get(locationKey)!;
        const tree = tileMesh.getObjectByName("tree")!;
        const p = tree.position.clone();
        p.applyMatrix4(tree.parent!.matrixWorld);
        const dist = xzDist(p, this.position);
        if (dist <= 1.8) {
          if (tree instanceof Tree) {
            if (tree.health > 0) {
              tree.shake = 0.2;
              tree.health--;
            } else {
              this.world.harvestedTrees.push(locationKey);
              const leaves: Object3D[] = [];
              tree.traverse((n) => {
                if (n.name.includes("leaves")) {
                  leaves.push(n);
                }
              });
              for (const n of leaves) {
                this.scene.attach(n);
                const origin = n.position.clone();
                const dest = tileMesh.position.clone();
                dest.sub(n.position);
                dest.y = 0;
                dest.normalize().multiplyScalar(-6);
                dest.add(tileMesh.position);
                dest.y = 3;
                this.animationManager.animations.push(
                  new Animation(
                    (v) => {
                      n.scale.setScalar(1 - v);
                      n.position.copy(origin);
                      n.position.y += v * 10;
                      n.position.lerp(dest, v * v);
                    },
                    () => this.scene.remove(n),
                    0.02,
                  ),
                );
              }
              loadGLTF("tree-basic.glb").then((gltf) => {
                const wood: Object3D[] = [];
                const treeMesh = tree.getObjectByName("tree")!.children[0];
                gltf.scene.traverse((n) => {
                  n.receiveShadow = true;
                  n.castShadow = true;
                  if (
                    (n.name.includes("wood") || n.name.includes("stump")) &&
                    !n.name.includes("_")
                  ) {
                    const myWood = n.clone();
                    myWood.userData.defaultScale = TREE_SCALE;
                    wood.push(myWood);
                    treeMesh.add(myWood);
                    this.scene.attach(myWood);
                    if (n.name.includes("stump")) {
                      tree.attach(myWood);
                    } else {
                      const origin = myWood.position.clone();
                      const origRot = myWood.rotation.clone();
                      const dest = tileMesh.position.clone();
                      dest.sub(myWood.position);
                      dest.y = 0;
                      dest.normalize().multiplyScalar(-1 * myWood.position.y);
                      dest.add(tileMesh.position);
                      dest.y = 0;
                      const playerVec = this.position.clone();
                      playerVec.sub(tileMesh.position);
                      playerVec.y = 0;
                      playerVec.normalize().multiplyScalar(-4);
                      dest.add(playerVec);
                      const newRotY = Math.random() * Math.PI * 2;
                      this.animationManager.animations.push(
                        new Animation(
                          (v) => {
                            const iv = 1 - v;
                            myWood.position.copy(origin);
                            myWood.position.y += v * 3;
                            myWood.position.lerp(dest, v * v);
                            myWood.rotation.copy(origRot);
                            myWood.rotation.x *= iv;
                            myWood.rotation.y *= iv;
                            myWood.rotation.y += v * newRotY;
                            myWood.rotation.z *= iv;
                          },
                          () => {
                            this.world.addItem(myWood);
                          },
                          0.2 / myWood.position.y,
                        ),
                      );
                    }
                  }
                });
                treeMesh.parent!.remove(treeMesh);
              });
            }
          }
          const dx = p.x - this.position.x;
          const dz = p.z - this.position.z;
          const a = Math.atan2(dz, dx);
          const gap = dist - 1.8;
          this.position.x += Math.cos(a) * gap;
          this.position.z += Math.sin(a) * gap;
        }
      } else if (this.world.availableTowers.includes(locationKey)) {
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
