import { Entity } from "./Entity";
import type { MainScene } from '../../main'
import { moveTo, fromPloar, angleTo, rpow, expDec, round, normalize, rnum, randbool, randangle, clamp, randegrees, randsign, invLerp, lerp } from '../../utils'
import { Food } from "./Food";
import { CorpseFish } from "./foods/corpseFish";
import { OutlineController } from '../shaders/Outline';

const abs = Math.abs
const cos = Math.cos
const sin = Math.sin

export enum FISH_SIZES {
  SMALL,
  MED,
  BIG
}

export type eatPriorities = {food:number, smallFish:number, medFish:number, bigFish:number}

export type FishClass = new (...args: any[]) => Fish

let nextFishId = 0

export class Fish extends Entity {
  //Stats
  public life:number
  public initLife: number
  public hunger = 1.0 //Porentage que va de 1.0 y decrementa por lossHungerPerSecond (por segundo) hasta llegar a 0.0.
  public lossHungerPerSecond = 0.0165 //Decrementa hunger en porcentage por segundo.
  public healPercentFromFullHungerPerSecond = 0.05 //Cuando hunger esta por encima de 66.6666%, se cura con el valor de esta variable.
  public fillHungerMulti = 1.0 //Cuando come comida, el porcentage de hunger que da la comida sera multiplicado por este valor antes de ser añadido a hunger.
  public evolutionMaxTime = rpow(5, 25, 2)
  public evolutionTimeCount = 0.0
  public defense = 1.0 //Porentage. Mientras mas bajo, menos daño recive de ataques de peces y vsiceversa.
  public dmg = 0.265 //Cantidad que se restara al life de otro pescado al atacar.
  public starveDmg = 0.1 //Cantidad que se restara a su life cuando su hunger este en 0.
  public readonly fishSize: FISH_SIZES
  public readonly username: string
  public readonly fishId: number

  //Otros importantes
  public targetFish: Fish|null = null //Utilizado en general para perseguir, atacar o escapar de un Fish.
  public targetFood: Food | null = null //Utilizado con los FishCroquettes, Coconut o CorpseFish.
  public fishTexture: string
  public eatPriority: eatPriorities = { food: 1, smallFish: 2, medFish: 3, bigFish: 4 }
  public nextEvolutionClass?: FishClass //Si tiene una clase asignada, evolucionará a esta cuando evolutionTimeCount alcance evolutionMaxTime. Si no, no evoluciona.

  //Para animacion
  private turnAroundDir = 1 //Utilizado para voltear el turnAroundAngle solo cuando cambia de direccion de velocityX.
  private turnAroundAngle = 0.0 //En grados.
  private movementAngle = 0.0 //En grados.
  private defaultAngle = 0.0 //El angulo "indicado" al que se le sumara turnAroundAngle y movementAngle
  private swimmingScalingTimer = 0.0
  private swimmingScalingTimeScale = 1.0
  private hurtShakingAngle = 0.0
  public outlineFx: Phaser.Filters.Controller

  //Para movimiento
  private wanderTargetVelX = 0.0 //Porentage que va de 0.0 a 1.0. Se utiliza en wander state.
  private wanderTargetVelY = 0.0 //Porentage que va de 0.0 a 1.0. Se utiliza en wander state.

