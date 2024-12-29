import { CharacterHolder } from "./character/CharacterHolder";
import { dist2 } from "./utils/math";
import { randFloatSpread, randInt } from "three/src/math/MathUtils.js";

export default class BotCharacterController {
  time = 0;
  targetX = 0;
  targetY = 0;
  constructor(public charHolder: CharacterHolder) {
    this.newGoal();
  }

  newGoal() {
    this.targetX = (this.charHolder.position.x + randFloatSpread(40)) * 0.8;
    this.targetY = (this.charHolder.position.z + randFloatSpread(40)) * 0.8;
    setTimeout(() => this.newGoal(), randInt(3000, 6000));
  }

  update(deltaTime: number) {
    const intentMoveX = this.charHolder.position.x - this.targetX;
    const intentMoveY = this.charHolder.position.z - this.targetY;

    const inputMoveAngle = Math.atan2(intentMoveY, intentMoveX) + Math.PI * 0.5;
    const dist = dist2(intentMoveX, intentMoveY);
    const inputMoveMag = Math.min(0.5, dist);
    this.time += deltaTime * (dist < 1 ? 1 : 1.2);
    this.charHolder.update(this.time);

    // console.log(inputMoveAngle.toFixed(2), inputMoveMag.toFixed(2));
    this.charHolder.updateIntent(inputMoveAngle, inputMoveMag, deltaTime);
  }
}
