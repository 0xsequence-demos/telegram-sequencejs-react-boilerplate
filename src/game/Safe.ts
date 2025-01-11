import {
  Color,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { loadGLTF } from "./utils/loadGLTF";
import { ditheredHole } from "./ditheredHole";
import { getMessageFromUnknownError } from "../utils/getMessageFromUnknownError";
import { sharedGameState } from "./sharedGameState";
import AnimatedNumber from "./utils/AnimatedNumber";
import { ValueSignal } from "./utils/ValueSignal";

export default class Safe extends Object3D {
  busy = new AnimatedNumber(0, 0.1, 0.1);
  bad = new AnimatedNumber(0, 0.1, 0.01);
  good = new AnimatedNumber(0, 0.1, 0.01);
  wheel: Object3D | undefined;
  tempCoinBuffer = 0;
  deposit(
    source: ValueSignal<number>,
    walletAddress: string | null,
    amount: number,
  ) {
    if (
      walletAddress &&
      amount > 0 &&
      this.busy.value === 0 &&
      this.bad.value === 0 &&
      this.good.value === 0
    ) {
      this.busy.target = 1;
      this.tempCoinBuffer = amount;
      fetch("api/mint-erc20", {
        method: "POST",
        body: JSON.stringify({
          address: walletAddress,
          amount: amount.toString(),
        }),
      })
        .then((r) => {
          this.busy.target = 0;
          if (r.status === 200) {
            this.good.target = 1;
          } else {
            this.bad.target = 1;
            source.value += this.tempCoinBuffer;
            this.tempCoinBuffer = 0;
            this.shake = 0.5;
            r.text().then((text) => {
              const somethingIsWrongMessagePrefix = "Something went wrong: ";
              if (text.indexOf(somethingIsWrongMessagePrefix) !== -1) {
                const jsonText = text.slice(
                  somethingIsWrongMessagePrefix.length,
                );
                const body = JSON.parse(jsonText);
                try {
                  const deeperBodyString = body.info.responseBody;
                  if (deeperBodyString) {
                    const deeperBody = JSON.parse(deeperBodyString);
                    if (deeperBody.error.message) {
                      console.error(deeperBody.error.message);
                      sharedGameState.coinsInSafe.errorMessage.value =
                        deeperBody.error.message;
                      setTimeout(() => {
                        sharedGameState.coinsInSafe.errorMessage.value = "";
                      }, 5000);
                    } else {
                      console.error(deeperBody);
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            });
          }
        })
        .catch((e) => {
          sharedGameState.coinsInSafe.errorMessage.value =
            getMessageFromUnknownError(e);
        });
      for (const cb of this.onDepositCallbacks) {
        cb();
      }
    }
  }
  onDepositCallbacks: Array<() => void> = [];
  onDeposit(callback: () => void) {
    this.onDepositCallbacks.push(callback);
  }
  shake = 0;
  statusColor = new Color(0, 0, 0);
  lastTime = performance.now() * 0.001;
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
              if (
                n.name === "box" &&
                n.material instanceof MeshStandardMaterial
              ) {
                n.material.emissive = this.statusColor;
                n.material.needsUpdate = true;
              } else if (n.name === "wheel") {
                this.wheel = n;
              } else if (
                n.name === "inside" &&
                n.material instanceof MeshBasicMaterial
              ) {
                n.material.color = this.statusColor;
              }
            }
          });
          myBox.onBeforeRender = () => {
            if (this.shake > 0) {
              this.shake -= 0.01;
            }
            const now = performance.now() * 0.001;
            const t = now * 5;
            const delta = now - this.lastTime;
            if (this.wheel) {
              this.wheel.rotation.y += this.busy.value * delta * 8;
            }
            this.lastTime = now;
            this.good.update(delta);
            this.bad.update(delta);
            this.busy.update(delta);
            const pulse = Math.sin(now * 10) * 0.25 + 0.5;
            if (this.good.value >= 1) {
              this.good.target = 0;
            }
            if (this.bad.value >= 1) {
              this.bad.target = 0;
            }
            const pulseBusy = pulse * this.busy.value;
            this.statusColor.setRGB(
              pulseBusy + this.bad.value,
              pulseBusy + this.good.value,
              0,
            );
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
