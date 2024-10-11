import { Mesh, Object3D, Vector3 } from "three";
import Limb from "./Limb";
import { getProtoTargetMesh } from "./protoTargetMesh";
import { charactetAnimations } from "./dances";

const secondaryTargets = {
  elbows: new Vector3(-15, 10, 10),
  knees: new Vector3(-3, 0, 10),
};

const limbNames = ["arm", "leg"];
export default class Character {
  limbTargets: Object3D[] = [];
  head: Object3D;
  legs: Limb[] = [];
  arms: Limb[] = [];
  botPivot = new Object3D();
  currentAnimation: keyof typeof charactetAnimations = "greeting";
  constructor(piecesPool: Object3D, destination: Object3D) {
    destination.add(this.botPivot);
    this.head = getProtoTargetMesh().clone();
    const addLimb = (
      child: Mesh,
      flipJoint: boolean,
      side: 1 | -1,
      ltDestination: Object3D,
      secondaryTarget: Vector3,
    ) => {
      const st = secondaryTarget.clone();
      st.x *= side;
      const limb = new Limb(child, flipJoint, side, st);
      limb.mesh.position.x *= side;
      this.limbTargets.push(limb.targetHelper);
      ltDestination.add(limb.targetHelper);
      this.botPivot.add(limb.mesh);
      limb.resetHelper();
      return limb;
    };
    for (const child of piecesPool.children) {
      if (limbNames.includes(child.name) && child instanceof Mesh) {
        const isLeg = child.name === "leg";
        const flipJoint = isLeg;
        const ltDestination = isLeg ? destination : this.botPivot;
        const st = isLeg ? secondaryTargets.knees : secondaryTargets.elbows;
        const left = addLimb(child, flipJoint, 1, ltDestination, st);
        const right = addLimb(child, flipJoint, -1, ltDestination, st);
        (isLeg ? this.legs : this.arms).push(left, right);
      } else {
        const clone = child.clone(true);
        this.botPivot.add(clone);
        if (clone.name === "head") {
          this.head = clone;
          const mirrorThese: Object3D[] = [];
          clone.traverse((headNode) => {
            if (headNode.name.includes("eye")) {
              if (headNode.name !== "eye-happy") {
                headNode.visible = false;
              } else {
                mirrorThese.push(headNode);
              }
            }
          });
          for (const n of mirrorThese) {
            const n2 = n.clone();
            n2.position.x -= 0.6;
            n.parent!.add(n2);
          }
        }
      }
    }
  }
  update(time: number) {
    time *= 1.8 / 2;
    const dance = charactetAnimations[this.currentAnimation];
    for (const arm of this.arms) {
      arm.update(time, dance.arm);
    }
    for (const leg of this.legs) {
      leg.update(time, dance.leg);
    }
    dance.body(this.botPivot, time);
    dance.head(this.head, time);
  }
}
