import {
  Color,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from "three";
import Character from "./character/Character";
import makeSequenceLogo from "./makeSequenceLogo";
import AnimatedNumber from "./utils/AnimatedNumber";
import { loadGLTF } from "./utils/loadGLTF";
import { Easing } from "./utils/easing";
import { lerp } from "./utils/math";
import { clamp } from "./clamp";

const LIGHT_COLOR_SKY = 0xffffff;
const LIGHT_COLOR_GROUND = 0xafafaf;

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
    const lightDirect = new SpotLight(0xffffff, 200, 20, Math.PI / 12);
    lightDirect.castShadow = true;
    lightDirect.shadow.mapSize.setScalar(1024);
    lightDirect.shadow.autoUpdate = true;
    lightDirect.shadow.bias = -0.0005;
    scene.add(lightAmbient);
    scene.add(lightDirect);
    makeSequenceLogo().then((logo) => {
      logo.position.set(0, -1.9, -2);
      logo.scale.multiplyScalar(5);
      scene.add(logo);
    });
    const floor = new Mesh(
      new PlaneGeometry(10, 10),
      new MeshStandardMaterial({ color: 0x7f7f7f }),
    );
    floor.receiveShadow = true;
    floor.position.y = 0.1;
    floor.rotation.x = Math.PI * -0.5;
    // scene.add(floor);
    lightDirect.position.set(7, 7, -7);
    lightDirect.lookAt(new Vector3(0, 0, 0));
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
      // boom.rotation.x = boomRotationTargetX;
      // boom.position.z -= 0.1 * (boom.position.z - charHolder.position.z);
      // boom.position.x -= 0.1 * (boom.position.x - charHolder.position.x);
      if (partyAnim > 0.001) {
        __tempColor.setHSL(time * 0.5, 0.5, 0.75);
        lightAmbient.color.lerp(__tempColor, partyAnim);
        __tempColor2.setHSL(time * 0.5 - 0.1, 0.8, 0.2);
        lightAmbient.groundColor.lerp(__tempColor2, partyAnim);
      }
      __tempColor.set(0x3f3f3f).lerp(__tempColor2, partyAnim);
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
