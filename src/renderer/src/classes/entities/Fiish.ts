import { Entity } from "./Entity";
import type { MainScene } from '../../main'
import { moveTo, fromPloar, angleTo, rpow, expDec, round, normalize, rnum, randbool, randangle, clamp, randegrees, randsign } from '../../utils'

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
  private hurtShakingAngle = 0.0

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
    this.startFoodSearchTimer()

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
  private handleAnimationAngles(dt: number): void {
    const hurtShakeAngle = rpow(this.hurtShakingAngle, 0, 2) * randsign()
    this.setAngle(this.defaultAngle + this.turnAroundAngle + this.movementAngle + hurtShakeAngle + this.movementAngle)

    this.handleMovementAngle(dt)
    this.hurtShakingAngle = expDec(this.turnAroundAngle, 0.0, 8.5, dt, 0.0001)
    this.turnAroundAngle = expDec(this.turnAroundAngle, 0.0, 12.5, dt, 0.0001)
  }
  private doSwimmingWavingAnimation(dt:number): void {
    this.swimmingScalingTimer += dt*this.swimmingScalingTimeScale
    const finalScaleX = 1.0 + sin(this.swimmingScalingTimer)*0.1
    this.setScale(finalScaleX, 1)
  }
  private handleMovementAngle(dt: number): void {
    //El pez girara un poco hacia arriba o abajo, dependiendo de la velocidad vertical
    const vely = this.body!.velocity.y
    const angle = sin(vely) * 10.0
    this.movementAngle = expDec(this.movementAngle, angle, 4, dt, 0.0001)
  }

  //Unas especies de funciones helper para ciertas acciones de los pescados.

  /*
  Decide en base al tamaño de un pez si deberia escapar al ser mas pequeño que este o al contrario, perseguirlo si es mas grande o de igual tamaño.
  Cmabia el estado de su stateMachine a 'escape' o 'chase'.
  */
  chooseToScapeOrChaseFish(otherFish: Fish): void {
    let stateKey: string
    if (otherFish.fishSize > this.fishSize) {
      stateKey = 'escape'
    } else {
      stateKey = 'chase'
    }
    this.stateMachine.simpleSwitch(this, stateKey)
  }

  searchToGetTargetFood():void {
    const food = this.getNearestEntity(this.scene.fishFood, 120)
    if (food === null) {return}
    this.targetFood = food
  }
  searchToGetTargetFish():void {
    const fish = this.getNearestEntity(this.scene.fiishes, 180)
    if (!(fish instanceof Fish)) {return} //Siempre deberia ser true. Lo pongo para que me deje de dar warning el IDE.
    if (fish === null) {return}
    this.targetFish = fish
  }

  pushAgainstFish(otherFish: Fish): void {
    let angle = angleTo(this.getX(), this.getY(), otherFish.getX(), otherFish.getY())
    if (angle === 0) { angle = randangle() }

    let pushPixels = 1 + Math.abs(otherFish.fishSize - this.fishSize)*0.125
    pushPixels *= 0.5
    if (this.fishSize > otherFish.fishSize) {pushPixels *= 0.5}
    if (this.fishSize == otherFish.fishSize) {pushPixels *= 1.5}

    const vec = fromPloar(angle, pushPixels)

    this.setPosition(
      this.getX() - vec[0],
      this.getY() - vec[1]
    )
  }

  die(): void {
    this.timer.clear()
    this.destroy()
    //spawn corpse
  }

  getDamaged(dmg: number, defense = 1): void {
    if (this.life <= 1) {
      this.die()
      return
    }
    this.life -= dmg * defense
    this.life = Math.max(1, this.life)
    this.stateMachine.simpleSwitch(this, 'hurt')
  }

  /*
  Llamado siempre que toca a otro pez diferente
  */
  tryAttackFish(otherFish: Fish): void {
    if (this.targetFish === null) {return}
    if (otherFish !== this.targetFish) { return }
    otherFish.getDamaged(this.dmg, otherFish.defense)

  }

  isHungryForFood(): boolean {
    return this.hunger <= 0.666666
  }

  isHungryForFish(): boolean {
    return this.hunger <= 0.333333
  }

  startInitialFoodSearchTimer(): void {
    this.timer.after(rnum(0, 4), () => {
      this.timer.every(1.5678987654321, () => {
        if (!this.isHungryForFish() && !this.isHungryForFood()) {return}
        if (!this.stateMachine.isOn('wander')) { return }
        this.searchToGetTargetFood()
        this.searchToGetTargetFish()
      })
    })
  }

  //Funciones de "eventos".

  onTouchFish(otherFish: Fish): void {
    if (otherFish === this) {return} //No deberia pasar, pero por si acaso.
    this.pushAgainstFish(otherFish)
    this.tryAttackFish(otherFish)
  }

  /*
  Por defecto, al ser detectado por otro pez que lo esta persiguiendo, puede optar por escapar si es mas pequeño que el atacante o de otro modo perseguirlo.
  Esto signfica que los peces solo escapan de otros especificamente cuando estan perseguidos y tambien que el rango de vision que tiene para escapar
  de un pez es menor al que tienen para perseguir a uno
  */
  onTargetedByFish(otherFish: Fish): void {
    const dx = otherFish.x - this.x
    const dy = otherFish.y - this.y
    //No es necesario conseguir la raiz cuadrada para la distancia, de hecho es considerablemente un poco mas optimizado a que si se usara Math.sqrt.
    const distanceSquared = (dx * dx) + (dy * dy)

    const fishCount = 5 //Se usa para la distancia, el cual es la variable siguiente.
    const sizeAproximadoDeCantidadDeSmallPeces = 8 * fishCount
    if (distanceSquared > (sizeAproximadoDeCantidadDeSmallPeces * sizeAproximadoDeCantidadDeSmallPeces)) {
      this.targetFish = otherFish
      this.chooseToScapeOrChaseFish(otherFish)
    }
  }

  /*
  Por defecto, al ser atacado por otro pez, cambia al estado hurt. Recomiendo dejarlo asi, la verdad.
  //Por defecto, al ser atacado por otro pez, puede optar por escapar si es mas pequeño que el atacante o de otro modo perseguirlo.
  */
  onAttackedByFish(otherFish: Fish): void {
    this.targetFish = otherFish
    this.chooseToScapeOrChaseFish(otherFish)
  }

  //Funciones de estados.

  spawnStart(): void {
    this.setVelocityY( rnum(32, 96) )
  }
  spawnUpdate(dt: number): void {
    if (this.stateMachine.getTime() > 1.5) {
      this.stateMachine.simpleSwitch(this, 'wander')
    }

    const vely = this.body!.velocity.y
    const accel = rnum(32, 96)
    this.setVelocityY( moveTo(vely, 0, accel*dt) )
  }


  //En wander, timeCount es utilizado para cambiar el movimiento esporadico en un lapso de segundos aleatorio.
  wanderStart():void {
    const MIN_MOVEMENT_PATTERN_SECONDS = 0.75
    const MAX_MOVEMENT_PATTERN_SECONDS = 4.0

    this.timeCount = -rnum(MIN_MOVEMENT_PATTERN_SECONDS, MAX_MOVEMENT_PATTERN_SECONDS)
  }
  wanderUpdate(dt: number): void {
    if (this.targetFish !== null) {
      this.chooseToScapeOrChaseFish(this.targetFish)
      return
    }
    if (this.targetFood !== null) {
      this.stateMachine.simpleSwitch(this, 'chase')
      return
    }

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

  hurtStart(): void {
    this.hurtShakingAngle = 66.66

    //Aplicar knockback solo si existe el pez que lo ataco no es nulo.
    if (this.targetFish === null) { return }

    const otherFish = this.targetFish

    const knockbackAngle = angleTo(otherFish.getX(), otherFish.getY(), this.getX(), this.getY())
    let knockbackSpeed = 1 + Math.abs(otherFish.fishSize - this.fishSize)
    knockbackSpeed *= 48
    if (this.fishSize > otherFish.fishSize) {knockbackSpeed *= 0.333}
    if (this.fishSize == otherFish.fishSize) {knockbackSpeed *= 0.666666}

    const vel = fromPloar(knockbackAngle, knockbackSpeed)
    this.setVelocity(vel[0], vel[1])
  }
  hurtUpdate(dt: number): void {
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    const decay = rnum(3, 9)
    this.setVelocityX( expDec(velx, 0, decay, dt, 0.1) )
    this.setVelocityY(expDec(vely, 0, decay, dt, 0.1))

    if (this.stateMachine.getTime() <= 0.5) { return }

    if (this.targetFish === null) {
      this.stateMachine.simpleSwitch(this, 'wander')
      return
    }
    this.chooseToScapeOrChaseFish(this.targetFood)
  }

  escapeUpdate(dt:number): void {
    if (this.targetFish === null) {
      this.stateMachine.simpleSwitch(this, 'wander')
      return
    }

    let gotox = -this.body!.position.x
    let gotoy = -this.body!.position.y
    const offset = 24
    gotox += this.targetFish.body!.position.x + rnum(-offset, offset)
    gotoy += this.targetFish.body!.position.y + rnum(-offset, offset)

    const normal = normalize(gotox, gotoy)
    const decayX = rnum(2.5, 4.5)
    const decayY = rnum(2.5, 4.5)
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    const speed = 52.0
    this.setVelocityX( expDec(velx, speed*normal[0], decayX, dt, 0.1) )
    this.setVelocityY( expDec(vely, speed*normal[1], decayY, dt, 0.1) )
  }

  chaseUpdate(dt:number): void {
    if (this.targetFish === null) {
      this.stateMachine.simpleSwitch(this, 'wander')
      return
    }

    let gotox = -this.body!.position.x
    let gotoy = -this.body!.position.y
    const offset = 6
    gotox += this.targetFish.body!.position.x + rnum(-offset, offset)
    gotoy += this.targetFish.body!.position.y + rnum(-offset, offset)

    const normal = normalize(gotox, gotoy)
    const decayX = rnum(0.5, 7.5)
    const decayY = rnum(0.5, 7.5)
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    const speed = 51.9
    this.setVelocityX( expDec(velx, speed*normal[0], decayX, dt, 0.55555) )
    this.setVelocityY( expDec(vely, speed*normal[1], decayY, dt, 0.55555) )
  }

  attackStart():void {
    this.timeCount = 0
  }
  attackUpdate(dt: number): void {
    if (this.stateMachine.getTime() > 0.666666) {
      if (this.targetFish === null) {
        this.stateMachine.simpleSwitch(this, 'wander')
        return
      }
      this.chooseToScapeOrChaseFish(this.targetFish)
      return
    }

    const shakeDy = cos(this.timeCount * 32) * 155 * dt
    this.setY(this.body!.y + shakeDy)

    const decay = rnum(5, 20)
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    this.setVelocityX( expDec(velx, 0, decay, dt) )
    this.setVelocityY(expDec(vely, 0, decay, dt))
  }

  override thisupdate(dt: number): void {
    this.handleAnimationAngles(dt)
    this.doSwimmingWavingAnimation(dt)
  }
}
