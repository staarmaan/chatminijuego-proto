import { Entity } from './Entity';
import { moveTo, fromPloar, angleTo, rpow, expDec, round, normalize, rnum, randbool, randangle } from '../utils'
import { FishFood } from './FishFood';
import { Particle } from './Particle';

const MIN_MOVEMENT_PATTERN_SECONDS = 0.0
const MAX_MOVEMENT_PATTERN_SECONDS = 1.5
const random = Math.random

const textureKeys = [
  'smallFish', 'medFish', 'bigFish'
]

const maxHungerDieTimes = [
  25,
  50,
  75,
]

enum HUNGER_LEVELS { FULL, FISH_FOOD, SMALL_FISH, MED_FISH }
const hungerLevelList = [HUNGER_LEVELS.FULL, HUNGER_LEVELS.FISH_FOOD, HUNGER_LEVELS.SMALL_FISH, HUNGER_LEVELS.MED_FISH]

const hungerTimes = [
  [2.0, 14.0],
  [2.0, 2.0, 20.0],
  [10.0, 24.0, 25.0, 40.0],
]
const fishHungerTimeRegain = [
  [12.5],
  [7.5, 17.5],
  [5.0, 12.5, 25.0],
]
const hungerTickFrames = [
  [0, 10],
  [0, 20, 10],
  [0, 30, 20, 10],
]


enum FISH_STATES {
  WANDER,
  CHASE_FOOD,
  CHASE_FISH,
  SCAPE,
  DEAD_HUNGER
}

export class Fish extends Entity {
  public readonly fishType: number //El tipo define el tamaño. Deberia llamarlo fishScale.
  public readonly fishSubtype: number //Define solo la aperiencia (por ahora)
  public readonly fishScale: number
  public targetVely: number
  public targetVelx: number
  public movementPatternTimer: number

  private hungerLevel = 0
  private hungerTimer = 0.0
  private gotFlipedDir: number = 0
  private flipAngle: number = 0.0
  private turnAroundTimer: number = 0.0
  private scanTimer: number = 0.0
  private targetEatFood: FishFood | Fish | null = null //Puede ser FishFood o un Fish.
  private state: FISH_STATES = FISH_STATES.WANDER

  constructor(scene: Phaser.Scene, x: number, y: number, fishType: number, fishSubtype: number) {
    const fishTextureKey = textureKeys[fishType]
    super(scene, x, y, fishTextureKey)

    this.scanTimer = (this.id % 127) * 0.01

    const baseDepth = 3
    const typeDepth = 2 - fishType
    this.setDepth(baseDepth + typeDepth)

    this.targetVelx = random()*2 - 1
    this.targetVely = random()*2 - 1
    this.movementPatternTimer = MIN_MOVEMENT_PATTERN_SECONDS + (random() * MAX_MOVEMENT_PATTERN_SECONDS)

    this.fishType = fishType
    this.fishSubtype = fishSubtype
    this.play(`${fishTextureKey}${fishSubtype}`, true)

    this.fishScale = 1
    const size = 5 * (1+fishType)
    this.setCircle(size)
    this.body?.setOffset(size,size)
  }

  private eatFood(food: Fish | FishFood): void {
    const isFish = food instanceof Fish
    if (isFish) {
      if (this.fishType <= food.fishType) { return } //Un pez solo se come a otro si es mayor en tama;o (indicado por fishType)
    }
    food.destroy()

    this.scanTimer = 0.0

    const regainIndex = (isFish && food.fishType) || 0
    const remainder = this.hungerTimer - fishHungerTimeRegain[this.fishType][regainIndex]
    if (remainder >= 0) {
      this.hungerTimer = remainder
      return
    }

    this.hungerLevel = Math.max(0, this.hungerLevel - 1)
    if (this.hungerLevel === HUNGER_LEVELS.FULL) {
      //Si llega a FULL, simplemente resetear el timer a 0.
      this.hungerTimer = 0.0
      return
    }
    const times = hungerTimes[this.fishType]
    this.hungerTimer = Math.max(0.0, times[this.hungerLevel] - Math.abs(remainder))
  }

