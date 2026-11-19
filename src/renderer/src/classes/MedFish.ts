import type { MainScene } from '../main'
import { BaseFish, type FishConfig } from './BaseFish'

const CONFIG = {
  textureKey: 'medFish',
  fishType: 1,
  hitRadius: 10,
  depth: 4,
  outPixelsX: 32,
  outPixelsY: 72,
  hungerTimes: [10.0, 2.0, 20.0],
  fishHungerTimeRegain: [7.5, 17.5],
  hungerTickFrames: [0, 20, 10],
} as const satisfies FishConfig

export class MedFish extends BaseFish {
  constructor(scene: MainScene, x: number, y: number, fishSubtype: number) {
    super(scene, x, y, fishSubtype, CONFIG)
  }
}
