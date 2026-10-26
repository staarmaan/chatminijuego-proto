import { Entity } from './Entity';
import { moveTo, fromPloar, angleTo, rpow, expDec, round } from '../utils'
import EnumFishTypes from './EnumFishTypes';

const textureKeys = {
  [EnumFishTypes.BASA]: 'fish-basa',
  [EnumFishTypes.BLUETANG]: 'fish-bluetang',
  [EnumFishTypes.CLOWNFISH]: 'fish-clownfish',
  [EnumFishTypes.FIGHTERFISH]: 'fish-fighter',
  [EnumFishTypes.POMFRET]: 'fish-pomfret',
  [EnumFishTypes.SALMON]: 'fish-salmon',
  [EnumFishTypes.TAUTOG]: 'fish-tautog',
}

const MIN_MOVEMENT_PATTERN_SECONDS = 2.22
const MAX_MOVEMENT_PATTERN_SECONDS = 5.55555 + MIN_MOVEMENT_PATTERN_SECONDS
const ACCELERATION = 0.666666
const INV_PI = 1/Math.PI
const random = Math.random

export class Fish extends Entity {
  public readonly fishType: EnumFishTypes
  public readonly fishScale: number
  public targetAngle: number
  public targetSpeed: number
  public currentSpeed: number
  public currentAngle: number
  public movementPatternTimer: number

  private gotFlipedDir: number = 0
  private flipAngle: number = 0.0
  private turnAroundTimer: number = 0.0

  constructor(scene: Phaser.Scene, x: number, y: number, fishType: EnumFishTypes, fishScale = 0) {
    const fishTextureKey = textureKeys[fishType]

    super(scene, x, y, fishTextureKey)

    this.targetAngle = 2*random() - 1
    this.targetSpeed = random()
    this.currentAngle = random()
    this.currentSpeed = random()
    this.movementPatternTimer = MIN_MOVEMENT_PATTERN_SECONDS + (random() * MAX_MOVEMENT_PATTERN_SECONDS)

    this.fishType = fishType

    this.play(`${fishTextureKey}-default`, true)

    this.fishScale = round(fishScale)
    if (this.fishScale === 0) { this.fishScale = round( rpow(1, 5, 1.6) ) }

    this.setScale(this.fishScale)
    this.setCircle(10)
    this.body?.setOffset(11, 12)
  }

  override update(_time: number, delta: number): void {
    const dt = delta * 0.001

    this.movementPatternTimer += dt

    if (this.movementPatternTimer > MAX_MOVEMENT_PATTERN_SECONDS) {
      this.movementPatternTimer = MIN_MOVEMENT_PATTERN_SECONDS + (random() * MAX_MOVEMENT_PATTERN_SECONDS)
      //this.movementPatternTimer = -(random() * MAX_MOVEMENT_PATTERN_SECONDS)
      this.targetAngle = 2*random() - 1
      this.targetSpeed = 0.05 + 0.95 * random()
    }
    this.currentAngle = moveTo(this.currentAngle, this.targetAngle, ACCELERATION*dt)
    this.currentSpeed = moveTo(this.currentSpeed, this.targetSpeed, ACCELERATION * dt)

    const outPixels = 50 + 8 * this.fishScale
    if (this.isOffScreen(outPixels, outPixels)) {
      const { width, height } = this.scene.scale
      const angleOffset = (2*random() - 1) * 0.22
      const gotoAngle = angleTo(this.x, this.y, width * 0.5, height * 0.5) * INV_PI + angleOffset

      this.targetAngle = gotoAngle
      this.movementPatternTimer = 0

      const evenmoreOutPixels = -6 - 8 * this.fishScale
      if (this.isOffScreen(evenmoreOutPixels, evenmoreOutPixels)) { this.currentAngle = gotoAngle }

      //this.x = width * 0.5
      //this.y = height * 0.5
    }

    const SPEED = 50.0 //Equals to 3 pixels per frame.
    const vel = fromPloar(this.currentAngle * Math.PI, this.currentSpeed * SPEED)
    this.setVelocity(vel[0], vel[1])

    const velx = this.body!.velocity.x
    this.turnAroundTimer += dt
    if (velx != 0 && this.turnAroundTimer > 0.0) {
      this.turnAroundTimer = -Math.random() * 0.4
      const angle = 35.5
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
  }

  onTouch(other: Entity): void {
    if (other instanceof Fish) {
      if (other.fishScale > this.fishScale) {
        let gotoAngle: number

        if (other.x == this.x && other.y == this.y) {
          gotoAngle = random()
        } else {
          const angleOffset = (2*random() - 1) * 0.22
          gotoAngle = angleTo(other.x, other.y, this.x, this.y) * INV_PI + angleOffset
        }

        this.currentAngle = gotoAngle
        this.targetAngle = gotoAngle
        this.currentSpeed = 1.0
        this.targetSpeed = 1.0
      }
    }
  }
}
