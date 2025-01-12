import { Mesh, Object3D } from "three";
import { loadGLTF } from "./utils/loadGLTF";

export default class WorkbenchCrude extends Object3D {
  shake = 0;
  constructor() {
    super();
    this.name = "workbench-crude";
    loadGLTF("workbench-crude.glb").then((gltf) => {
      gltf.scene.traverse((n) => {
        n.receiveShadow = true;
        n.castShadow = true;
      });
      const workbench = gltf.scene.getObjectByName("workbench-crude");
      if (workbench instanceof Object3D) {
        const myWorkbench = workbench.clone();
        let mesh: Mesh | undefined;
        myWorkbench.traverse((n) => {
          if (n instanceof Mesh) {
            mesh = n;
          }
        });
        if (mesh) {
          mesh.onBeforeRender = () => {
            if (this.shake > 0) {
              this.shake -= 0.01;
            }
            const t = performance.now() * 0.005;
            myWorkbench.rotation.x = Math.sin(t * 15.5) * this.shake * 0.1;
            myWorkbench.rotation.z = Math.cos(t * 15.5) * this.shake * 0.1;
            // box.position.y = rotationRef.y + Math.sin(t * 0.75);
          };
        }
        this.add(myWorkbench);
      }
    });
  }
}
