import { ValueSignal } from "./utils/ValueSignal";

export default class CoinsInSafe {
  expected = new ValueSignal(0);
  confirmed = new ValueSignal(0);
  errorMessage = new ValueSignal("");
}
