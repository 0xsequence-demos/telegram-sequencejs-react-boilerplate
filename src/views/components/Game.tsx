import { useEffect, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import {
  Color,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from "three";
import Character from "./Game/character/Character";
import { useAccount } from "wagmi";
import { Easing } from "../../utils/easing";
import AnimatedNumber from "../../utils/AnimatedNumber";

const LIGHT_COLOR_SKY = 0xffffff;
const LIGHT_COLOR_GROUND = 0xafafaf;

const __tempColor = new Color();
const __tempColor2 = new Color();
let initd = false;
interface IGameController {
  party: boolean;
  character: Character | undefined;
}
let _gameController: IGameController | undefined;
function initGame(refContainer: React.MutableRefObject<HTMLDivElement | null>) {
  if (initd && _gameController) {
    return _gameController;
  }
  initd = true;
  const gameController: IGameController = {
    character: undefined,
    party: false,
  };
  _gameController = gameController;
  const scene = new Scene();
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  const renderer = new WebGLRenderer();
  renderer.setClearColor(0x3f3f3f);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild( renderer.domElement );
  // use ref as a mount point of the js scene instead of the document.body
  refContainer.current?.appendChild(renderer.domElement);
  const loader = new GLTFLoader();
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
  const floor = new Mesh(
    new PlaneGeometry(10, 10),
    new MeshStandardMaterial({ color: 0x7f7f7f }),
  );
  floor.receiveShadow = true;
  floor.position.y = 0.1;
  floor.rotation.x = Math.PI * -0.5;
  scene.add(floor);
  lightDirect.position.set(7, 7, -7);
  lightDirect.lookAt(new Vector3(0, 0, 0));
  let character: Character | undefined;
  loader.load("quinn-the-bot.glb", (gltf) => {
    gltf.scene.traverse((n) => {
      n.receiveShadow = true;
      n.castShadow = true;
    });
    character = new Character(gltf.scene, scene);
    gameController.character = character;
  });

  const boom = new Object3D();
  boom.rotation.order = "YXZ";
  scene.add(boom);
  camera.position.z = -4;
  boom.position.y = 1.75;
  camera.rotateY(Math.PI);
  boom.add(camera);
  const partyFloat = new AnimatedNumber(0, 0.01);
  let lastTime = performance.now() * 0.001;
  const animate = function () {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    const deltaTime = time - lastTime;
    lastTime = time;
    character?.update(time);
    lightAmbient.color.set(LIGHT_COLOR_SKY);
    lightAmbient.groundColor.set(LIGHT_COLOR_GROUND);
    partyFloat.target = gameController.party ? 1 : 0;
    partyFloat.update(deltaTime);
    const partyAnim = Easing.Quadratic.InOut(partyFloat.value);
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
  animate();
  window.addEventListener("resize", (ev) => {
    void ev;
    console.log("test");
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  let usingTouch = false;
  window.addEventListener("mousemove", (ev) => {
    if (usingTouch) {
      return;
    }
    boom.rotation.y = (ev.clientX / window.innerWidth - 0.5) * 1;
    boom.rotation.x = -(ev.clientY / window.innerHeight - 0.5) * 0.5;
  });
  window.addEventListener("touchstart", (ev) => {
    void ev;
    usingTouch = true;
  });
  return _gameController;
}

function Game() {
  const refContainer = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  useEffect(() => {
    const gc = initGame(refContainer);
    (async () => {
      while (!gc.character) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      gc.character.happiness.target = isConnected ? 1 : 0;
      gc.party = isConnected;
    })();
  }, [isConnected]);
  return <div ref={refContainer}></div>;
}

export default Game;
