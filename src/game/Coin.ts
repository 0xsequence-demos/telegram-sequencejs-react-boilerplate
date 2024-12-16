import { Mesh, MeshStandardMaterial } from "three";
import { getChamferedCylinderGeometry } from "./geometry/chamferedCylinderGeometry";

export default class Coin extends Mesh {
  rotOffset = Math.random() * Math.PI * 2;
  constructor() {
    const g = getChamferedCylinderGeometry(0.5, 0.125, 16, 8, 0.05);
    super(
      g,
      new MeshStandardMaterial({
        color: 0xffff2c,
        roughness: 0.125,
        metalness: 0.8,
      }),
    );
    this.onBeforeRender = () => {
      const t = performance.now() * 0.01;
      this.rotation.z = t + this.rotOffset;
      this.position.y = Math.sin(t * 0.75 + this.rotOffset) * 0.25 + 2.5;
    };
  }
}
