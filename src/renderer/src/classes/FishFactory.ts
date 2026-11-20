import type { MainScene } from '../main'
import { BaseFish, FISH_SIZES } from './BaseFish'
import { SmallFish } from './SmallFish'
import { MedFish } from './MedFish'
import { BigFish } from './BigFish'

export { BaseFish, SmallFish, MedFish, BigFish, FISH_SIZES }
export type { FishConfig } from './BaseFish'

export function createFish(
  scene: MainScene,
  x: number,
  y: number,
  fishSize: FISH_SIZES,
  fishSubtype: number
): BaseFish {
  switch (fishSize) {
    case FISH_SIZES.MED:
      return new MedFish(scene, x, y, fishSubtype)
    case FISH_SIZES.BIG:
      return new BigFish(scene, x, y, fishSubtype)
    case FISH_SIZES.SMALL:
    default:
      return new SmallFish(scene, x, y, fishSubtype)
  }
}
