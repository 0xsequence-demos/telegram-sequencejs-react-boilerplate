import { Material, Mesh, Object3D } from "three";
import { ditheredHole } from "./ditheredHole";
import { loadGLTF } from "./utils/loadGLTF";
import { TREE_SCALE } from "./constants";
const treeSwayStrength = 0.0125;
const leafSwayStrength = 0.025;

export default class Tree extends Object3D {
  shake = 0;
  health = 30;
  constructor(harvested = false) {
    super();
    this.name = harvested ? "stump" : "tree";

    loadGLTF("tree-basic.glb").then((gltf) => {
      gltf.scene.traverse((n) => {
        n.receiveShadow = true;
        n.castShadow = true;
      });
      const tree = gltf.scene.getObjectByName(harvested ? "stump" : "tree")!;
      const myTree = tree.clone();
      myTree.scale.setScalar(TREE_SCALE);
      myTree.rotation.y = Math.random() * 6;

      myTree.traverse((n) => {
        if (n instanceof Mesh && n.material instanceof Material) {
          if (n.material.name === "wood") {
            n.material = n.material.clone();
            if (!n.name.includes("stump")) {
              n.material.ditheredHole = ditheredHole;
            }
          } else if (n.name.includes("leaves")) {
            n.material.ditheredHole = ditheredHole;
            const offsetR = Math.random();
            n.onBeforeRender = () => {
              const t = performance.now() * 0.01 + offsetR;
              const posDelay = this.position.x + this.position.z * 0.2;
              n.rotation.x =
                Math.sin(t * 0.75 + posDelay) * leafSwayStrength +
                Math.sin(t * 5.5 + posDelay) * this.shake;
              n.rotation.z =
                Math.cos(t) * leafSwayStrength + Math.cos(t * 5.5) * this.shake;
            };
          }
        }
      });
      myTree.onBeforeRender = () => {
        if (this.shake > 0) {
          this.shake -= 0.004;
        }
        const t = performance.now() * 0.005;
        const posDelay =
          (this.parent!.position.x + this.parent!.position.z) * 0.05;
        myTree.rotation.x =
          Math.sin(t * 0.75 + posDelay) * treeSwayStrength +
          Math.sin(t * 15.5 + posDelay) * this.shake * 0.1;
        myTree.rotation.z =
          Math.cos(t + posDelay) * treeSwayStrength +
          Math.cos(t * 15.5) * this.shake * 0.1;
      };
      this.add(myTree);
    });
  }
}
