import { MainScene } from "../main";
import { Entity } from "./Entity";

export class Particle extends Entity {
  public accelX = 0
  public accelY = 0

  constructor(scene: MainScene, x: number, y: number, anim: string, animKey: string, timeScale = 1.0, sx: number = 1.0, sy: number = 1.0, degrees: number = 0.0, tintColor = 0xffffff) {
    super(scene, x, y, anim)
    scene.particles.add(this)

    this.play(animKey)

    if (this.body) {
      this.body.checkCollision.none = true
      this.body.setCircle(0.00001)
    }

    this.setDepth(0.01)

    this.anims.setProgress(0.0)
    this.anims.timeScale = timeScale

    this.setTint(tintColor)

    this.setScale(sx, sy)
    this.setAngle(degrees)
  }

  override thisupdate(dt: number): void {
    this.setVelocityX(this.body!.velocity.x + this.accelX*dt)
    this.setVelocityY(this.body!.velocity.y + this.accelY*dt)

    if (this.anims.getProgress() < 1.0) { return }
    this.destroy()
  }
}
