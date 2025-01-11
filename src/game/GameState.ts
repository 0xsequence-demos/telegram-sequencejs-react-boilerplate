import CoinsInSafe from "./CoinsInSafe";
import { ValueSignal } from "./utils/ValueSignal";

export default class GameState {
  walletAddress: string | null = null;
  coinsInPocket = new ValueSignal(0);
  coinsInSafe = new CoinsInSafe();
}
