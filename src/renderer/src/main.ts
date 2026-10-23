import Phaser from 'phaser'
import { fishSheets } from './assets/fishSheets'
import { Fish } from './classes/Fish'
import EnumFishTypes from './classes/EnumFishTypes'

class MainScene extends Phaser.Scene {
  private fishes: Phaser.Physics.Arcade.Group

  preload(): void {
    for (const sheet of fishSheets) {
      this.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight
      })
    }
  }

  create(): void {
    for (const sheet of fishSheets) {
      const animKey = `${sheet.key}-default`
      //const animKey = 'default'

      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(sheet.key, {
            start: 0,
            end: sheet.frameCount - 1
          }),
          frameRate: 10,
          repeat: -1
        })
      }
    }

    this.fishes = this.physics.add.group({ classType: Fish, runChildUpdate: true })
    for (const fishType of Object.values(EnumFishTypes)) {
      if (typeof fishType === 'number') {
        for (let i = 0; i < 5; i++) {
          const fish = new Fish(this, 200, 400, fishType)
          this.fishes.add(fish)
        }
      }
    }

    this.physics.add.overlap(this.fishes, this.fishes, (a, b) => {
      if (a === b) return
      (a as Fish).onTouch(b as Fish)
    })
  }

  update(_time: number, delta: number): void {
    const dt = delta * 0.001
    //const tiempo = _time * 0.001



    /*for (let i = 0; i < 5; i++) {} */
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 400,
  height: 800,
  parent: 'app',
  pixelArt: true,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x:0, y: 0 }, // fish swim freely, no vertical gravity needed
      debug: false
    }
  },
  scene: MainScene
})
