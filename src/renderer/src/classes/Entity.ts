import Phaser from 'phaser'

let nextId = 0

export class Entity extends Phaser.Physics.Arcade.Sprite {
  public readonly id: number
  public age: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: number) {
    super(scene, x, y, texture, frame)
    scene.physics.add.existing(this)

    this.id = nextId
    nextId++

    // Both calls are required when you create the sprite yourself
    scene.add.existing(this)             // adds it to the display list
    scene.physics.add.existing(this) // gives it an Arcade body

    this.setCollideWorldBounds(true)
  }

  override update(_time: number, delta: number): void {
    const dt = delta * 0.001
    this.thisupdate(dt)
    this.age += dt
  }

  thisupdate(dt: number): void {}

  onTouch(_other: Entity): void {
    // default: do nothing; subclasses override
  }

  getX(): number { return this.getCenter().x }
  getY(): number { return this.getCenter().y }

  isOffScreen(offsetX = 0, offsetY = 0): boolean {
    const { width, height } = this.scene.scale
    return (
      (this.x - offsetX) + this.displayWidth * 0.5 < 0 || //out leftwards
      (this.x + offsetX) - this.displayWidth * 0.5 > width || //out rightwards
      (this.y - offsetY) + this.displayHeight * 0.5 < 0 ||
      (this.y + offsetY) - this.displayHeight * 0.5 > (height)
    )
  }
}