  scapeFromBigFishes(range: number): void {
    if (!this.targetEatFish?.active) { this.targetEatFish = null }
    if (this.targetEatFish) { return }

    const rangeSq = range * range
    this.scene.children.each((other) => {
      if (other instanceof Fish) {
        if (!other.active) { return }
        if (this.scale === other.scale) {return}
        const dx = other.x - this.x
        const dy = other.y - this.y
        if ((dx*dx + dy*dy) > rangeSq) { return }

        let gotoAngle = random()
        const samePos = other.x == this.x && other.y == this.y

        if (other.fishType > this.fishType) { //escape from bigger fish
          if (!samePos) {
            const angleOffset = (2*gotoAngle - 1) * 0.22
            gotoAngle = angleTo(other.x, other.y, this.x, this.y) + angleOffset
          }
          this.anims.timeScale = 3.0
          this.targetEatFish = null
        } else {                                //go eat smaller fish
          if (!samePos) {
            gotoAngle = angleTo(this.x, this.y, other.x, other.y)
          }
          this.targetEatFish = other
          this.anims.timeScale = 1.5
          //this.currentSpeed = 0.0
        }

        //this.currentAngle = gotoAngle
        //this.targetAngle = gotoAngle
        //this.targetSpeed = 1.0
      }
    })
    /*
    return targets.filter((t) => {
      if (!t.active) return false
      const dx = t.x - this.x
      const dy = t.y - this.y
      return dx * dx + dy * dy <= rangeSq
    })*/
  }

  private scanFood(): void {
    if (this.targetEatFood !== null && !this.targetEatFood.active) {
      this.targetEatFood = null
    }

    const range = 240.0
    const rangeSq = range * range
    const wantsFish = this.hungerLevel > HUNGER_LEVELS.FISH_FOOD

    let closestFood: FishFood | null = null
    let closestFoodSq = rangeSq
    let closestFish: Fish | null = null
    let closestFishSq = rangeSq

    this.scene.children.each((obj) => {
      if (!obj.active || obj === this) { return }

      const isFood = obj instanceof FishFood
      const isFish = obj instanceof Fish
      if (!isFood && !isFish) { return }

      const dx = obj.x - this.x
      const dy = obj.y - this.y
      const distanceSquared = (dx * dx) + (dy * dy)

      if (isFood && distanceSquared <= closestFoodSq) {
        closestFoodSq = distanceSquared
        closestFood = obj
      } else if (isFish && wantsFish && distanceSquared <= closestFishSq) {
        closestFishSq = distanceSquared
        closestFish = obj
      }
    })

    // Los pescados tienen mas prioridad que el FishFood. Si un pescado que no es peque;o quiere comer peces pero no hay, puede optar por comer FishFood.
    this.targetEatFood = closestFish ?? closestFood
  }

  private handleLooking(dt: number): void {
    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    this.turnAroundTimer += dt
    if (velx != 0 && this.turnAroundTimer > 0.0) {
      this.turnAroundTimer = -Math.random() * 0.4
      let angle = 45.0
      if (vely < 0) { angle = -angle }

      if (velx > 0) {
        this.setFlipX(false)
        if (this.gotFlipedDir != 1) {
          this.gotFlipedDir = 1
          this.flipAngle = angle
        }
      } else {
        this.setFlipX(true)
        if (this.gotFlipedDir != -1) {
          this.gotFlipedDir = -1
          this.flipAngle = -angle
        }
      }
    }
    this.setAngle(this.flipAngle)
    this.flipAngle = expDec(this.flipAngle, 0.0, 12.5, dt, 0.0001)

    const halfSpeed = 12.0
    const len2 = velx*velx + vely*vely
    if (len2 > (halfSpeed*halfSpeed)) {
      this.anims.timeScale = 1.0
    } else {
      this.anims.timeScale = 0.333
    }
  }

  private tryBlinkFromHunger(): void {
    const tick = round(this.age*60)

    if (this.state === FISH_STATES.DEAD_HUNGER) {
      const darkColor = 0xadadad
      this.setTint(darkColor)
      return
    }
    this.clearTint()
    if (this.hungerLevel <= 0) {
      return
    }

    const frameThingy = hungerTickFrames[this.fishType][this.hungerLevel]
    if (tick % frameThingy == 0) {
      const redishColor = 0xff0000
      this.setTint(redishColor)
    }
  }

  private dieOfHunger(): boolean {
    if (this.state === FISH_STATES.DEAD_HUNGER) {return false}
    //if (this.hungerTimer <= maxHungerDieTimes[this.fishType]) { return false }
    this.state = FISH_STATES.DEAD_HUNGER
    this.targetVelx = 0.0
    this.targetVely = 0.1
    this.flipAngle = 0.0
    return true
  }

