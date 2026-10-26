import Phaser from 'phaser'
import { fishSheets } from './assets/fishSheets'
import { Fish } from './classes/Fish'
import EnumFishTypes from './classes/EnumFishTypes'
import { ReverseEnumFishType } from './classes/EnumFishTypes'
import { Button } from './classes/Button'

class MainScene extends Phaser.Scene {
  private fishes: Phaser.Physics.Arcade.Group
  private fishScale: number = 1
  private fishTypeIndex: number = 0

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
    this.physics.add.overlap(this.fishes, this.fishes, (a, b) => {
      if (a === b) return
      (a as Fish).onTouch(b as Fish)
    })

    for (const fishType of Object.values(EnumFishTypes)) {
      if (typeof fishType === 'number') {
        for (let i = 0; i < 1; i++) {
          const fish = new Fish(this, 200, 400, fishType)
          this.fishes.add(fish)
        }
      }
    }

    const button = new Button(this, 48, 16, "spawn", () => {
      //Argument of type 'string' is not assignable to parameter of type 'EnumFishTypes'. Wdym not it works just fine!!!!
      const fish = new Fish(this, 200, 400, EnumFishTypes[ReverseEnumFishType[this.fishTypeIndex]], this.fishScale)
      this.fishes.add(fish)
    })

    const buttonScale = new Button(this, 152, 16, "scale: 1", () => {
      this.fishScale++
      this.fishScale %= 6
      //if (this.fishScale > 5) {this.fishScale = 1}
      const text = this.fishScale === 0 && 'scale: random' || `scale: ${this.fishScale}`
      buttonScale.setText(text)
    })

    const textureKeys = {
      [EnumFishTypes.BASA]: 'fish-basa',
      [EnumFishTypes.BLUETANG]: 'fish-bluetang',
      [EnumFishTypes.CLOWNFISH]: 'fish-clownfish',
      [EnumFishTypes.FIGHTERFISH]: 'fish-fighter',
      [EnumFishTypes.POMFRET]: 'fish-pomfret',
      [EnumFishTypes.SALMON]: 'fish-salmon',
      [EnumFishTypes.TAUTOG]: 'fish-tautog',
    }
    const buttonFishType = new Button(this, 300, 16, `${textureKeys[this.fishTypeIndex]}`, () => {
      this.fishTypeIndex++
      this.fishTypeIndex %= Object.entries(textureKeys).length
      buttonFishType.setText(`${textureKeys[this.fishTypeIndex]}`)
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
