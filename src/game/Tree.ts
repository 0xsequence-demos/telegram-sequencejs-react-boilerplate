import { DoubleSide, Mesh, MeshStandardMaterial, Object3D } from "three";
import { getChamferedBoxGeometry } from "./geometry/chamferedBoxGeometry";
import { ditheredHole } from "./ditheredHole";
import { randFloatSpread } from "three/src/math/MathUtils.js";
const treeSwayStrength = 0.0125;
const leafSwayStrength = 0.025;

export default class Tree extends Object3D {
  shake = 0;
  health = 30;
  constructor() {
    super();
    this.name = "tree";
    getChamferedBoxGeometry(1, 6, 1, 0.25, 0, 3).then((g) => {
      const trunk = new Mesh(
        g,
        new MeshStandardMaterial({
          color: 0x572e2c,
          roughness: 0.75,
          metalness: 0,
          emissive: 0x171e2c,
          side: DoubleSide,
          ditheredHole,
        }),
      );
      trunk.name = "treeTrunk";
      trunk.position.y = 4;
      trunk.receiveShadow = true;
      trunk.castShadow = true;
      trunk.onBeforeRender = () => {
        const t = performance.now() * 0.005;
        const posDelay =
          (this.parent!.position.x + this.parent!.position.z) * 0.05;
        trunk.rotation.x =
          Math.sin(t * 0.75 + posDelay) * treeSwayStrength +
          Math.sin(t * 15.5 + posDelay) * this.shake * 0.1;
        trunk.rotation.z =
          Math.cos(t + posDelay) * treeSwayStrength +
          Math.cos(t * 15.5) * this.shake * 0.1;
        // trunk.position.y = rotationRef.y + Math.sin(t * 0.75);
      };
      this.add(trunk);
      getChamferedBoxGeometry(4, 2, 4, 0.5).then((g) => {
        const leafMat = new MeshStandardMaterial({
          color: 0x17ae2c,
          roughness: 0.75,
          metalness: 0,
          emissive: 0x171e2c,
          side: DoubleSide,
          ditheredHole,
        });
        for (let i = 0; i < 5; i++) {
          const leaves = new Mesh(g, leafMat);
          leaves.position.set(
            randFloatSpread(6),
            randFloatSpread(4) + 6,
            randFloatSpread(6),
          );
          leaves.rotation.set(
            randFloatSpread(1),
            randFloatSpread(7),
            randFloatSpread(1),
          );
          trunk.add(leaves);
          const offsetR = Math.random();
          leaves.onBeforeRender = () => {
            if (this.shake > 0) {
              this.shake -= 0.001;
            }
            const t = performance.now() * 0.01 + offsetR;
            const posDelay = this.position.x + this.position.z * 0.2;
            leaves.rotation.x =
              Math.sin(t * 0.75 + posDelay) * leafSwayStrength +
              Math.sin(t * 5.5 + posDelay) * this.shake;
            leaves.rotation.z =
              Math.cos(t) * leafSwayStrength + Math.cos(t * 5.5) * this.shake;
            // trunk.position.y = rotationRef.y + Math.sin(t * 0.75);
          };
          leaves.receiveShadow = true;
          leaves.castShadow = true;
        }
      });
    });
  }
}
