import { isAssetKey, type AssetKey } from "@codigdex/game-assets/manifest";
import type { ImageSourcePropType } from "react-native";
import { MOBILE_ASSETS } from "./assets.generated";

export function mobileAssetSource(key: string): ImageSourcePropType {
  if (!isAssetKey(key)) throw new Error(`Unknown Codigdex asset key: ${key}`);
  return MOBILE_ASSETS[key as AssetKey];
}