  constructor(scene: MainScene, fishSize: FISH_SIZES, texture: string, nextEvolutionClass?: FishClass, life=1, username="", x = rnum(0, scene.scale.width), y = 32) {
    super(scene, x, y, texture)

    const internalFilters = this.filters!.internal
    this.outlineFx = internalFilters.add(new OutlineController(internalFilters.camera, 1, 0xffffff))
    this.outlineFx.setActive(false)

    this.life = life
    this.initLife = life

    this.nextEvolutionClass = nextEvolutionClass

    this.scene.tankData.incrementAliveFishCount(1)

    this.setDepth(5 - 0.1*fishSize)

    this.fishTexture = texture
    this.fishSize = fishSize

    this.fishId = nextFishId
    nextFishId++
    if (username === "") { username = `fish-${this.fishId}` }
    this.username = username

    this.play(`${this.fishTexture}-size${this.fishSize}`)

    this.clampHorizontally(10)

    const circleRadius = (fishSize+1)*5.0
    this.setCircle(circleRadius)
    const offset = 24 - circleRadius
    this.body?.setOffset(offset, offset)

    this.startTurnAroundTimer()
    this.startInitialFoodSearchTimer()
    this.startStarveDamageTimer()

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

  override destroy(fromScene?: boolean): void {
    this.timer.clear()
    this.scene.tankData.incrementAliveFishCount(-1)
    super.destroy(fromScene);
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
    this.setAngle(this.defaultAngle + this.turnAroundAngle + hurtShakeAngle + this.movementAngle)

    this.handleMovementAngle(dt)
    this.hurtShakingAngle = expDec(this.hurtShakingAngle, 0.0, 8.5, dt, 0.0001)
    this.turnAroundAngle = expDec(this.turnAroundAngle, 0.0, 12.5, dt, 0.0001)
  }
  private doSwimmingWavingAnimation(dt:number): void {
    this.swimmingScalingTimer += dt*this.swimmingScalingTimeScale
    const finalScaleX = 1.0 + sin(this.swimmingScalingTimer*3)*0.15
    this.setScale(finalScaleX, 1)
  }
  private handleMovementAngle(dt: number): void {
    //El pez girara un poco hacia arriba o abajo, dependiendo de la velocidad vertical
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    const angle = angleTo(0,0, 64, vely*Math.sign(velx))/Math.PI*180
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
    const food = this.getNearestEntity(this.scene.food, 120)
    if (food === null) {return}
    if (!(food instanceof Food)) {return} //Siempre deberia ser true. Lo pongo para que me deje de dar warning el IDE.
    this.targetFood = food
  }
  searchToGetTargetFish():void {
    const fish = this.getNearestEntity(this.scene.fiishes, 180)
    if (fish === null) {return}
    if (!(fish instanceof Fish)) {return} //Siempre deberia ser true. Lo pongo para que me deje de dar warning el IDE.
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
    if (this.stateMachine.isOn('evolve')) {return}
    const corpse = new CorpseFish(this)
    this.onDie(corpse)
    this.destroy()
  }

  getDamaged(dmg: number, defense = 1): void {
    if (this.stateMachine.isOn('evolve')) { return }

    const forgivenessLife = 0.001 //Si recive daño mortal, lo perdona permitiendo aguatar un hit mas.
    if (this.life <= forgivenessLife) {
      this.die()
      return
    }
    const multi = 1.0 + rpow(0, 0.25, 4.5 - this.fishSize) * randsign()
    this.life -= dmg * defense * multi
    this.life = Math.max(forgivenessLife, this.life)
    this.stateMachine.simpleSwitch(this, 'hurt')
  }

  fillHunger(percentAdd: number): void {
    this.hunger = clamp(this.hunger + abs(percentAdd * this.fillHungerMulti), 0, this.initLife)
  }

  /*
  Llamado siempre que toca a otro pez.
  Para que pueda atacarlo, debe tener en blanco a el mismo pez que toco.
  */
  tryAttackFish(otherFish: Fish): void {
    //if (!this.isHungryForFish()) {return}
    if (this.targetFish === null) {return}
    if (otherFish !== this.targetFish) { return }
    if (!this.stateMachine.isOn('chase')) {return}
    this.stateMachine.simpleSwitch(this, 'attack')
    otherFish.onAttackedByFish(this)
    otherFish.getDamaged(this.dmg, otherFish.defense)
  }

  /*
  Llamado siempre que toca una comida.
  Para que pueda atacarlo, debe tener en blanco a la misma comida que toco.
  */
  tryBiteFood(food: Food): void {
    //if (!this.isHungryForFood()) {return}
    if (this.targetFood === null) {return}
    if (food !== this.targetFood) { return }
    if (!this.stateMachine.isOn('chase')) {return}
    food.getBitenByFish(this)
  }

  isHungryForFood(): boolean {
    return this.hunger <= 0.666666
  }

  isHungryForFish(): boolean {
    return this.hunger <= 0.333
  }

  startInitialFoodSearchTimer(): void {
    this.timer.after(rnum(0, 4), () => {
      this.timer.every(1.5678987654321, () => {
        if (!this.stateMachine.isOn('wander')) { return }
        if (this.isHungryForFood()) { this.searchToGetTargetFood() }
        if (this.isHungryForFish()) { this.searchToGetTargetFish() }
      })
    })
  }

  startStarveDamageTimer(): void {
    this.timer.after(rnum(0, 4), () => {
      this.timer.every(1.05, () => {
        if (this.hunger > 0) { return }
        this.getDamaged(this.starveDmg)
      })
    })
  }

  doEvolution(): void {
    if (!this.active) {return}
    if (!this.nextEvolutionClass) {return}
    const evolvedFish = new this.nextEvolutionClass(this.scene, this.getX(), this.getY(), this.username)
    this.scene.fiishes.add(evolvedFish)
    evolvedFish.setVelocityY(-25)
    evolvedFish.onEvolveSpawn()
    evolvedFish.setFlipX(this.flipX)
    this.destroy()
  }

  //Funciones de "eventos".

  onEvolveSpawn(): void {return}

  /*
  Todavia no se destruye cuando se llama esta funcion. Hecha para ser sobre-escrita.
  */
  onDie(corpse: CorpseFish | null = null): void { return }

  onTouchFood(food: Food): void {
    //if (food === this) {return} //No deberia pasar, pero por si acaso.
    this.tryBiteFood(food)
  }

  onTouchFish(otherFish: Fish): void {
    if (otherFish === this) {return} //No deberia pasar, pero por si acaso.
    this.pushAgainstFish(otherFish)
    if (randbool()) {return} //Esto es para que cuando se toquen dos peces al mismo tiempo, sea random cual de los dos haga daño primero.
    this.tryAttackFish(otherFish)
  }

  /*
  Ejecutado desde Food.ts cuando le da una mordidad a una instancia de Food.
  Este se llama antes de que el food se destruya por morir de hits, por lo que incluso cuando llega a 0 de vida (osea food.hits), todavia seguira vivo solo en esta funcion.
  */
  onFoodBite(food: Food): void {
    this.stateMachine.simpleSwitch(this, 'attack')
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

    const fishCount = 4 //Se usa para la distancia, el cual es la variable siguiente.
    const sizeAproximadoDeCantidadDeSmallPeces = 8 * fishCount
    if (distanceSquared <= (sizeAproximadoDeCantidadDeSmallPeces * sizeAproximadoDeCantidadDeSmallPeces)) {
      this.targetFish = otherFish
      this.chooseToScapeOrChaseFish(otherFish)
    }
  }

  /*
  Se llama antes que getDamaged cuando es tocado por un pez y atacado.
  */
  onAttackedByFish(otherFish: Fish): void {
    this.targetFish = otherFish
    //this.chooseToScapeOrChaseFish(otherFish)
  }

  //Funciones de estados.

  spawnStart(): void {
    this.setVelocityY(rpow(72, 26, 2))
  }
  spawnUpdate(dt: number): void {
    if (this.stateMachine.getTime() > 1.5) {
      this.stateMachine.simpleSwitch(this, 'wander')
    }

    const vely = this.body!.velocity.y
    const accel = rnum(8, 32)*dt
    this.setVelocityY( moveTo(vely, 0, accel) )
  }


  //En wander, timeCount es utilizado para cambiar el movimiento esporadico en un lapso de segundos aleatorio.
  wanderStart():void {
    const MIN_MOVEMENT_PATTERN_SECONDS = 0.75
    const MAX_MOVEMENT_PATTERN_SECONDS = 4.0

    this.timeCount = -rnum(MIN_MOVEMENT_PATTERN_SECONDS, MAX_MOVEMENT_PATTERN_SECONDS)
  }
  wanderUpdate(dt: number): void {
    if (this.targetFish !== null && this.isHungryForFish()) {
      this.chooseToScapeOrChaseFish(this.targetFish)
      return
    }
    if (this.targetFood !== null && this.isHungryForFood()) {
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
    const outPixelsX = 42 + (this.fishSize*4)
    const outPixelsY = 40 + outPixelsX //La resolucion del juego es de 320 pixeles pero el tamaño "jugable" es de 240 pixeles. Restando los da 80, pero se tiene que dividir entre dos porque esta cantidad aplica para arriba y abajo.
    if (this.isOffScreen(outPixelsX, outPixelsY)) {
      const { width, height } = this.scene.scale
      const angleOffset = (rnum(-1,1)) * 0.5 //Esto es en radianes.
      const gotoAngle = angleTo(this.getX(), this.getY(), width * 0.5, height * 0.5) + angleOffset
      const vel = fromPloar(gotoAngle, rpow(1, 0.5, 8))
      this.wanderTargetVelX = vel[0]
      this.wanderTargetVelY = vel[1]

      this.timeCount = -rnum(0.5, 4.5)
    }
  }
  wanderEnd(): void {
    this.timeCount = 0.0
  }

  hurtStart(): void {
    this.setTint(0xffbbbb)

    this.hurtShakingAngle = 66.66

    //Aplicar knockback solo si existe el pez que lo ataco no es nulo.
    if (this.targetFish === null) { return }

    const otherFish = this.targetFish

    const knockbackAngle = angleTo(otherFish.getX(), otherFish.getY(), this.getX(), this.getY())
    let knockbackSpeed = 1 + Math.abs(otherFish.fishSize - this.fishSize)
    knockbackSpeed *= rnum(32, 96)
    if (this.fishSize > otherFish.fishSize) {knockbackSpeed *= 0.333}
    if (this.fishSize == otherFish.fishSize) {knockbackSpeed *= 0.666666}

    const vel = fromPloar(knockbackAngle, knockbackSpeed)
    this.setVelocity(vel[0], vel[1])
  }
  hurtUpdate(dt: number): void {
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    const decay = rnum(1, 5)
    this.setVelocityX( expDec(velx, 0, decay, dt, 0.1) )
    this.setVelocityY(expDec(vely, 0, decay, dt, 0.1))

    if (this.stateMachine.getTime() <= 0.25) { return }

    if (this.targetFish === null) {
      this.stateMachine.simpleSwitch(this, 'wander')
      return
    }
    this.chooseToScapeOrChaseFish(this.targetFish)
  }
  hurtEnd(): void {
    this.setTint(0xffffff)
  }

  escapeUpdate(dt:number): void {
    if (this.targetFish === null) {
      this.stateMachine.simpleSwitch(this, 'wander')
      return
    }

    let gotox = this.getX()
    let gotoy = this.getY()
    const offset = 24
    gotox -= this.targetFish.getX() + rnum(-offset, offset)
    gotoy -= this.targetFish.getY() + rnum(-offset, offset)

    const normal = normalize(gotox, gotoy)
    const decayX = rnum(2.5, 4.5)
    const decayY = rnum(2.5, 4.5)
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    const speed = 52.0
    this.setVelocityX( expDec(velx, speed*normal[0], decayX, dt, 0.1) )
    this.setVelocityY( expDec(vely, speed*normal[1], decayY, dt, 0.1) )
  }

  chaseUpdate(dt: number): void {
    let targetX: number //= this.getX()
    let targetY: number //= this.getY()

    if (this.targetFish !== null) { //Le da prioridad a los pescados antes que la comida, pero solo si todavia quiere comer pescado.
      targetX = this.targetFish.getX()
      targetY = this.targetFish.getY()

      if (this.justTicked && (this.tickCount % 44 == 0)) {
        this.targetFish.onTargetedByFish(this)
      } //esto seria alrededor de cada 0.7333
    } else if (this.targetFood !== null) {
      targetX = this.targetFood.getX()
      targetY = this.targetFood.getY()
    } else {
      this.stateMachine.simpleSwitch(this, 'wander')
      return
    }

    let gotox = -this.getX()
    let gotoy = -this.getY()
    const offset = 6
    gotox += targetX + rnum(-offset, offset)
    gotoy += targetY + rnum(-offset, offset)

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
    this.timeCount = rnum(-1, 0)
  }
  attackUpdate(dt: number): void {
    if (this.stateMachine.getTime() > 0.9) {
      if (this.targetFish === null) {
        this.stateMachine.simpleSwitch(this, 'wander')
        return
      }
      this.chooseToScapeOrChaseFish(this.targetFish)
      return
    }

    const shakeDy = cos(this.timeCount * 36) * 48 * dt
    this.setY(this.y + shakeDy)

    const decay = rnum(5, 20)
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    this.setVelocityX( expDec(velx, 0, decay, dt) )
    this.setVelocityY(expDec(vely, 0, decay, dt))
  }

  evolveStart(): void {
    this.lossHungerPerSecond = 0.0
    this.healPercentFromFullHungerPerSecond = 0.0
    this.defense = 0.0
    this.timer.clear()
    this.setVelocity(0, 0)
  }
  evolveUpdate(dt: number): void {
    const maxTime = 1.333
    const percent = invLerp(0, maxTime, this.stateMachine.getTime())

    this.setScale(1 + percent*0.5)
    this.hurtShakingAngle = percent * 28 //Esta es ua variable relacionado con el daño, pero la reutilizamos por el efecto de agitacion.
    this.setBirghtness(lerp(0.5, 3.0, percent))

    if (percent >= 1.0) {
      this.doEvolution()
    }
  }

  override thisupdate(dt: number): void {
    this.outlineFx.setActive(false)
    this.handleAnimationAngles(dt)
    this.doSwimmingWavingAnimation(dt)

    this.clampHorizontally(5)
    //El clampeo vertical solo se aplica si no esta spawneando.
    if (!this.stateMachine.isOn('spawn')) {
      this.clampVertically(45)
    } //Esto es especificamente asi para que el pescado, al spawnear, baje desde la interfaz y parezca que cayo desde arriba.

    if (!this.targetFood?.active) {this.targetFood = null}
    if (!this.targetFish?.active) {this.targetFish = null}

    const hungerLoss = this.lossHungerPerSecond * this.scene.tankData.getExtraHungerLossPercentFromContamination()
    this.hunger = clamp(this.hunger - abs(hungerLoss * dt), 0, 1)
    if (this.hunger > 0.666666) {
      this.life = clamp(this.life + this.healPercentFromFullHungerPerSecond*dt, 0, this.initLife)
    }

    if (!this.nextEvolutionClass) {return}
    this.evolutionTimeCount += dt
    if (this.evolutionTimeCount >= this.evolutionMaxTime) {
      this.stateMachine.simpleSwitch(this, 'evolve')
    }
  }
}
