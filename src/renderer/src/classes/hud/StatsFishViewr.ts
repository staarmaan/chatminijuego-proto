import Phaser from 'phaser'
import { MainScene } from '../../main'

export class HudFishCounter extends Phaser.GameObjects.Container {
  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y);
  }
}
