import Phaser from 'phaser'
import { fishSheets } from './assets/fishSheets'
import { Fish } from './classes/Fish'
import EnumFishTypes from './classes/EnumFishTypes'
import { ReverseEnumFishType } from './classes/EnumFishTypes'
import { Button } from './classes/Button'

class MainScene extends Phaser.Scene {
  private fishes!: Phaser.Physics.Arcade.Group
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

    const scene = this
    //api declarado desdde src/preload/index.ts
    if (window.api && typeof window.api.onSpawnFish === 'function') {
      window.api.onSpawnFish((payload: any) => {
        scene.spawnFishFromPayload(payload)
      })
    }

    new Button(this, 48, 16, "spawn", () => {
      //Argument of type 'string' is not assignable to parameter of type 'EnumFishTypes'. Wdym not it works just fine!!!!
      const fishTypeName = (ReverseEnumFishType as any)[this.fishTypeIndex]
      const fishType = (EnumFishTypes as any)[fishTypeName] as EnumFishTypes
      const fish = new Fish(this, 200, 400, fishType, this.fishScale)
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

  private spawnFishFromPayload(payload: any): void {
    if (!payload) return
    let fishType: EnumFishTypes = EnumFishTypes.CLOWNFISH
    const fishTypeVal = payload.fishType

    if (typeof fishTypeVal === 'number') {
      if (fishTypeVal >= EnumFishTypes.CLOWNFISH && fishTypeVal <= EnumFishTypes.TAUTOG) {
        fishType = fishTypeVal
      } else if (fishTypeVal >= 0 && fishTypeVal <= 6) {
        // try to map by numeric value
        fishType = fishTypeVal as EnumFishTypes
      }
    } else if (typeof fishTypeVal === 'string') {
      const key = fishTypeVal.trim().toUpperCase()
      // try direct enum access
      if (key in EnumFishTypes) {
        const enumVal = (EnumFishTypes as any)[key]
        if (typeof enumVal === 'number') {
          fishType = enumVal
        }
      } else {
        // try matching values
        for (const [k, v] of Object.entries(EnumFishTypes)) {
          if (typeof v === 'number' && k.toUpperCase() === key) {
            fishType = v
            break
          }
        }
      }
    }

    let scale = 0
    if (payload.scale !== undefined && payload.scale !== null) {
      const parsed = typeof payload.scale === 'string' ? parseFloat(payload.scale) : Number(payload.scale)
      if (!isNaN(parsed)) {
        scale = Math.max(0, Math.min(5, Math.round(parsed)))
      }
    }

    const x = 200 + (Math.random() * 40 - 20)
    const y = 400 + (Math.random() * 40 - 20)
    const fish = new Fish(this, x, y, fishType, scale)
    this.fishes.add(fish)
  }

  update(_time: number, _delta: number): void {
    //const dt = _delta * 0.001
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
