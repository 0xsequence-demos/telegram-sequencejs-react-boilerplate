export default class AnimatedNumber {
  target = 0;
  constructor(
    public value = 0,
    private speedLimitUp: number,
    private speedLimitDown = speedLimitUp,
  ) {
    this.target = value;
  }
  update(timeDelta: number) {
    const delta = this.target - this.value;
    const mag = Math.abs(delta);
    if (mag < 0.00001) {
      this.value = this.target;
      return;
    }
    const sign = Math.sign(delta);
    const speed = Math.min(timeDelta, 0.2) * 60;
    const step = Math.min(
      mag * speed,
      sign === 1 ? this.speedLimitUp : this.speedLimitDown,
    );
    this.value += sign * step;
  }
}
