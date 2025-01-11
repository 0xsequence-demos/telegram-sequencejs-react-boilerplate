import { DoubleSide, Euler, Mesh, MeshStandardMaterial, Object3D } from "three";
import { wrapRange } from "./utils/math";
import { distPerTile } from "./constants";
import { randFloatSpread } from "three/src/math/MathUtils.js";
// import Coin from "./Coin";
import { clamp } from "./clamp";
import { geometryRecipes } from "./geometryRecipes";
import Tree from "./Tree";
import { ditheredHole } from "./ditheredHole";
import Safe from "./Safe";
import Chest from "./Chest";
import { loadGLTF } from "./utils/loadGLTF";
import { getTileType } from "./tileTypeCache";

export function makeTile(ix: number, iy: number, harvested = false) {
  const x = ix * distPerTile;
  const y = iy * distPerTile;

  const tileBase = new Object3D();
  let tileType = getTileType(ix, iy);
  if (tileType === "plane-grassy") {
    if (
      getTileType(ix + 1, iy) === "water" ||
      getTileType(ix - 1, iy) === "water" ||
      getTileType(ix, iy + 1) === "water" ||
      getTileType(ix, iy - 1) === "water"
    ) {
      tileType = "sand";
    }
  }
  tileBase.name = tileType;
  loadGLTF("world-tiles.glb").then((gltf) => {
    const tile = gltf.scene.getObjectByName(tileType);
    if (tile) {
      tile.position.set(0, 0, 0);
      tile.receiveShadow = true;
      const myTile = tile.clone();
      tileBase.add(myTile);
      if (tileType === "water") {
        myTile.onBeforeRender = () => {
          myTile.position.y =
            Math.sin(performance.now() * 0.0015 + (ix + iy) * 0.75) * 0.4;
        };
      }
    }
  });

  if (tileType === "plane-grassy") {
    if (wrapRange(ix, 0, 20) === 0 && wrapRange(iy, 0, 20) === 4) {
      const safe = new Safe();
      safe.scale.setScalar(2);
      safe.position.set(0, 1, 0);
      safe.rotation.y = Math.PI;
      safe.name = "safe";
      tileBase.add(safe);
      tileBase.userData.safe = true;
    } else if (wrapRange(ix, 0, 10) === 0 && wrapRange(iy, 0, 10) === 1) {
      if (!harvested) {
        const chest = new Chest(wrapRange(ix * 37 + iy * 19 + 17, 0, 3));
        chest.scale.setScalar(1.5);
        chest.position.set(0, 1, 0);
        // chest.rotation.y = Math.PI;
        chest.name = "chest";
        tileBase.add(chest);
        tileBase.userData.chest = true;
      }
    } else if (
      wrapRange(ix * 37 + iy * 19 + 18, 0, wrapRange(ix + iy, 11, 21)) <= 4
    ) {
      const rot = new Euler(
        randFloatSpread(0.4),
        randFloatSpread(0.4),
        randFloatSpread(0.4),
      );
      const tree = new Tree(harvested);
      tree.rotation.copy(rot);
      tileBase.add(tree);
      tree.position.y = 1;
      tileBase.userData.tree = true;
    } else if (
      wrapRange(ix * 47 + iy * 19 + 91, 0, wrapRange(ix + iy, 24, 31)) < 3
    ) {
      geometryRecipes.castleBlock().then((g) => {
        const t = ((x * 17 + y * 9 + 21) % 5) + 2;
        const rockMat = new MeshStandardMaterial({
          color: 0x777e9c,
          roughness: 0.75,
          metalness: 0,
        });
        for (let i = 0; i < t; i++) {
          const rock = new Mesh(g, rockMat);
          rock.position.set(
            randFloatSpread(6),
            randFloatSpread(0.5) + 1,
            randFloatSpread(6),
          );
          rock.rotation.set(
            randFloatSpread(1),
            randFloatSpread(1),
            randFloatSpread(1),
          );
          rock.receiveShadow = true;
          rock.castShadow = true;
          tileBase.add(rock);
        }
      });
    } else if (
      wrapRange(ix * 37 + iy * 9 + 31, 0, wrapRange(ix + iy, 17, 23)) < 1
    ) {
      const t2 =
        ((x * 17 + y * 9 + 21) % 5) +
        clamp(13 - Math.round(Math.abs(ix) + Math.abs(iy)), 0, 6);
      if (t2 > 0) {
        geometryRecipes.castleBlock().then((g) => {
          const rockMat = new MeshStandardMaterial({
            color: 0x777e9c,
            roughness: 0.75,
            metalness: 0,
            side: DoubleSide,
            ditheredHole,
          });
          rockMat.name = "rock";
          const t = 8;
          for (let i = 0; i < t; i++) {
            for (let j = 0; j < t2; j++) {
              if (j <= 1 && i % 2 === 0) {
                continue;
              }
              const rock = new Mesh(g, rockMat);
              const a =
                (i / t) * Math.PI * 2 +
                (j >= 2 && j % 2 === 0 ? Math.PI / 8 : 0);
              rock.position.set(
                randFloatSpread(0.25) + Math.cos(a) * 3.25,
                randFloatSpread(0.15) + 1.7 + j * 1.5,
                randFloatSpread(0.25) + Math.sin(a) * 3.25,
              );
              rock.rotation.set(0, randFloatSpread(0.2) - a, 0);
              rock.receiveShadow = true;
              rock.castShadow = true;
              tileBase.add(rock);
            }
          }
          const keyRock = new Mesh(g, rockMat);
          keyRock.position.set(0, 0.25, 0);
          keyRock.rotation.z = Math.PI * -0.5;
          tileBase.add(keyRock);
          keyRock.name = "tower";
        });
        tileBase.userData.tower = true;
      }
    }
  }
  tileBase.position.set(x, -1, y);
  if (tileType === "plane-grassy") {
    tileBase.rotation.set(0, ~~(Math.random() * 100) * Math.PI * 0.5, 0);
  }
  tileBase.scale.setScalar(0.001);
  return tileBase;
}
