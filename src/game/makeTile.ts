import { Color, DoubleSide, Mesh, MeshStandardMaterial } from "three";
import { getChamferedBoxGeometry } from "./geometry/chamferedBoxGeometry";
import { lerp, wrapRange } from "./utils/math";
import { getSharedPlaneGeometry } from "./getSharedPlaneGeometry";
import { distPerTile } from "./constants";
import { randFloatSpread } from "three/src/math/MathUtils.js";
// import Coin from "./Coin";
import { clamp } from "./clamp";
import { geometryRecipes } from "./geometryRecipes";
import Tree from "./Tree";
import { ditheredHole } from "./ditheredHole";
export function makeTile(ix: number, iy: number) {
  const x = ix * distPerTile;
  const y = iy * distPerTile;

  const mesh = new Mesh(
    getSharedPlaneGeometry(),
    new MeshStandardMaterial({
      color: new Color(
        0.3,
        lerp(((ix * 37 + iy * 19 + 9) % 10) / 10, 0.6, 0.8),
        0.2,
      ),
      roughness: 0.75,
      metalness: 0,
      emissive: 0x171e2c,
    }),
  );
  mesh.receiveShadow = true;
  getChamferedBoxGeometry(distPerTile, 2, distPerTile, 0.25).then(
    (g) => (mesh.geometry = g),
  );
  if (wrapRange(ix * 37 + iy * 19 + 18, 0, wrapRange(ix + iy, 11, 21)) <= 4) {
    const tree = new Tree();
    mesh.add(tree);
    tree.position.y = -3;
    mesh.userData.tree = true;
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
        mesh.add(rock);
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
              (i / t) * Math.PI * 2 + (j >= 2 && j % 2 === 0 ? Math.PI / 8 : 0);
            rock.position.set(
              randFloatSpread(0.25) + Math.cos(a) * 3.25,
              randFloatSpread(0.15) + 1.7 + j * 1.5,
              randFloatSpread(0.25) + Math.sin(a) * 3.25,
            );
            rock.rotation.set(0, randFloatSpread(0.2) - a, 0);
            rock.receiveShadow = true;
            rock.castShadow = true;
            mesh.add(rock);
          }
        }
        const keyRock = new Mesh(g, rockMat);
        keyRock.position.set(0, 0.25, 0);
        keyRock.rotation.z = Math.PI * -0.5;
        mesh.add(keyRock);
        keyRock.name = "tower";
      });
      mesh.userData.tower = true;
    }
  }
  mesh.position.set(x, -1, y);
  mesh.rotation.set(
    randFloatSpread(0.05),
    randFloatSpread(0.05),
    randFloatSpread(0.05),
  );
  mesh.scale.setScalar(0.001);
  return mesh;
}
