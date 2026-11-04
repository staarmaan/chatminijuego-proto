import { Entity } from './Entity';
import { moveTo, fromPloar, angleTo, rpow, expDec, round } from '../utils'

const MIN_MOVEMENT_PATTERN_SECONDS = 0.0
const MAX_MOVEMENT_PATTERN_SECONDS = 1.5
const random = Math.random

const textureKeys = [
  'smallFish', 'medFish', 'bigFish'
]

export class Fish extends Entity {
  public readonly fishType: number //Bigger type also equals a bigger fish.
  public readonly fishSubtype: number
  public readonly fishScale: number
  public targetVely: number
  public targetVelx: number
  public movementPatternTimer: number

  private gotFlipedDir: number = 0
  private flipAngle: number = 0.0
  private turnAroundTimer: number = 0.0
  private targetEatFish: Fish | null = null
  private scanFishTimer: number = 0.0

  constructor(scene: Phaser.Scene, x: number, y: number, fishType: number, fishSubtype: number) {
    const fishTextureKey = textureKeys[fishType]

    super(scene, x, y, fishTextureKey)

    this.targetVelx = random()*2 - 1
    this.targetVely = random()*2 - 1
    this.movementPatternTimer = MIN_MOVEMENT_PATTERN_SECONDS + (random() * MAX_MOVEMENT_PATTERN_SECONDS)

    this.fishType = fishType
    this.fishSubtype = fishSubtype
    this.play(`${fishTextureKey}${fishSubtype}`, true)

    this.fishScale = 1
    this.setCircle(4)
    //this.body?.setOffset(11, 12)
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

  override update(_time: number, delta: number): void {
    const dt = delta * 0.001

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

    this.scanFishTimer += dt
    if (this.scanFishTimer > 0.0) {
      //this.scapeFromBigFishes(100.0)
      this.scanFishTimer = Math.random()
    }

    const speed = 32.0
    const accel = speed
    this.setVelocityX(moveTo(this.body!.velocity.x, this.targetVelx * speed, dt * accel))
    this.setVelocityY(moveTo(this.body!.velocity.y, this.targetVely * speed, dt * accel))

    const outPixels = 24 + 8 * this.fishType
    if (this.isOffScreen(outPixels, outPixels)) {
      const { width, height } = this.scene.scale
      const angleOffset = (2*random() - 1) * 0.8
      const gotoAngle = angleTo(this.x, this.y, width * 0.5, height * 0.5) + angleOffset
      const vel = fromPloar(gotoAngle, rpow(1, 0, 4))
      this.targetVelx = vel[0]
      this.targetVely = vel[1]

      this.movementPatternTimer = 0
    }

    const velx = this.body!.velocity.x
    const vely = this.body!.velocity.y
    this.turnAroundTimer += dt
    if (velx != 0 && this.turnAroundTimer > 0.0) {
      this.turnAroundTimer = -Math.random() * 0.4
      let angle = 35.0
      if (vely < 0) { angle = -35.0 }

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
    this.flipAngle = expDec(this.flipAngle, 0.0, 13.0, dt, 0.0001)

    const halfSpeed = speed * 0.5
    const len2 = velx*velx + vely*vely
    if (len2 > (halfSpeed*halfSpeed)) {
      this.anims.timeScale = 1.0
    } else {
      this.anims.timeScale = 0.333
    }
  }

  onTouch(other: Entity): void {
    if (this.targetEatFish === null) { return }
    if (other instanceof Fish) {
      if (other === this.targetEatFish && other !== this) {
        other.destroy()
      }
    }
  }
}
