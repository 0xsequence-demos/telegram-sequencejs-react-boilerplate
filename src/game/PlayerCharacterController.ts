import { Vector3 } from "three";
import JoystickRing from "./JoystickRing";
import { CharacterHolder } from "./character/CharacterHolder";
import { clamp } from "./clamp";
import CameraTruck from "./CameraTruck";
import { dist2 } from "./utils/math";

const __tempVecA = new Vector3();
const __tempVecB = new Vector3();

export default class PlayerCharacterController {
  walkSpeed = 0.5;
  moveSpeedChangeDelta = 0.05;
  intentMoveX = 0;
  intentMoveY = 0;
  time = 0;
  constructor(
    public charHolder: CharacterHolder,
    public keysDown: Map<string, boolean>,
    public camTruck: CameraTruck,
  ) {}

  update(joystick: JoystickRing | undefined, deltaTime: number) {
    this.time += deltaTime;
    this.charHolder.update(this.time);
    let x = false;
    let y = false;
    if (joystick) {
      x = true;
      y = true;
      this.intentMoveX = joystick.inner.position.x / 100;
      this.intentMoveY = joystick.inner.position.y / 100;
    }

    if (
      (!joystick && this.keysDown.get("KeyW")) ||
      this.keysDown.get("ArrowUp")
    ) {
      this.intentMoveY = clamp(
        Math.max(0, this.intentMoveY + this.moveSpeedChangeDelta),
        -this.walkSpeed,
        this.walkSpeed,
      );
      y = true;
    }
    if (
      (!joystick && this.keysDown.get("KeyS")) ||
      this.keysDown.get("ArrowDown")
    ) {
      this.intentMoveY = clamp(
        Math.min(0, this.intentMoveY - this.moveSpeedChangeDelta),
        -this.walkSpeed,
        this.walkSpeed,
      );
      y = true;
    }
    if (!y) {
      const sign = Math.sign(this.intentMoveY);
      const mag = Math.abs(this.intentMoveY);
      this.intentMoveY = Math.max(0, mag - this.moveSpeedChangeDelta) * sign;
    }
    if (
      (!joystick && this.keysDown.get("KeyA")) ||
      this.keysDown.get("ArrowLeft")
    ) {
      this.intentMoveX = clamp(
        Math.min(0, this.intentMoveX - this.moveSpeedChangeDelta),
        -this.walkSpeed,
        this.walkSpeed,
      );
      x = true;
    }
    if (
      (!joystick && this.keysDown.get("KeyD")) ||
      this.keysDown.get("ArrowRight")
    ) {
      this.intentMoveX = clamp(
        Math.max(0, this.intentMoveX + this.moveSpeedChangeDelta),
        -this.walkSpeed,
        this.walkSpeed,
      );
      x = true;
    }
    if (!x) {
      const sign = Math.sign(this.intentMoveX);
      const mag = Math.abs(this.intentMoveX);
      this.intentMoveX = Math.max(0, mag - this.moveSpeedChangeDelta) * sign;
    }

    const dp = __tempVecA
      .copy(this.camTruck.virtualPivot.position)
      .applyMatrix4(this.camTruck.matrixWorld);
    const dc = __tempVecB.copy(this.charHolder.position);
    dp.sub(dc);
    const viewAngle = Math.atan2(dp.z, dp.x);

    const inputMoveAngle =
      Math.atan2(this.intentMoveY, -this.intentMoveX) + viewAngle;
    const inputMoveMag = Math.min(
      0.5,
      dist2(this.intentMoveX, this.intentMoveY),
    );

    this.charHolder.updateIntent(inputMoveAngle, inputMoveMag, deltaTime);

    this.camTruck.rotation.y = -viewAngle - Math.PI * 0.5;
    this.camTruck.position.x -=
      (this.camTruck.position.x -
        (Math.cos(viewAngle + Math.PI) * -this.camTruck.boomDist +
          this.charHolder.position.x)) *
      0.2;
    this.camTruck.position.z -=
      (this.camTruck.position.z -
        (Math.sin(viewAngle + Math.PI) * -this.camTruck.boomDist +
          this.charHolder.position.z)) *
      0.2;
  }
}
