import { Material, Mesh, Object3D } from "three";
import { loadGLTF } from "./utils/loadGLTF";
import { ditheredHole } from "./ditheredHole";

export default class Safe extends Object3D {
  deposit() {
    for (const cb of this.onDepositCallbacks) {
      cb();
    }
  }
  onDepositCallbacks: Array<() => void> = [];
  onDeposit(callback: () => void) {
    this.onDepositCallbacks.push(callback);
  }
  shake = 0;
  constructor() {
    super();
    loadGLTF("safe.glb").then((gltf) => {
      gltf.scene.traverse((n) => {
        n.receiveShadow = true;
        n.castShadow = true;
      });
      for (let i = 0; i < gltf.scene.children.length; i++) {
        const box = gltf.scene.children[i];
        if (box instanceof Mesh) {
          const myBox = box.clone();
          myBox.traverse((n) => {
            if (n instanceof Mesh && n.material instanceof Material) {
              n.material.ditheredHole = ditheredHole;
            }
          });
          myBox.onBeforeRender = () => {
            if (this.shake > 0) {
              this.shake -= 0.01;
            }
            const t = performance.now() * 0.005;
            const posDelay =
              (this.parent!.position.x + this.parent!.position.z) * 0.05;
            myBox.rotation.x = Math.sin(t * 15.5 + posDelay) * this.shake * 0.1;
            myBox.rotation.z = Math.cos(t * 15.5) * this.shake * 0.1;
            // box.position.y = rotationRef.y + Math.sin(t * 0.75);
          };
          this.add(myBox);
        }
      }
    });
  }
}
