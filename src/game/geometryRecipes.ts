import { getChamferedBoxGeometry } from "./geometry/chamferedBoxGeometry";

export const geometryRecipes = {
  castleBlock: () => getChamferedBoxGeometry(2, 1.5, 2.5, 0.25, 0.375),
};