  private wanderState(dt: number): void {
    this.handleLooking(dt)

    //Solo buscar comida cuando no tenga ninguna fijada.
    if (this.targetEatFood !== null) {
      this.targetVelx = 0.0
      this.targetVely = 0.0
      this.state = FISH_STATES.CHASE_FOOD
      return
    } else {
      if (this.hungerLevel > HUNGER_LEVELS.FULL) {
        //Lo hago de esta forma especifica para que varios peces no escanen a todas las entidades al mismo tiempo.
        this.scanTimer -= dt
        if (this.scanTimer <= 0) {
          this.scanTimer = 0.666666
          this.scanFood()
        }
      }
    }

    this.movementPatternTimer += dt

    //Cambiar movimiento despues de cierto tiempo.
    if (this.movementPatternTimer > MAX_MOVEMENT_PATTERN_SECONDS) {
      this.movementPatternTimer = MIN_MOVEMENT_PATTERN_SECONDS + (random() * MAX_MOVEMENT_PATTERN_SECONDS)

      const mode = round(random()*2)
      switch (mode) {
        case 0:
          this.targetVelx = random()*2 - 1
          break;
        case 1:
          this.targetVely = random()*2 - 1
          break;
        case 2:
          this.targetVelx = random()*2 - 1
          this.targetVely = random()*2 - 1
          break;
      }
    }

    const speed = 25.0
    const accel = speed
    this.setVelocityX(moveTo(this.body!.velocity.x, this.targetVelx * speed, dt * accel))
    this.setVelocityY(moveTo(this.body!.velocity.y, this.targetVely * speed, dt * accel))

    //Si esta cerca de los margenes de la pantalla, tratar de regresar al centro.
    const outPixelsX = 24 + 8 * this.fishType
    const outPixelsY = 40 + 24 + 8 * this.fishType
    if (this.isOffScreen(outPixelsX, outPixelsY)) {
      const { width, height } = this.scene.scale
      const angleOffset = (2*random() - 1) * 1.001
      const gotoAngle = angleTo(this.x, this.y, width * 0.5, height * 0.5) + angleOffset
      const vel = fromPloar(gotoAngle, rpow(1, 0, 8))
      this.targetVelx = vel[0]
      this.targetVely = vel[1]

      this.movementPatternTimer = 0
    }
  }

  private chaseFoodState(dt: number): void {
    this.handleLooking(dt)

    this.scanTimer -= dt
    if (this.scanTimer <= 0) {
      this.scanTimer = 0.333
      this.scanFood()
    }

    let gotox = -this.body!.position.x
    let gotoy = -this.body!.position.y

    if (this.targetEatFood !== null) {
      const isDeadFish = (this.targetEatFood instanceof Fish) && (this.targetEatFood.state === FISH_STATES.DEAD_HUNGER)
      if (!this.targetEatFood.active || this.hungerLevel === HUNGER_LEVELS.FULL || isDeadFish) {
        this.targetEatFood = null
        this.state = FISH_STATES.WANDER
        return
      }
      const offset = 8.0
      gotox += this.targetEatFood.body!.position.x + rnum(-offset, offset)
      gotoy += this.targetEatFood.body!.position.y + rnum(-offset, offset)
    }
    else
    {
      this.state = FISH_STATES.WANDER
      return
    }

    const normal = normalize(gotox, gotoy)
    const decayX = rnum(0.5, 3.5)
    const decayY = rnum(0.5, 3.5)
    this.targetVelx = expDec(this.targetVelx, normal[0], decayX, dt, 0.000001)
    this.targetVely = expDec(this.targetVely, normal[1], decayY, dt, 0.000001)
    const speedX = 52.0
    const speedY = 52.0
    this.setVelocity(this.targetVelx*speedX, this.targetVely*speedY)
  }

  private deadState(dt: number): void {
    this.setDepth(0.01)

    this.setVelocityX(0)

    const multi = (this.targetVely > 3.0) && 0.5 || 1.0
    this.targetVely += dt*multi
    this.setVelocityY(this.targetVely * 4.0)

    this.anims.timeScale = 0.0

    const dir = ((this.id % 2 == 0) && 1) || -1
    const rotationSpeed = rnum(2.0, 6.0)
    this.flipAngle += this.targetVely * dt * dir * rotationSpeed
    this.setAngle(this.flipAngle)

    const { height} = this.scene.scale
    if (this.body!.position.y > height) {
      this.destroy()
    }
  }

