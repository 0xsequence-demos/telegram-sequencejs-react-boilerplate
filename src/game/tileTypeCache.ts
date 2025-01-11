import NoiseHelper3D from "./NoiseHelper3D";

type TileType = "plane-grassy" | "water" | "sand";

const noise = new NoiseHelper3D(0.6);
const noise2 = new NoiseHelper3D(0.3, 100, 30, 10);
const noise3 = new NoiseHelper3D(0.2, 10, 300, 10);
const baseTileTypeCache = new Map<string, TileType>();
export function getTileType(ix: number, iy: number) {
  const key = `${ix};${iy}`;
  if (!baseTileTypeCache.has(key)) {
    const major =
      noise.getValue(ix, iy, 0) - (Math.abs(ix) + Math.abs(iy)) * 0.1 + 6;
    const minor =
      Math.max(noise2.getValue(ix, iy, 0), noise3.getValue(ix, iy, 0)) + 0.8;
    const score = Math.min(major, minor);
    const tileType = score > 0.5 ? "plane-grassy" : "water";

    baseTileTypeCache.set(key, tileType);
  }
  return baseTileTypeCache.get(key)!;
}
