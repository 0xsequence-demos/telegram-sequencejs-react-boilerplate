import {
  CameraHelper,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import makeSequenceLogo from "./makeSequenceLogo";
import AnimatedNumber from "./utils/AnimatedNumber";
import { Easing } from "./utils/easing";
import { dist2, dist2Manhattan, lerp, remap } from "./utils/math";
import { searchParams } from "./character/searchParams";
import { makeTile } from "./makeTile";
import {
  distPerTile,
  mapReachDist,
  mapReachTiles,
  sunDist,
  uiCoinScreenX,
  uiCoinScreenY,
} from "./constants";
import { removeFromArray } from "./removeFromArray";
import Coin from "./Coin";
import CameraTruck from "./CameraTruck";
import JoystickRing from "./JoystickRing";
import { CharacterHolder } from "./character/CharacterHolder";
import World from "./World";
import AnimationManager from "./AnimationManager";
import PlayerCharacterController from "./PlayerCharacterController";
import BotCharacterController from "./BotCharacterController";
import { randFloatSpread } from "three/src/math/MathUtils.js";

const debug = searchParams.has("debug");
const mouseTouch = searchParams.has("mouseTouch");

const LIGHT_COLOR_SKY = 0xffffff;
const LIGHT_COLOR_GROUND = 0xafafaf;

const __tempColor = new Color();
const __tempColor2 = new Color();

export default class Game {
  paused = false;
  party: boolean = false;
  partyFloat = new AnimatedNumber(0, 0.01);
  playerController: PlayerCharacterController;
  botControllers: BotCharacterController[] = [];
  allControllers: Array<BotCharacterController | PlayerCharacterController> =
    [];
  camera: PerspectiveCamera;
  camTruck: CameraTruck;
  usingTouch = false;
  uiCoin: Coin;
  keysDown = new Map<string, boolean>();
  scene: Scene;
  uiCamera: OrthographicCamera;
  uiScene: Scene;
  worldspaceUiCoinTarget: Object3D;
  activeTouchIds: number[] = [];
  idledTime = 10;

  constructor() {
    const uiScene = new Scene();
    const uiCamera = new OrthographicCamera(0, 1920, 1080, 0, -1000, 1000);
    uiScene.add(uiCamera);
    this.uiScene = uiScene;
    this.uiCamera = uiCamera;
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.scene = scene;
    this.camera = camera;
    const camDist = 4;
    const camTruck = new CameraTruck(camera, camDist, 8);
    this.camTruck = camTruck;
    scene.add(camTruck);
    const lightAmbient = new HemisphereLight(
      LIGHT_COLOR_SKY,
      LIGHT_COLOR_GROUND,
      2,
    );
    const worldspaceUiCoinTarget = new Mesh(
      new SphereGeometry(1, 16, 8),
      new MeshBasicMaterial({
        wireframe: true,
        color: 0xff0000,
        visible: false,
      }),
    );
    this.worldspaceUiCoinTarget = worldspaceUiCoinTarget;
    scene.add(worldspaceUiCoinTarget);
    camera.updateProjectionMatrix();
    const sun = new DirectionalLight(0xffffff, 2);
    sun.position.set(sunDist, sunDist, 0);
    sun.lookAt(new Vector3(0, 0, 0));
    const uiSun = sun.clone();
    uiSun.position.set(50, 7, 0);
    uiSun.lookAt(new Vector3(0, 0, 0));
    uiScene.add(uiSun);
    const uiLightAmbient = lightAmbient.clone();
    uiScene.add(uiLightAmbient);
    sun.castShadow = true;
    sun.shadow.camera.far = sunDist * 2;
    if (debug) {
      const dlh = new DirectionalLightHelper(sun);
      const dlh2 = new CameraHelper(sun.shadow.camera);
      scene.add(dlh);
      scene.add(dlh2);
    }
    const uiCoin = new Coin(false, true, true);
    uiCoin.material.depthTest = false;
    this.uiCoin = uiCoin;
    uiScene.add(uiCoin);
    uiCoin.scale.setScalar(50);
    this.updateUiCoinTarget();
    this.updateScreen();
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

    let lastTime = performance.now() * 0.001;
    const world = new World();
    const animationManager = new AnimationManager();

    const playerCharHolder = new CharacterHolder(
      scene,
      world,
      animationManager,
      worldspaceUiCoinTarget,
    );
    scene.add(playerCharHolder);

    this.playerController = new PlayerCharacterController(
      playerCharHolder,
      this.keysDown,
      camTruck,
    );
    this.allControllers.push(this.playerController);

    for (let i = 0; i < 10; i++) {
      const botCharHolder = new CharacterHolder(scene, world, animationManager);
      scene.add(botCharHolder);

      const bc = new BotCharacterController(botCharHolder);
      this.botControllers.push(bc);
      this.allControllers.push(bc);
    }

    function makeCoins() {
      for (let i = 0; i < 1000; i++) {
        const coin = new Coin(true, false, false);
        coin.position.x = randFloatSpread(20);
        coin.position.y = 1.5;
        coin.position.z = randFloatSpread(20);
        scene.add(coin);
        world.items.push(coin);
      }
    }

    this.render = (renderer: WebGLRenderer) => {
      if (this.paused) {
        return;
      }
      if (world.items.length === 0) {
        makeCoins();
      }
      const time = performance.now() * 0.001;
      const deltaTime = time - lastTime;
      lastTime = time;

      const cx = Math.round(playerCharHolder.position.x / distPerTile);
      const cy = Math.round(playerCharHolder.position.z / distPerTile);

      lightAmbient.color.set(LIGHT_COLOR_SKY);
      lightAmbient.groundColor.set(LIGHT_COLOR_GROUND);
      this.partyFloat.target = this.party ? 1 : 0;
      this.partyFloat.update(deltaTime);
      const partyAnim = Easing.Quadratic.InOut(this.partyFloat.value);
      camera.position.z = lerp(-12, -camDist, partyAnim);
      camera.position.y = lerp(0, 6, partyAnim);

      if (partyAnim > 0.25) {
        const joystick =
          this.activeTouchIds.length > 0
            ? this.joystickRings.get(this.activeTouchIds[0])
            : undefined;
        this.playerController.update(joystick, deltaTime);
        for (const bc of this.botControllers) {
          bc.update(deltaTime);
        }
        for (let i = 0; i < this.allControllers.length; i++) {
          const actorA = this.allControllers[i];
          const ax = actorA.charHolder.position.x;
          const ay = actorA.charHolder.position.z;
          for (let j = i + 1; j < this.allControllers.length; j++) {
            const actorB = this.allControllers[j];
            const bx = actorB.charHolder.position.x;
            const by = actorB.charHolder.position.z;
            const dx = ax - bx;
            const dy = ay - by;
            if (dist2Manhattan(dx, dy) < 2) {
              const len = dist2(dx, dy);
              if (len < 2) {
                const a = Math.atan2(dy, dx);
                const push = (len - 2) * -0.25;
                actorA.charHolder.position.x += Math.cos(a) * push;
                actorA.charHolder.position.z += Math.sin(a) * push;
                actorB.charHolder.position.x += Math.cos(a + Math.PI) * push;
                actorB.charHolder.position.z += Math.sin(a + Math.PI) * push;
              }
            }
          }
        }
      }

      sun.position.set(sunDist, sunDist, 0).add(playerCharHolder.position);
      sun.target.position.copy(playerCharHolder.position);

      this.updateUiCoinTarget();

      // this.uiCoin.updateMatrixWorld();
      // this.uiCoin.lookAt(new Vector3(0, 12, 0));
      // this.uiCoin.updateMatrix();

      animationManager.update(deltaTime);
      const playerX = playerCharHolder.position.x;
      const playerY = playerCharHolder.position.z;

      for (let iy = cy - mapReachTiles; iy <= cy + mapReachTiles; iy++) {
        for (let ix = cx - mapReachTiles; ix <= cx + mapReachTiles; ix++) {
          const x = ix * distPerTile;
          const y = iy * distPerTile;
          const dx = playerX - x;
          const dy = playerY - y;
          const tileScale =
            (mapReachDist - Math.sqrt(dx * dx + dy * dy)) / mapReachDist;
          const key = `${ix};${iy}`;
          const tileExists = world.mapCache.has(key);
          if (!tileExists && tileScale > 0) {
            const mesh = makeTile(ix, iy);
            // const mesh = makeTile(ix, iy, !world.foundCoins.includes(key));
            // if (mesh.userData.coin && !world.knownCoins.includes(key)) {
            //   world.knownCoins.push(key);
            //   world.availableCoins.push(key);
            // }
            if (mesh.userData.tree && !world.knownTrees.includes(key)) {
              world.knownTrees.push(key);
              world.availableTrees.push(key);
            }
            if (mesh.userData.tower && !world.knownTowers.includes(key)) {
              world.knownTowers.push(key);
              world.availableTowers.push(key);
            }
            scene.add(mesh);
            world.mapCache.set(key, mesh);
          } else if (tileExists && tileScale <= 0) {
            const m = world.mapCache.get(key)!;
            scene.remove(m);
            world.mapCache.delete(key);
          } else if (tileExists) {
            const m = world.mapCache.get(key)!;
            m.scale.setScalar(partyAnim * (1 - Math.pow(1 - tileScale, 3)));
            m.position.y = -5 * Math.pow(1 - tileScale, 3) - 1;
          }
        }
      }
      for (const bc of this.botControllers) {
        const dx = playerX - bc.charHolder.position.x;
        const dy = playerY - bc.charHolder.position.z;
        const actorScale = (mapReachDist - dist2(dx, dy)) / mapReachDist;
        bc.charHolder.scale.setScalar(1 - Math.pow(1 - actorScale, 3));
        bc.charHolder.position.y = -5 * Math.pow(1 - actorScale, 3);
      }
      for (const item of world.items) {
        const dx = playerX - item.position.x;
        const dy = playerY - item.position.z;
        const itemScale = (mapReachDist - dist2(dx, dy)) / mapReachDist;
        item.scale.setScalar(1 - Math.pow(1 - itemScale, 3));
        item.position.y = -5 * Math.pow(1 - itemScale, 3) + 1;
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
        playerCharHolder.position.x,
        -partyAnim,
        playerCharHolder.position.z,
      );
      logoHolder.visible = partyAnim < 0.995;

      renderer.setClearColor(__tempColor.getHex());
      renderer.clear();
      // cookieCutter.visible = false;
      // camera.near = 10;
      // camera.far = 1000;
      // camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      // renderer.clearDepth();
      // cookieCutter.visible = true;
      // camera.near = 0.1;
      // camera.far = 10;
      // camera.updateProjectionMatrix();
      // renderer.render(scene, camera);
      renderer.render(uiScene, uiCamera);
    };
    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchstart", this.onTouchStart);
    window.addEventListener("touchmove", this.onTouchMove);
    window.addEventListener("touchend", this.onTouchEnd);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    if (mouseTouch) {
      window.addEventListener("mousedown", this.onMouseTouchDown);
      window.addEventListener("mousemove", this.onMouseTouchMove);
      window.addEventListener("mouseup", this.onMouseTouchUp);
    }
  }
  updateUiCoinTarget() {
    this.camTruck.updateMatrixWorld();
    this.worldspaceUiCoinTarget.position.set(
      remap(0, window.innerWidth, -1, 1, uiCoinScreenX),
      remap(0, window.innerHeight, -1, 1, window.innerHeight - uiCoinScreenY),
      0.967,
    );
    const pm = this.camera.projectionMatrix.clone().invert();
    const wm = this.camera.matrixWorld;
    this.worldspaceUiCoinTarget.position.applyMatrix4(pm);
    this.worldspaceUiCoinTarget.position.applyMatrix4(wm);
    this.worldspaceUiCoinTarget.updateMatrix();
    this.worldspaceUiCoinTarget.updateMatrixWorld();
    // this.worldspaceUiCoinTarget.position.set(0, 0, 0);
    // this.worldspaceUiCoinTarget.rotation.set(0, 0, 0);
    // this.worldspaceUiCoinTarget.applyMatrix4(this.uiCoin.matrixWorld);
  }

  pointers = new Map<number, [number, number]>();
  joystickRings = new Map<number, JoystickRing>();
  private pointerStart(x: number, y: number, id: number) {
    const fixedY = window.innerHeight - y;
    this.activeTouchIds.push(id);
    this.pointers.set(id, [x, fixedY]);
    const joystickRing = new JoystickRing();
    this.uiScene.add(joystickRing);
    joystickRing.position.set(x, fixedY, 0);
    this.joystickRings.set(id, joystickRing);
  }

  private pointerMove(x: number, y: number, id: number) {
    const fixedY = window.innerHeight - y;
    const p = this.pointers.get(id);
    if (p) {
      p[0] = x;
      p[1] = fixedY;
    }
    const j = this.joystickRings.get(id);
    if (j) {
      const dx = x - j.position.x;
      const dy = fixedY - j.position.y;
      const a = Math.atan2(dy, dx);
      const d = Math.min(50, dist2(dx, dy));

      j.inner.position.x = Math.cos(a) * d;
      j.inner.position.y = Math.sin(a) * d;
    }
  }

  private pointerEnd(x: number, y: number, id: number) {
    void x;
    void y;
    this.pointers.delete(id);
    const j = this.joystickRings.get(id);
    if (j) {
      this.uiScene.remove(j);
      this.joystickRings.delete(id);
    }
    removeFromArray(this.activeTouchIds, id);
  }

  onResize = (ev: UIEvent) => {
    void ev;
    this.updateScreen();
  };
  private updateScreen() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.uiCamera.right = window.innerWidth;
    this.uiCamera.top = window.innerHeight;
    this.uiCamera.updateProjectionMatrix();
    this.updateUiCoinTarget();
    this.uiCoin.position.x = uiCoinScreenX;
    this.uiCoin.position.y = window.innerHeight - uiCoinScreenY;
  }
  onTouchStart = (ev: TouchEvent) => {
    ev.preventDefault();
    this.usingTouch = true;
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const touch = ev.changedTouches.item(i)!;
      this.pointerStart(touch.clientX, touch.clientY, touch.identifier);
    }
  };
  onTouchMove = (ev: TouchEvent) => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const touch = ev.changedTouches.item(i)!;
      this.pointerMove(touch.clientX, touch.clientY, touch.identifier);
    }
  };
  onTouchEnd = (ev: TouchEvent) => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const touch = ev.changedTouches.item(i)!;
      this.pointerEnd(touch.clientX, touch.clientY, touch.identifier);
    }
  };
  onMouseMove = (ev: MouseEvent) => {
    if (this.usingTouch) {
      return;
    }
    void ev;
    // boomRotationTargetY = (ev.clientX / window.innerWidth - 0.5) * 1;
    // boomRotationTargetX = -(ev.clientY / window.innerHeight - 0.5) * 0.5;
  };
  onMouseTouchDown = (ev: MouseEvent) => {
    ev.preventDefault();
    this.usingTouch = true;
    this.pointerStart(ev.clientX, ev.clientY, 0);
  };
  onMouseTouchMove = (ev: MouseEvent) => {
    this.pointerMove(ev.clientX, ev.clientY, 0);
  };
  onMouseTouchUp = (ev: MouseEvent) => {
    this.pointerEnd(ev.clientX, ev.clientY, 0);
  };
  onKeyDown = (ev: KeyboardEvent) => {
    this.keysDown.set(ev.code, true);
  };
  onKeyUp = (ev: KeyboardEvent) => {
    this.keysDown.set(ev.code, false);
  };

  render: (renderer: WebGLRenderer) => void;

  cleanup() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    if (mouseTouch) {
      window.removeEventListener("mousedown", this.onMouseTouchDown);
      window.removeEventListener("mousemove", this.onMouseTouchMove);
      window.removeEventListener("mouseup", this.onMouseTouchUp);
    }
  }
}
