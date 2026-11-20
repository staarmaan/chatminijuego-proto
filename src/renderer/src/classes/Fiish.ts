import { Entity } from "./Entity";
import type { MainScene } from '../main'
import { moveTo, fromPloar, angleTo, rpow, expDec, round, normalize, rnum, randbool, randangle, clamp, randegrees } from '../utils'

const cos = Math.cos
const sin = Math.sin

export enum FISH_SIZES {
  SMALL,
  MED,
  BIG
}

const SPAWN_STATE_TIME = 2.5

export class Fish extends Entity {
  //Stats
  public life = 1.0
  public hunger = 1.0 //Porentage que va de 0.0 a 1.0.
  public evolutionTimeCount = 0.0
  public defense = 1.0 //Porentage.
  public dmg = 0.2 //Cantidad que se restara al life de otro pescado al atacar.
  public starveDmg = 0.1 //Cantidad que se restara a su life cuando su hunger este en 0.
  public readonly fishSize: FISH_SIZES
  public readonly username: string

  //Otros importantes
  public targetFish: Fish|null = null //Utilizado en general para perseguir, atacar o escapar de un Fish.
  public targetFood: Food | null = null //Utilizado con los FishCroquettes, Coconut o CorpseFish.

  //Para animacion
  private turnAroundDir = 1 //Utilizado para voltear el turnAroundAngle solo cuando cambia de direccion de velocityX.
  private turnAroundAngle = 0.0 //En grados.
  private movementAngle = 0.0 //En grados.
  private defaultAngle = 0.0 //El angulo "indicado" al que se le sumara turnAroundAngle y movementAngle
  private swimmingScalingTimer = 0.0
  private swimmingScalingTimeScale = 1.0

  //Para movimiento
  private wanderTargetVelX = 0.0 //Porentage que va de 0.0 a 1.0. Se utiliza en wander state.
  private wanderTargetVelY = 0.0 //Porentage que va de 0.0 a 1.0. Se utiliza en wander state.

  constructor(scene: MainScene, x = rnum(0, scene.scale.width), y = -24, fishSize: FISH_SIZES, username="noname", texture: string) {
    super(scene, x, y, texture)

    this.fishSize = fishSize
    this.username = username

    this.clampHorizontally(10)

    const circleRadius = (fishSize+1)*5.0
    this.setCircle(circleRadius)
    this.body?.setOffset(circleRadius, circleRadius)

    this.startTurnAroundTimer()

    this.stateMachine
      .autoRegister('spawn', this)
      .autoRegister('wander', this)
      .autoRegister('escape', this)
      .autoRegister('chase', this)
      .autoRegister('attack', this)
      .autoRegister('hurt', this)
      .autoRegister('evolve', this)
    this.stateMachine.simpleSwitch(this, 'spawn')
  }

  //Funciones de animacion procedural.
  private startTurnAroundTimer(): void {
    const tryTurnAroundTime = 0.4
    //Utilizo un timer para que solo cambie de direccion cada cierto tiempo, para evitar que gire bruscamente cuando cambiar de direccion varias veces en pocos frames.
    //this.timer.after(rnum(0, SPAWN_STATE_TIME), () => {
      this.timer.every(tryTurnAroundTime, () => {
        const velx = this.body!.velocity.x
        const vely = this.body!.velocity.y
        if (velx != 0) {
          let angle = 45.0 //Este es el angulo (en grados) que tendra el pezcado cuando cambie de direccion.
          if (vely < 0) { angle = -angle } //Si esta moviendose hacia arriba, se invierte para que gire "hacia arriba".

          //En este bloque, turnAroundDir se utiliza para que solo gire en un cambio de direccion de velocityX, y no en cada frame.
          if (velx > 0) {
            this.setFlipX(false)
            if (this.turnAroundDir != 1) {
              this.turnAroundDir = 1
              this.turnAroundAngle = angle
            }
          } else {
            this.setFlipX(true)
            if (this.turnAroundDir != -1) {
              this.turnAroundDir = -1
              this.turnAroundAngle = -angle //Invertir si se mueve a la izquierde para que "gire desde la derecha".
            }
          }
        }
      })
    //})
  }
  private handleTurnAroundAngle(dt:number): void {
    this.setAngle(this.defaultAngle + this.turnAroundAngle + this.movementAngle)
    this.turnAroundAngle = expDec(this.turnAroundAngle, 0.0, 12.5, dt, 0.0001)
  }

