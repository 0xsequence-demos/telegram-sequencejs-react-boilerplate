import { Mesh, Object3D } from "three";

export default class World {
  mapCache = new Map<string, Mesh>();
  knownSafes: string[] = [];
  knownChests: string[] = [];
  openedChests: string[] = [];
  knownTrees: string[] = [];
  harvestedTrees: string[] = [];
  knownTowers: string[] = [];
  availableTowers: string[] = [];
  items: Object3D[] = [];
  itemsToDelete: Object3D[] = [];
}
