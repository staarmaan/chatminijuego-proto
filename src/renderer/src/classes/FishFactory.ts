import type { MainScene } from '../main'
import { BaseFish } from './BaseFish'
import { SmallFish } from './SmallFish'
import { MedFish } from './MedFish'
import { BigFish } from './BigFish'

export { BaseFish, SmallFish, MedFish, BigFish }
export type { FishConfig } from './BaseFish'

export function createFish(
  scene: MainScene,
  x: number,
  y: number,
  fishType: number,
  fishSubtype: number
): BaseFish {
  switch (fishType) {
    case 1:
      return new MedFish(scene, x, y, fishSubtype)
    case 2:
      return new BigFish(scene, x, y, fishSubtype)
    case 0:
    default:
      return new SmallFish(scene, x, y, fishSubtype)
  }
}
