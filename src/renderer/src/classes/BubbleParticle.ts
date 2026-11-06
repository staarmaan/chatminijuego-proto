import { Entity } from './Entity';
import { moveTo, fromPloar, angleTo, rpow, expDec, round, randbool } from '../utils'

const random = Math.random

const MAX_LIFETIME = 14.25

export class BubbleParticle extends Entity {
  public lifeTime: number = 0;
  public vely: number = 0;
  public sineVelX: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 999, 'bubbleParticle')
    this.play('bubbleParticleDef')

    if (this.body) {
      this.body.checkCollision.none = true
      this.body.setCircle(0.00001)
    }

    const { width, height } = this.scene.scale
    const x = random()*width
    const y = random() * height
    this.setPosition(x,y)

    this.setDepth( randbool() && 0.1 || 9 )

    this.anims.setProgress(0)
    this.sineVelX += random()*3.1416
    this.lifeTime = 3 + random() * MAX_LIFETIME * 0.425
    this.vely = 0.25 + random()
  }

  override thisupdate(dt: number): void {
    this.sineVelX += random()*0.05

    this.lifeTime -= dt

    const speedX = Math.sin(this.sineVelX) * 8.0
    const speedY = 12 + random() * 32
    this.setVelocityX(speedX)
    this.setVelocityY(this.vely * -speedY)

    if (this.lifeTime > 0) {
      this.anims.timeScale = this.vely * rpow(1.0, 0.1, 5)
      this.anims.setProgress(0)
    }

    if (this.anims.getProgress() >= 1.0 || this.body!.position.y < 0.0) {
      this.vely = 0.25 + random()

      this.lifeTime = 3 + random() * MAX_LIFETIME
      this.anims.setProgress(0)

      this.sineVelX += random()*3.1416

      const { width, height } = this.scene.scale
      this.setPosition(random()*width, height)
    }
  }

}
