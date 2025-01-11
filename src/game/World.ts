import { Object3D } from "three";

export default class World {
  mapCache = new Map<string, Object3D>();
  knownSafes: string[] = [];
  knownChests: string[] = [];
  openedChests: string[] = [];
  knownTrees: string[] = [];
  harvestedTrees: string[] = [];
  knownTowers: string[] = [];
  availableTowers: string[] = [];
  items: Object3D[] = [];
  addItem(item: Object3D) {
    item.userData.defaultScale = item.userData.defaultScale || 1;
    this.items.push(item);
  }
  itemsToDelete: Object3D[] = [];
}
