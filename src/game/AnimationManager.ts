import Animation from "./Animation";
import { removeFromArray } from "./removeFromArray";

export default class AnimationManager {
  animations: Animation[] = [];
  animationsFinished: Animation[] = [];
  update(deltaTime: number) {
    for (const anim of this.animations) {
      anim.update(deltaTime);
      if (anim.complete) {
        this.animationsFinished.push(anim);
      }
    }
    if (this.animationsFinished.length > 0) {
      for (let i = this.animationsFinished.length - 1; i >= 0; i--) {
        removeFromArray(this.animations, this.animationsFinished[i]);
      }
      this.animationsFinished.length = 0;
    }
  }
}
