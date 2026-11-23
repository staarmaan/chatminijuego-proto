import { MainScene } from "../../main";
import { moveTo, randangle, randsign, rnum, rpow } from "../../utils";
import { Entity } from "./Entity";
import { Fish } from "./Fiish";

const cos = Math.cos
const sin = Math.sin
const abs = Math.abs

const FLOOR_Y_LEVEL_MIN = 262
const FLOOR_Y_LEVEL_MAX = FLOOR_Y_LEVEL_MIN + 3


export class Food extends Entity {
  public readonly moveDirX = randsign()
  public hits:number
  public readonly initHits: number
  public hungerPercentAdd = 0.15
  public contaminationLifeLoss = 1 //Entero.
  public contaminationPercentAdd = 0.01
  public contaminateFrequency = 12.5
  public currentContaminationFase = 0
  public targetVelY = rpow(2.0, 6.0, 3)
  public angleForWaterMovement = randangle()

  public username: string

  constructor(scene: MainScene, hits:number, circleRadius: number, contaminateFrequency: number, texture: string, username="noname", x = rnum(0, scene.scale.width), y = 32) {
    super(scene, x, y, texture)

    this.hits = hits
    this.initHits = hits

    this.clampHorizontally(10)

    this.setCircle(circleRadius)
    this.body?.setOffset(circleRadius, circleRadius)

    this.contaminateFrequency = contaminateFrequency

    this.username = username

    this.startContaminateTimer()

    this.stateMachine
      .autoRegister('float', this)
      .autoRegister('ground', this)
    this.stateMachine.simpleSwitch(this, 'float')
  }

  startContaminateTimer(): void {
    this.timer.after(rnum(1.5, 3.5), () => {
      this.timer.every(this.contaminateFrequency, () => {
        if (this.stateMachine.isOn('float')){return}
        this.onContaminate()
      })
    })
  }

  onDie(): void { return }

  onContaminate(): void {
    this.scene.tankData.contaminateWater(this.contaminationPercentAdd)
    this.currentContaminationFase++
    this.getBitenByFish(null, this.contaminationLifeLoss)
    /*
    if ((this.currentContaminationFase >= this.maxContaminationFase) || (this.hits <= 0)) {
      this.onDie()
      this.destroy()
    }
    */
  }

  getBitenByFish(fish: Fish | null, hits = 1): void {
    if (!this.active) return

    const multi = 1.0 + rpow(0, 0.4, 2) * randsign()
    this.hits -= abs(hits) * multi

    if (fish !== null) {
      fish.fillHunger(this.hungerPercentAdd)
      fish.onFoodBite(this)
    }

    if (this.hits <= 0) {
      this.onDie()
      this.destroy()
    }
  }

  //Funciones de los estados

  /*
  Aqui, la comida se mueve como si fuese una hoja en el viento, oscilando su velocidad horoizontal asi como bajando lentamente hasta "tocar" el "suelo" (representado simplemente como una altitud con FLOOR_Y_LEVEL_MIN).
  */
  floatUpdate(dt: number): void {
    if (this.getY() > FLOOR_Y_LEVEL_MIN) {
      this.targetVelY = moveTo(this.targetVelY, 0.0, rnum(0.5, 2.5) * dt)
      if (this.targetVelY <= 0) {
        this.stateMachine.simpleSwitch(this, 'ground')
        return
      }
    } else {
      this.targetVelY = moveTo(this.targetVelY, rnum(0.05, 2.5), rnum(0.01, 8) * dt)
    }

    this.clampHorizontally(-3)

    this.angleForWaterMovement += dt
    const SPEED_X = 16.0
    const SPEED_Y = 12.0
    const velx = cos(this.angleForWaterMovement) * SPEED_X * this.targetVelY * this.moveDirX
    const vely = abs(sin(this.angleForWaterMovement)) * SPEED_Y * this.targetVelY
    this.setVelocity(velx, vely)
  }

  groundStart(): void {
    this.setVelocity(0, 0)
    this.targetVelY = 1.0
    this.angleForWaterMovement = randangle()
  }
  groundUpdate(dt: number): void {
    this.angleForWaterMovement += dt*rpow(0, 1, 1.5)
    this.setVelocityX(cos(this.angleForWaterMovement)*3.0*this.moveDirX)

    const y = this.getY()
    if (y > FLOOR_Y_LEVEL_MAX) {
      this.targetVelY = -1.0
    }
    if (y < FLOOR_Y_LEVEL_MIN) {
      this.targetVelY = 1.0
    }

    this.clampHorizontally(0)
    this.clampVertically(0)

    const vely = this.body!.velocity.y
    const speed = rnum(0.01, 1.0) * 16
    const nextVely = moveTo(vely, this.targetVelY*speed, rnum(1,5)*dt)
    this.setVelocityY(nextVely)
  }

}
