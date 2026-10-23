import Phaser from 'phaser'

let nextId = 0

export class Entity extends Phaser.Physics.Arcade.Sprite {
  public readonly id: number

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

  onTouch(_other: Entity): void {
    // default: do nothing; subclasses override
  }

  isOffScreen(offsetX = 0, offsetY = 0): boolean {
    const { width, height } = this.scene.scale
    return (
      (this.x - offsetX) + this.displayWidth * 0.5 < 0 || //out leftwards
      (this.x + offsetX) - this.displayWidth * 0.5 > width || //out rightwards
      (this.y - offsetY) + this.displayHeight * 0.5 < 0 ||
      (this.y + offsetY) - this.displayHeight * 0.5 > height
    )
  }
}
