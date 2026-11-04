import { Entity } from './Entity';
import { moveTo, fromPloar, angleTo, rpow, expDec, round } from '../utils'

const random = Math.random

const MAX_LIFETIME = 10

export class BubbleParticle extends Entity {
  public lifeTime: number = 0;
  public vely: number = 0;
  public age: number = 0;
  public sineVelX: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'bubbleParticle')
    this.play('bubbleParticleDef')

    const { width, height } = this.scene.scale
    this.setPosition(random()*width, random()*height)

    this.setDepth(0.9)

    this.anims.setProgress(random())

    this.sineVelX += random()*3.1416

    this.lifeTime = 3 + random() * MAX_LIFETIME
    this.vely = 0.25 + random()
  }

  override update(_time: number, delta: number): void {
    const dt = delta * 0.001

    this.age += dt

    this.sineVelX += random()*0.05

    this.lifeTime -= dt

    const speedX = Math.sin(this.sineVelX) * 8.0
    const speedY = 24.0
    this.setVelocityX(speedX)
    this.setVelocityY(this.vely * -speedY)

    this.anims.timeScale = this.vely * rpow(1.0, 0.5, 5)
    if (this.lifeTime > 0) {
      this.anims.setProgress(0)
    }

    if (this.anims.getProgress() == 1.0 || this.body!.position.y < 0.0) {
      this.vely = 0.25 + random()

      this.lifeTime = 3 + random() * MAX_LIFETIME
      this.anims.setProgress(0)

      this.sineVelX += random()*3.1416

      const { width, height } = this.scene.scale
      this.setPosition(random()*width, height)
    }
  }

}
