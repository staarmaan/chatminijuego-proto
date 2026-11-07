import { Entity } from './Entity';
import { moveTo, fromPloar, angleTo, rpow, expDec, round, normalize, rnum } from '../utils'
import { FishFood } from './FishFood';

const MIN_MOVEMENT_PATTERN_SECONDS = 0.0
const MAX_MOVEMENT_PATTERN_SECONDS = 1.5
const random = Math.random

const textureKeys = [
  'smallFish', 'medFish', 'bigFish'
]

enum FISH_STATES {
  WANDER,
  CHASE_FOOD,
  SCAPE
}

export class Fish extends Entity {
  public readonly fishType: number //El tipo define el tamaño.
  public readonly fishSubtype: number //Define solo la aperiencia (por ahora)
  public readonly fishScale: number
  public targetVely: number
  public targetVelx: number
  public movementPatternTimer: number


  private gotFlipedDir: number = 0
  private flipAngle: number = 0.0
  private turnAroundTimer: number = 0.0
  private targetEatFish: Fish | null = null
  private targetEatFood: FishFood | null = null
  private scanFishTimer: number = 0.0
  private state: FISH_STATES = FISH_STATES.WANDER

  constructor(scene: Phaser.Scene, x: number, y: number, fishType: number, fishSubtype: number) {
    const fishTextureKey = textureKeys[fishType]
    super(scene, x, y, fishTextureKey)

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
    const size = 4 * (1+fishType)
    this.setCircle(size)
    this.body?.setOffset(size,size)
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

  //TODO: hacer en metodo de esto que funcione con cualquier entidad (o posicion?) para evitar copypaste.
  scanFood(): void {
    if (this.targetEatFood !== null) {
      if (!this.targetEatFood.active) { this.targetEatFood = null } else { return }
    }

    const range = 120.0
    const rangeSq = range * range
    this.scene.children.each((food) => {
      if (!food.active) { return }
      if (!(food instanceof FishFood)) { return }

      const dx = food.x - this.x
      const dy = food.y - this.y
      if ((dx * dx + dy * dy) > rangeSq) { return }

      this.targetEatFood = food
    })
  }

  private handleAppearance(dt: number): void {
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

  private wanderState(dt: number): void {
    if (this.targetEatFood !== null) {
      this.state = FISH_STATES.CHASE_FOOD
      return
    } else {
      const checkInt = round(this.age * 60 + this.id)
      if (checkInt % 123 === 0) {
        this.scanFood()
      }
    }

    this.movementPatternTimer += dt

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

    /*
    this.scanFishTimer += dt
    if (this.scanFishTimer > 0.0) {
      //this.scapeFromBigFishes(100.0)
      this.scanFishTimer = Math.random()
    }
    */

    const speed = 25.0
    const accel = speed
    this.setVelocityX(moveTo(this.body!.velocity.x, this.targetVelx * speed, dt * accel))
    this.setVelocityY(moveTo(this.body!.velocity.y, this.targetVely * speed, dt * accel))

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
    let gotox = -this.body!.position.x
    let gotoy = -this.body!.position.y

    if (this.targetEatFood !== null) {
      if (this.targetEatFood.active === false) {
        this.targetEatFood = null
        this.state = FISH_STATES.WANDER
        return
      }
      const offset = 32.0
      gotox += this.targetEatFood.body!.position.x + rnum(-offset, offset)
      gotoy += this.targetEatFood.body!.position.y + rnum(-offset, offset)
    }

    const normal = normalize(gotox, gotoy)
    const decayX = rnum(0.1, 1)
    const decayY = rnum(0.1, 1)
    this.targetVelx = expDec(this.targetVelx, normal[0], decayX, dt, 0.000001)
    this.targetVely = expDec(this.targetVely, normal[1], decayY, dt, 0.000001)
    const speedX = 48.0
    const speedY = 48.0
    this.setVelocity(this.targetVelx*speedX, this.targetVely*speedY)
  }

  override thisupdate(dt: number): void {
    switch (this.state) {
      case FISH_STATES.WANDER:
        this.wanderState(dt)
        break
      case FISH_STATES.CHASE_FOOD:
        this.chaseFoodState(dt)
        break
      case FISH_STATES.SCAPE: break
    }

    this.handleAppearance(dt)
  }

  onTouch(other: Entity): void {
    if (this.targetEatFish === null) { return }
    if (other instanceof Fish) {
      if (other === this.targetEatFish && other !== this) {
        other.destroy()
      }
    }
  }

  onTouchFishFood(food: FishFood): void {

  }
}
