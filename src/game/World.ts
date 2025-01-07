import { Mesh } from "three";
import Coin from "./Coin";

export default class World {
  mapCache = new Map<string, Mesh>();
  knownTrees: string[] = [];
  harvestedTrees: string[] = [];
  knownTowers: string[] = [];
  availableTowers: string[] = [];
  items: Coin[] = [];
  itemsToDelete: Coin[] = [];
}
