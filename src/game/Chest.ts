import { Material, Mesh, Object3D } from "three";
import { loadGLTF } from "./utils/loadGLTF";

export default class Chest extends Object3D {
  open() {
    for (const cb of this.onOpenCallbacks) {
      cb();
    }
  }
  onOpenCallbacks: Array<() => void> = [];
  onOpen(callback: () => void) {
    this.onOpenCallbacks.push(callback);
  }
  shake = 0;
  health = 30;
  constructor(public rarity = 0) {
    super();
    this.name = "chest";
    this.health += rarity * 20;
    loadGLTF("chest.glb").then((gltf) => {
      gltf.scene.traverse((n) => {
        n.receiveShadow = true;
        n.castShadow = true;
      });
      const box = gltf.scene.getObjectByName("chest");
      if (box instanceof Mesh) {
        const myBox = box.clone();
        const toRemove: Object3D[] = [];
        const mats = [
          gltf.scene.getObjectByName("mat-wood"),
          gltf.scene.getObjectByName("mat-steel"),
          gltf.scene.getObjectByName("mat-gold"),
          gltf.scene.getObjectByName("mat-mithril"),
        ].map((n) =>
          n instanceof Mesh && n.material instanceof Material
            ? n.material
            : null,
        );
        myBox.traverse((n) => {
          if (n instanceof Mesh && n.material instanceof Material) {
            if (n.material.name === "steel") {
              n.material = mats[rarity + 1];
            }
            if (n.material.name === "wood") {
              n.material = mats[rarity];
            }
            // n.material.ditheredHole = ditheredHole;
          }
          if (n.name.includes("rarity")) {
            const i = parseInt(n.name.split("-")[1]);
            if (i > rarity) {
              toRemove.push(n);
            } else if (i >= 1) {
              const y = n.position.y;
              n.onBeforeRender = () => {
                const t = performance.now() * 0.005;
                const posDelay =
                  (this.parent!.position.x + this.parent!.position.z) * 0.05;
                n.position.y = y + Math.sin(t * 0.5 + posDelay - i) * 0.1;
                // box.position.y = rotationRef.y + Math.sin(t * 0.75);
              };
            }
          }
        });
        for (const n of toRemove) {
          n.parent!.remove(n);
        }
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
    });
  }
}
