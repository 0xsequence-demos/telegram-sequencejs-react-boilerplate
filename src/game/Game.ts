import {
  CameraHelper,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import Character from "./character/Character";
import makeSequenceLogo from "./makeSequenceLogo";
import AnimatedNumber from "./utils/AnimatedNumber";
import { loadGLTF } from "./utils/loadGLTF";
import { Easing } from "./utils/easing";
import { lerp, wrapRange } from "./utils/math";
import { clamp } from "./clamp";
import { getChamferedBoxGeometry } from "./geometry/chamferedBoxGeometry";
import { getSharedPlaneGeometry } from "./getSharedPlaneGeometry";
import { randFloatSpread } from "three/src/math/MathUtils.js";
import { searchParams } from "./character/searchParams";

const debug = searchParams.has("debug");

const LIGHT_COLOR_SKY = 0xffffff;
const LIGHT_COLOR_GROUND = 0xafafaf;

const sunDist = 50;

const mapReachTiles = 6;
const distPerTile = 10;
const mapReachDist = mapReachTiles * distPerTile;

const __tempColor = new Color();
const __tempColor2 = new Color();
export default class Game {
  paused = false;
  party: boolean = false;
  character: Character | undefined;
  partyFloat = new AnimatedNumber(0, 0.01);

  constructor() {
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const lightAmbient = new HemisphereLight(
      LIGHT_COLOR_SKY,
      LIGHT_COLOR_GROUND,
      2,
    );
    const sun = new DirectionalLight(0xffffff, 2);
    sun.castShadow = true;
    sun.shadow.camera.far = sunDist * 2;
    if (debug) {
      const dlh = new DirectionalLightHelper(sun);
      const dlh2 = new CameraHelper(sun.shadow.camera);
      scene.add(dlh);
      scene.add(dlh2);
    }
    const d = mapReachDist * 0.5;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = -d;
    sun.shadow.camera.bottom = d;
    sun.shadow.mapSize.setScalar(1024);
    sun.shadow.autoUpdate = true;
    sun.shadow.bias = -0.0005;
    scene.add(sun.target);
    scene.add(lightAmbient);
    scene.add(sun);
    const logoHolder = new Object3D();
    scene.add(logoHolder);
    makeSequenceLogo().then((logo) => {
      logo.position.set(0, -1.9, -2);
      logo.scale.multiplyScalar(5);
      logoHolder.add(logo);
    });
    const floor = new Mesh(
      new PlaneGeometry(10, 10),
      new MeshStandardMaterial({ color: 0x7f7f7f }),
    );
    floor.receiveShadow = true;
    floor.position.y = 0.1;
    floor.rotation.x = Math.PI * -0.5;
    // scene.add(floor);
    sun.position.set(sunDist, sunDist, 0);
    sun.lookAt(new Vector3(0, 0, 0));
    const charHolder = new Object3D();
    scene.add(charHolder);
    loadGLTF("quinn-the-bot.glb").then((gltf) => {
      gltf.scene.traverse((n) => {
        n.receiveShadow = true;
        n.castShadow = true;
      });
      this.character = new Character(gltf.scene, charHolder);
    });

    const boom = new Object3D();
    const boomVirtualPivot = new Object3D();
    boom.add(boomVirtualPivot);
    boom.rotation.order = "YXZ";
    scene.add(boom);
    camera.position.z = 0;
    boomVirtualPivot.position.z = 0;
    const boomDist = 8;
    const camDist = 10;
    boom.position.z = -boomDist;
    boom.position.y = 1.75;
    camera.rotateY(Math.PI);
    camera.position.z = -camDist;
    boom.add(camera);
    let lastTime = performance.now() * 0.001;
    const keysDown = new Map<string, boolean>();
    const walkSpeed = 0.5;
    const walkSpeedDelta = 0.05;
    let walkSpeedX = 0;
    let walkSpeedY = 0;
    let angleTarget = 0;

    const mapCache = new Map<string, Mesh>();

    this.render = (renderer: WebGLRenderer) => {
      if (this.paused) {
        return;
      }
      const time = performance.now() * 0.001;
      const deltaTime = time - lastTime;
      lastTime = time;
      if (this.character) {
        this.character.happiness.target = this.party ? 1 : 0;
        this.character.update(time);
      }
      lightAmbient.color.set(LIGHT_COLOR_SKY);
      lightAmbient.groundColor.set(LIGHT_COLOR_GROUND);
      this.partyFloat.target = this.party ? 1 : 0;
      this.partyFloat.update(deltaTime);
      const partyAnim = Easing.Quadratic.InOut(this.partyFloat.value);
      camera.position.z = lerp(-12, -camDist, partyAnim);
      camera.position.y = lerp(0, 6, partyAnim);
      const dp = boomVirtualPivot.position
        .clone()
        .applyMatrix4(boom.matrixWorld);
      const dc = charHolder.position.clone();
      const d = dp.clone().sub(dc);
      const a = Math.atan2(d.z, d.x);

      if (partyAnim > 0.25) {
        let y = false;
        if (keysDown.get("KeyW") || keysDown.get("ArrowUp")) {
          walkSpeedY = clamp(
            Math.max(0, walkSpeedY + walkSpeedDelta),
            -walkSpeed,
            walkSpeed,
          );
          y = true;
        }
        if (keysDown.get("KeyS") || keysDown.get("ArrowDown")) {
          walkSpeedY = clamp(
            Math.min(0, walkSpeedY - walkSpeedDelta),
            -walkSpeed,
            walkSpeed,
          );
          y = true;
        }
        if (!y) {
          const sign = Math.sign(walkSpeedY);
          const mag = Math.abs(walkSpeedY);
          walkSpeedY = Math.max(0, mag - walkSpeedDelta) * sign;
        }
        let x = false;
        if (keysDown.get("KeyA") || keysDown.get("ArrowLeft")) {
          walkSpeedX = clamp(
            Math.min(0, walkSpeedX - walkSpeedDelta),
            -walkSpeed,
            walkSpeed,
          );
          x = true;
        }
        if (keysDown.get("KeyD") || keysDown.get("ArrowRight")) {
          walkSpeedX = clamp(
            Math.max(0, walkSpeedX + walkSpeedDelta),
            -walkSpeed,
            walkSpeed,
          );
          x = true;
        }
        if (!x) {
          const sign = Math.sign(walkSpeedX);
          const mag = Math.abs(walkSpeedX);
          walkSpeedX = Math.max(0, mag - walkSpeedDelta) * sign;
        }
        const charMove = charHolder.position.clone();
        charHolder.position.x -= Math.cos(a + Math.PI * 0.5) * walkSpeedX;
        charHolder.position.z -= Math.sin(a + Math.PI * 0.5) * walkSpeedX;
        charHolder.position.x -= Math.cos(a) * walkSpeedY;
        charHolder.position.z -= Math.sin(a) * walkSpeedY;
        charMove.sub(charHolder.position);
        if (charMove.length() > 0.01) {
          angleTarget = Math.atan2(-charMove.z, charMove.x) + Math.PI * 0.5;
        }
        let ad = charHolder.rotation.y - angleTarget;
        if (ad > Math.PI) {
          ad -= Math.PI * 2;
        } else if (ad < -Math.PI) {
          ad += Math.PI * 2;
        }
        charHolder.rotation.y -= ad * 0.5;
        boom.rotation.y = -a - Math.PI * 0.5;
        boom.position.x -=
          (boom.position.x -
            (Math.cos(a + Math.PI) * -boomDist + charHolder.position.x)) *
          0.2;
        boom.position.z -=
          (boom.position.z -
            (Math.sin(a + Math.PI) * -boomDist + charHolder.position.z)) *
          0.2;
      }

      sun.position.set(sunDist, sunDist, 0).add(charHolder.position);
      sun.target.position.copy(charHolder.position);

      const cx = Math.round(charHolder.position.x / distPerTile);
      const cy = Math.round(charHolder.position.z / distPerTile);
      for (let iy = cy - mapReachTiles; iy <= cy + mapReachTiles; iy++) {
        for (let ix = cx - mapReachTiles; ix <= cx + mapReachTiles; ix++) {
          const x = ix * distPerTile;
          const y = iy * distPerTile;
          const dx = charHolder.position.x - x;
          const dy = charHolder.position.z - y;
          const tileScale =
            (mapReachDist - Math.sqrt(dx * dx + dy * dy)) / mapReachDist;
          const key = `${x};${y}`;
          const tileExists = mapCache.has(key);
          if (!tileExists && tileScale > 0) {
            const mesh = new Mesh(
              getSharedPlaneGeometry(),
              new MeshStandardMaterial({
                color: new Color(
                  0.3,
                  lerp(((ix * 37 + iy * 19 + 9) % 10) / 10, 0.6, 0.8),
                  0.2,
                ),
                roughness: 0.75,
                metalness: 0,
                emissive: 0x171e2c,
              }),
            );
            mesh.receiveShadow = true;
            getChamferedBoxGeometry(distPerTile, 2, distPerTile, 0.25).then(
              (g) => (mesh.geometry = g),
            );
            if ((ix * 37 + iy * 19 + 19) % wrapRange(ix + iy, 11, 21) === 0) {
              getChamferedBoxGeometry(4, 2, 4, 0.5).then((g) => {
                for (let i = 0; i < 5; i++) {
                  const leaves = new Mesh(
                    g,
                    new MeshStandardMaterial({
                      color: 0x17ae2c,
                      roughness: 0.75,
                      metalness: 0,
                      emissive: 0x171e2c,
                    }),
                  );
                  leaves.position.set(
                    randFloatSpread(6),
                    randFloatSpread(4) + 6,
                    randFloatSpread(6),
                  );
                  leaves.rotation.set(
                    randFloatSpread(1),
                    randFloatSpread(1),
                    randFloatSpread(1),
                  );
                  mesh.add(leaves);
                  leaves.receiveShadow = true;
                  leaves.castShadow = true;
                }
              });
              getChamferedBoxGeometry(1, 6, 1, 0.25).then((g) => {
                const trunk = new Mesh(
                  g,
                  new MeshStandardMaterial({
                    color: 0x572e2c,
                    roughness: 0.75,
                    metalness: 0,
                    emissive: 0x171e2c,
                  }),
                );
                trunk.position.set(randFloatSpread(1), 4, randFloatSpread(1));
                trunk.rotation.set(
                  randFloatSpread(0.4),
                  randFloatSpread(0.4),
                  randFloatSpread(0.4),
                );
                mesh.add(trunk);
                trunk.receiveShadow = true;
                trunk.castShadow = true;
              });
            } else if (
              (ix * 47 + iy * 19 + 91) % wrapRange(ix + iy, 24, 31) <
              3
            ) {
              getChamferedBoxGeometry(2, 1, 2, 0.25).then((g) => {
                const t = ((x * 17 + y * 9 + 21) % 5) + 2;
                for (let i = 0; i < t; i++) {
                  const rock = new Mesh(
                    g,
                    new MeshStandardMaterial({
                      color: 0x777e9c,
                      roughness: 0.75,
                      metalness: 0,
                    }),
                  );
                  rock.position.set(
                    randFloatSpread(6),
                    randFloatSpread(0.5) + 1,
                    randFloatSpread(6),
                  );
                  rock.rotation.set(
                    randFloatSpread(1),
                    randFloatSpread(1),
                    randFloatSpread(1),
                  );
                  rock.receiveShadow = true;
                  rock.castShadow = true;
                  mesh.add(rock);
                }
              });
            }
            mesh.position.set(x, -1, y);
            mesh.rotation.set(
              randFloatSpread(0.05),
              randFloatSpread(0.05),
              randFloatSpread(0.05),
            );
            mesh.scale.setScalar(0.001);
            scene.add(mesh);
            mapCache.set(key, mesh);
          } else if (tileExists && tileScale <= 0) {
            const m = mapCache.get(key)!;
            scene.remove(m);
            mapCache.delete(key);
          } else if (tileExists) {
            const m = mapCache.get(key)!;
            m.scale.setScalar(partyAnim * (1 - Math.pow(1 - tileScale, 3)));
          }
        }
      }
      if (partyAnim > 0.001) {
        __tempColor.setHSL(time * 0.5, 0.5, 0.75);
        lightAmbient.color.lerp(__tempColor, partyAnim);
        __tempColor2.setHSL(time * 0.5 - 0.1, 0.8, 0.2);
        lightAmbient.groundColor.lerp(__tempColor2, partyAnim);
      }
      __tempColor.set(0x3f3f3f).lerp(__tempColor2, partyAnim);

      logoHolder.scale.setScalar(1 - partyAnim);
      logoHolder.position.set(
        charHolder.position.x,
        -partyAnim,
        charHolder.position.z,
      );
      logoHolder.visible = partyAnim < 0.995;

      renderer.setClearColor(__tempColor.getHex());
      renderer.render(scene, camera);
    };
    window.addEventListener("resize", (ev) => {
      void ev;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
    let usingTouch = false;
    window.addEventListener("mousemove", (ev) => {
      if (usingTouch) {
        return;
      }
      void ev;
      // boomRotationTargetY = (ev.clientX / window.innerWidth - 0.5) * 1;
      // boomRotationTargetX = -(ev.clientY / window.innerHeight - 0.5) * 0.5;
    });
    window.addEventListener("touchstart", (ev) => {
      void ev;
      usingTouch = true;
    });
    window.addEventListener("keydown", (e) => {
      keysDown.set(e.code, true);
    });
    window.addEventListener("keyup", (e) => {
      keysDown.set(e.code, false);
    });
  }

  render: (renderer: WebGLRenderer) => void;

  cleanup() {}
}
