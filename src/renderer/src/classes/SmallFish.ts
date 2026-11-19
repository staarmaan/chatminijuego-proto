import type { MainScene } from '../main'
import { BaseFish, type FishConfig } from './BaseFish'

const CONFIG = {
  textureKey: 'smallFish',
  fishType: 0,
  hitRadius: 5,
  depth: 5,
  outPixelsX: 24,
  outPixelsY: 64,
  hungerTimes: [10.0, 14.0],
  fishHungerTimeRegain: [12.5],
  hungerTickFrames: [0, 10],
} as const satisfies FishConfig

export class SmallFish extends BaseFish {
  constructor(scene: MainScene, x: number, y: number, fishSubtype: number) {
    super(scene, x, y, fishSubtype, CONFIG)
  }
}