  private doSwimmingWavingAnimation(dt:number): void {
    this.swimmingScalingTimer += dt*this.swimmingScalingTimeScale
    const finalScaleX = 1.0 + sin(this.swimmingScalingTimer)*0.1
    this.setScale(finalScaleX, 1)
  }

  spawnStart(): void {
    this.setVelocityY( rnum(32, 96) )
  }
  spawnUpdate(dt:number): void {
    const vely = this.body!.velocity.y
    const accel = rnum(32, 96)
    this.setVelocityY( moveTo(vely, 0, accel*dt) )
  }

 //Funciones de "eventos".
 onTargetedByFish(otherFish: Fish): void {
   this.targetFish = otherFish

   let stateKey: string
   if (otherFish.fishSize > this.fishSize) {
     stateKey = 'escape'
   } else {
     stateKey = 'chase'
   }
   this.stateMachine.simpleSwitch(this, stateKey)
 }

  //En wander, timeCount es utilizado para cambiar el movimiento esporadico en un lapso de segundos aleatorio.
  wanderState():void {
    const MIN_MOVEMENT_PATTERN_SECONDS = 0.75
    const MAX_MOVEMENT_PATTERN_SECONDS = 4.0

    this.timeCount = -rnum(MIN_MOVEMENT_PATTERN_SECONDS, MAX_MOVEMENT_PATTERN_SECONDS)
  }
  wanderUpdate(dt: number): void {
    if (this.timeCount > 0) {
      const MIN_MOVEMENT_PATTERN_SECONDS = 0.5
      const MAX_MOVEMENT_PATTERN_SECONDS = 2.5
      this.timeCount = -rnum(MIN_MOVEMENT_PATTERN_SECONDS, MAX_MOVEMENT_PATTERN_SECONDS) //Es negativo porque timeCount siempre aumenta por dt, el cual es positivo.

      const mode = round(rnum(0,2))
      switch (mode) {
        case 0:
          this.wanderTargetVelX = rnum(-1,1)
          break //Solo cambiar velocityX.
        case 1:
          this.wanderTargetVelY = rnum(-1,1)
          break //Solo cambiar velocityY.
        case 2:
          this.wanderTargetVelX = rnum(-1,1)
          this.wanderTargetVelY = rnum(-1,1)
          break
      } //Cambiar velocityX y velocityY.
    }

    const speed = 25.0 //En pixeles.
    const accel = speed //En pixeles tambien.
    this.setVelocityX(moveTo(this.body!.velocity.x, this.wanderTargetVelX * speed, dt * accel))
    this.setVelocityY(moveTo(this.body!.velocity.y, this.wanderTargetVelY * speed, dt * accel))

    const velLenghtSquared = (this.wanderTargetVelX * this.wanderTargetVelX) + (this.wanderTargetVelY * this.wanderTargetVelY)
    if (velLenghtSquared > (0.666666 * 0.666666)) { this.swimmingScalingTimeScale = 1.0 }
    else if (velLenghtSquared > (0.333 * 0.333)) { this.swimmingScalingTimeScale = 0.666666 }
    else {this.swimmingScalingTimeScale = 0.333}

    //Si esta cerca de los margenes de la pantalla, tratar de regresar al centro.
    const outPixelsX = (this.fishSize+1) * 12
    const outPixelsY = 80 + outPixelsX //La resolucion del juego es de 320 pixeles pero el tamaño "jugable" es de 240 pixeles. Restando los dos da 80.
    if (this.isOffScreen(outPixelsX, outPixelsY)) {
      const { width, height } = this.scene.scale
      const angleOffset = (rnum(-1,1)) * 1.001 //Esto es en radianes.
      const gotoAngle = angleTo(this.x, this.y, width * 0.5, height * 0.5) + angleOffset
      const vel = fromPloar(gotoAngle, rpow(1, 0, 8))
      this.wanderTargetVelX = vel[0]
      this.wanderTargetVelY = vel[1]

      this.timeCount = 0
    }
  }
  wanderEnd(): void {
    this.timeCount = 0.0
  }



  override thisupdate(dt: number): void {
    this.handleTurnAroundAngle(dt)
    this.doSwimmingWavingAnimation(dt)
  }
}
