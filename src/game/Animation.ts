import AnimatedNumber from "./utils/AnimatedNumber";

export default class Animation {
  anim: AnimatedNumber;
  complete: boolean = false;
  constructor(
    private _onUpdate: (v: number) => void,
    private _onComplete: (a: Animation) => void,
    speed = 0.01,
    delay = 0,
  ) {
    this.anim = new AnimatedNumber(-delay, speed);
    this.anim.target = 1;
  }
  update(dt: number) {
    this.anim.update(dt);
    this._onUpdate(this.anim.value);
    if (this.anim.value >= 1) {
      this._onComplete(this);
      this.complete = true;
    }
  }
}