  override thisupdate(dt: number): void {
    if (this.state !== FISH_STATES.DEAD_HUNGER) {
      const multi = (randbool() && rpow(1.0, 0.75, 3)) || rpow(1.0, 1.25, 3.5)
      this.hungerTimer += dt * multi
      const times = hungerTimes[this.fishType]
      if (this.hungerTimer > times[this.hungerLevel]) {
        this.hungerLevel++
        this.hungerTimer = 0
        if (this.hungerLevel > (times.length - 1)) {
          this.dieOfHunger()
        }
      }
      this.tryBlinkFromHunger()
    }

    switch (this.state) {
      case FISH_STATES.WANDER:
        this.wanderState(dt)
        break
      case FISH_STATES.CHASE_FOOD:
        this.chaseFoodState(dt)
        break
      case FISH_STATES.SCAPE: break
      case FISH_STATES.DEAD_HUNGER:
        this.deadState(dt)
        break
    }
  }

  private doFishEatenBloodDust(x = this.getX(), y = this.getY()): void {
    for (let i = 0; i < 6; i++){
      const offset = fromPloar(randangle(), rpow(0.01, 12.0, 1.25))
      const timeScale = rnum(10.0, 20.0)
      const scale = rpow(0.333, 1.0, 1.5)
      const parti = new Particle(this.scene, x+offset[0], y+offset[1], 'genericSmoke', 'genericSmokeDef', timeScale, scale, scale)

      const vel = fromPloar(randangle(), rpow(0.01, 52.0, 1.25))

      this.setVelocity(vel[0], vel[1])
      parti.setTint(0xff0000)
    }
  }

  onTouchFish(fish: Fish): void {
    if (this.state === FISH_STATES.DEAD_HUNGER) { return } //No tocar a un pescado muerto de hambre.
    if (fish.state === FISH_STATES.DEAD_HUNGER) { return } //No tocar a un pescado muerto de hambre.

    //Los pescados se empujan entre si, solo si el pescado tocado es del mismo tama;o (fishType) o si no es el pez fijado para comer o es la preza de otro pez.
    let allowPushing = false
    if (this.fishType === fish.fishType) {
      allowPushing = true
    } else {
        if ((fish !== this.targetEatFood) && (this !== fish.targetEatFood)) {allowPushing = true}
    }
    if (allowPushing) {
      let angle = angleTo(this.getX(), this.getY(), fish.getX(), fish.getY())
      if (angle === 0) { angle = randangle() }
      const pushVel = 0.5 / (this.fishType + 1)
      const vec = fromPloar(angle, pushVel)

      this.setPosition(
        this.getX() - vec[0],
        this.getY() - vec[1]
      )
      return
    }

    if (this.state !== FISH_STATES.CHASE_FOOD) {return} //Tiene que estar en estado de persecucion.
    if (this.targetEatFood === null) {return} //No comer si no tiene fijado a nada.
    if (fish === this) {return} //Si por alguna razon, se toca asi mismo, no comer.
    if (this.targetEatFood !== fish) {return} //No comer al Fish que no tenga fijado.
    if (!this.targetEatFood.active) { return } //Si es el fijado correcto, pero no esta activo, no comer.
    //if (!(fish instanceof Fish)) { return } //Tiene que ser Fish.

    this.eatFood(fish) //En esta funcion se destruye el pescado comido.
    this.doFishEatenBloodDust(fish.getX(), fish.getY())
  }

  onTouchFishFood(food: FishFood): void {
    if (this.state !== FISH_STATES.CHASE_FOOD) {return} //Tiene que estar en estado de persecucion.
    if (this.targetEatFood === null) {return} //No comer si no tiene fijado a nada.
    if (this.targetEatFood !== food) {return} //No comer al FishFood que no tenga fijado.
    if (!this.targetEatFood.active) { return } //Si es el fijado correcto, pero no esta activo, no comer.
    //if (!(food instanceof FishFood)) { return } //Tiene que ser FishFood.

    this.eatFood(food) //En esta funcion se destruye el pescado comido.
  }
}
