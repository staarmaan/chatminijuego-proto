import Phaser from 'phaser'
import { preloadAnims, createAnims } from './assets/anims'
import { Fish } from './classes/Fish'
import { BubbleParticle } from './classes/BubbleParticle'
import { Button } from './classes/Button'
import { FishFood } from './classes/FishFood'
import { Particle } from './classes/Particle'

class MainScene extends Phaser.Scene {
  private fishes!: Phaser.Physics.Arcade.Group
  private bubbles!: Phaser.Physics.Arcade.Group
  private fishFood!: Phaser.Physics.Arcade.Group
  private particles!: Phaser.Physics.Arcade.Group
  private fishTypeIndex: number = 0
  private fishSubtypeIndex: number = 0

  preload(): void {
    preloadAnims(this)
  }

  create(): void {
    createAnims(this)

    this.fishes = this.physics.add.group({ classType: Fish, runChildUpdate: true })
    this.physics.add.overlap(this.fishes, this.fishes, (a, b) => {
      if (a === b) return
      (a as Fish).onTouchFish(b as Fish)
    })

    this.bubbles = this.physics.add.group({ classType: BubbleParticle, runChildUpdate: true })
    this.particles = this.physics.add.group({ classType: Particle, runChildUpdate: true })
    this.fishFood = this.physics.add.group({ classType: FishFood, runChildUpdate: true })
    this.physics.add.overlap(this.fishes, this.fishFood, (fish, food) => {
      if (fish === food) return //No creo que sea necesario esto, pero por si acaso.
      (fish as Fish).onTouchFishFood(food as FishFood)
    })

    const { width, height } = this.sys.game.config as { width: number; height: number };
    const bg = this.add.image(width*0.5, height*0.5, 'bg');
    bg.setDisplaySize(width, height);
    const hud = this.add.image(width*0.5, height*0.5, 'hud');
    hud.setDisplaySize(width, height);
    hud.setDepth(100)

    for (let i = 0; i < 6; i++) {
      const fish = new Fish(this, width*0.5, height*0.5, 0, i)
      this.fishes.add(fish)
    }

    for (let i = 0; i < 20; i++) {
      const bubble = new BubbleParticle(this)
      this.bubbles.add(bubble)
    }

    for (let i = 0; i < 1; i++) {
      const fishFoodTest = new FishFood(this)
      this.fishFood.add(fishFoodTest)
    }

    const scene = this
    //api declarado desdde src/preload/index.ts
    if (window.api && typeof window.api.onSpawnFish === 'function') {
      window.api.onSpawnFish((payload: any) => {
        scene.spawnFishFromPayload(payload)
      })
    }

    const buttonSeparationX = 40
    new Button(this, 8, 8, "spawn", () => {
      if (this.fishTypeIndex == 3) {
        const fishFoodTest = new FishFood(this)
        this.fishFood.add(fishFoodTest)
        return
      }
      //Argument of type 'string' is not assignable to parameter of type 'EnumFishTypes'. Wdym not it works just fine!!!!
      const fish = new Fish(this, width*0.5, height*0.5, this.fishTypeIndex, this.fishSubtypeIndex)
      this.fishes.add(fish)
    })

    const typeNames = ['small', 'med', 'big', 'food']
    const buttonFishType = new Button(this, 8+buttonSeparationX , 8, `${typeNames[this.fishTypeIndex]}`, () => {
      this.fishTypeIndex++
      this.fishTypeIndex %= 4
      buttonFishType.setText(`${typeNames[this.fishTypeIndex]}`)
    })

    const smallTypeCount = 6
    const buttonFishSubtype = new Button(this, 8+buttonSeparationX*2, 8, `${this.fishSubtypeIndex}`, () => {
      this.fishSubtypeIndex++
      this.fishSubtypeIndex %= smallTypeCount
      buttonFishSubtype.setText(`${this.fishSubtypeIndex}`)
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
  width: 160,
  height: 320,
  scale: {
      mode: Phaser.Scale.FIT, // Fits the game inside the parent/window
  },
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
