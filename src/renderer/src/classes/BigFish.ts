import type { MainScene } from '../main'
import { BaseFish, type FishConfig } from './BaseFish'

const CONFIG = {
  textureKey: 'bigFish',
  fishType: 2,
  hitRadius: 15,
  depth: 3,
  outPixelsX: 40,
  outPixelsY: 80,
  hungerTimes: [10.0, 24.0, 25.0, 40.0],
  fishHungerTimeRegain: [5.0, 12.5, 25.0],
  hungerTickFrames: [0, 30, 20, 10],
} as const satisfies FishConfig

export class BigFish extends BaseFish {
  constructor(scene: MainScene, x: number, y: number, fishSubtype: number) {
    super(scene, x, y, fishSubtype, CONFIG)
  }
}
