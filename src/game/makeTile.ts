import { Color, Mesh, MeshStandardMaterial } from "three";
import { getChamferedBoxGeometry } from "./geometry/chamferedBoxGeometry";
import { lerp, wrapRange } from "./utils/math";
import { getSharedPlaneGeometry } from "./getSharedPlaneGeometry";
import { distPerTile } from "./constants";
import { randFloatSpread } from "three/src/math/MathUtils.js";
import Coin from "./Coin";

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
  if (wrapRange(ix * 37 + iy * 19 + 19, 0, wrapRange(ix + iy, 11, 21)) === 0) {
    getChamferedBoxGeometry(4, 2, 4, 0.5).then((g) => {
      for (let i = 0; i < 5; i++) {
        const leaves = new Mesh(
          g,
          new MeshStandardMaterial({
            color: 0x17ae2c,
            roughness: 0.75,
            metalness: 0,
            emissive: 0x171e2c,
          }),
        );
        leaves.position.set(
          randFloatSpread(6),
          randFloatSpread(4) + 6,
          randFloatSpread(6),
        );
        leaves.rotation.set(
          randFloatSpread(1),
          randFloatSpread(1),
          randFloatSpread(1),
        );
        mesh.add(leaves);
        leaves.receiveShadow = true;
        leaves.castShadow = true;
      }
    });
    getChamferedBoxGeometry(1, 6, 1, 0.25).then((g) => {
      const trunk = new Mesh(
        g,
        new MeshStandardMaterial({
          color: 0x572e2c,
          roughness: 0.75,
          metalness: 0,
          emissive: 0x171e2c,
        }),
      );
      trunk.position.set(randFloatSpread(1), 4, randFloatSpread(1));
      trunk.rotation.set(
        randFloatSpread(0.4),
        randFloatSpread(0.4),
        randFloatSpread(0.4),
      );
      mesh.add(trunk);
      trunk.receiveShadow = true;
      trunk.castShadow = true;
    });
  } else if (
    wrapRange(ix * 47 + iy * 19 + 91, 0, wrapRange(ix + iy, 24, 31)) < 3
  ) {
    getChamferedBoxGeometry(2, 1, 2, 0.25).then((g) => {
      const t = ((x * 17 + y * 9 + 21) % 5) + 2;
      for (let i = 0; i < t; i++) {
        const rock = new Mesh(
          g,
          new MeshStandardMaterial({
            color: 0x777e9c,
            roughness: 0.75,
            metalness: 0,
          }),
        );
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
    wrapRange(ix * 53 + iy * 109 - 91, 0, wrapRange(ix - iy, 24, 31)) < 10
  ) {
    const coin = new Coin();
    coin.position.set(randFloatSpread(6), 2, randFloatSpread(6));
    coin.rotation.set(Math.PI * 0.5, 0, randFloatSpread(Math.PI * 2));
    mesh.add(coin);
    coin.receiveShadow = true;
    coin.castShadow = true;
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
