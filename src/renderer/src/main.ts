import Phaser from 'phaser'
import { preloadAnims, createAnims } from './assets/anims'
import { BaseFish, createFish, FISH_SIZES } from './classes/deprecated/FishFactory'
import { BubbleParticle } from './classes/BubbleParticle'
import { Button } from './classes/Button'
import { FishFood } from './classes/deprecated/FishFood'
import { Particle } from './classes/Particle'
import EnumFishTypes from './classes/EnumFishTypes'
import { Fish } from './classes/entities/Fiish'
import { Food } from './classes/entities/Food'
import { Croqueta } from './classes/entities/foods/croqueta'
import { SwordFishSmall } from './classes/entities/fishes/swordFish/swordFishSmall'
import { TankData } from './classes/TankData'
import { HudFishCounter } from './classes/hud/HudFishCounter'
import { StatsFishViewr } from './classes/hud/StatsFishViewr'
import { registerOutlineFilter } from './classes/shaders/Outline';
import waterHealthIcon from './assets/images/hud/waterHealthIcon.png'
import waterHealthAntena from './assets/images/hud/waterHealthAntena.png'
import waterHealthArch from './assets/images/hud/waterHealthArch.png'
import { expDec, moveTo } from './utils'


export class MainScene extends Phaser.Scene {
  public fiishes!: Phaser.Physics.Arcade.Group
  public food!: Phaser.Physics.Arcade.Group
  public bubbles!: Phaser.Physics.Arcade.Group
  public particles!: Phaser.Physics.Arcade.Group

  public tankData!: TankData

  private fishTypeIndex: number = 0
  private fishSubtypeIndex: number = 0
  private waterHealthAntenaAngle = 0.0
  private waterHealthAntenaImage!: Phaser.GameObjects.Image

  public fishCounter!: HudFishCounter
  public statsFishViewr!: StatsFishViewr

  preload(): void {
    preloadAnims(this)

    this.load.image('waterHealthIcon', waterHealthIcon);
    this.load.image('waterHealthAntena', waterHealthAntena);
    this.load.image('waterHealthArch', waterHealthArch);
  }

  create(): void {
    createAnims(this)

    registerOutlineFilter(this.game);

    this.add.image(97, 8, 'waterHealthArch').setDepth(101).setOrigin(0,0)
    this.waterHealthAntenaImage = this.add.image(131, 27, 'waterHealthAntena').setDepth(102).setOrigin(0.925925, 0.5)
    this.add.image(121, 20, 'waterHealthIcon').setDepth(103).setOrigin(0,0)

    this.fishCounter = new HudFishCounter(this, 16, 25 )
    this.tankData = new TankData(this)
    this.statsFishViewr = new StatsFishViewr(this, 60, 286)

    this.fiishes = this.physics.add.group({ classType: Fish, runChildUpdate: true })
    this.fiishes.defaults = {} as Phaser.Types.Physics.Arcade.PhysicsGroupDefaults
    this.food = this.physics.add.group({ classType: Food, runChildUpdate: true })
    this.food.defaults = {} as Phaser.Types.Physics.Arcade.PhysicsGroupDefaults
    this.bubbles = this.physics.add.group({ classType: BubbleParticle, runChildUpdate: true })
    this.particles = this.physics.add.group({ classType: Particle, runChildUpdate: true })


    this.physics.add.overlap(this.fiishes, this.fiishes, (a, b) => {
      if (a === b) return
      ;(a as unknown as Fish).onTouchFish(b as unknown as Fish)
    })
    this.physics.add.overlap(this.fiishes, this.food, (fish, foodObj) => {
      ;(fish as unknown as Fish).onTouchFood(foodObj as unknown as Food)
    })


    const { width, height } = this.sys.game.config as { width: number; height: number };
    const bg = this.add.image(width*0.5, height*0.5, 'bg');
    bg.setDisplaySize(width, height);
    const hud = this.add.image(width*0.5, height*0.5, 'hud');
    hud.setDisplaySize(width, height);
    hud.setDepth(100)

    for (let i = 0; i < 10; i++) {
      //const x = Phaser.Math.Between(16, width - 16)
      const croqueta = new Croqueta(this)
      this.food.add(croqueta)
    }

    for (let i = 0; i < 10; i++) {
      //const x = Phaser.Math.Between(16, width - 16)
      const fish = new SwordFishSmall(this, undefined, undefined)
      this.fiishes.add(fish)
    }

    for (let i = 0; i < 12; i++) {
      const bubble = new BubbleParticle(this)
      this.bubbles.add(bubble)
    }

    const scene = this
    //api declarado desdde src/preload/index.ts
    if (window.api && typeof window.api.onSpawnFish === 'function') {
      window.api.onSpawnFish((payload: any) => {
        scene.spawnFishFromPayload(payload)
      })
    }
console.log(Phaser.VERSION);
    /*
    const buttonSeparationX = 40
    new Button(this, 8, 8, "spawn", () => {
      if (this.fishTypeIndex == 3) {
        const fishFoodTest = new FishFood(this)
        this.fishFood.add(fishFoodTest)
        return
      }
      const fishSizes = [FISH_SIZES.SMALL, FISH_SIZES.MED, FISH_SIZES.BIG]
      const fishSize = fishSizes[this.fishTypeIndex] ?? FISH_SIZES.SMALL
      const fish = createFish(this, width * 0.5, height * 0.5, fishSize, this.fishSubtypeIndex)
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
    */
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
    let fishSize = FISH_SIZES.SMALL
    if (fishType === 1) fishSize = FISH_SIZES.MED
    else if (fishType === 2) fishSize = FISH_SIZES.BIG
    const fish = createFish(this, x, y, fishSize, scale)
    this.fishes.add(fish)
  }

  update(_time: number, _delta: number): void {
    const dt = _delta * 0.001
    //const tiempo = _time * 0.001

    this.waterHealthAntenaAngle = expDec(this.waterHealthAntenaAngle, this.tankData.getWaterContaminationPercentage()*170, 1.1, dt)
    this.waterHealthAntenaImage.setAngle(this.waterHealthAntenaAngle)

    this.statsFishViewr.refresh()


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
