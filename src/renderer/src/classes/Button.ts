import Phaser from 'phaser'

export class Button extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void) {
    super(scene, x, y, label, {
      fontSize: '16px',
      backgroundColor: '#333',
      padding: { x: 16, y: 8 }
    })
    scene.add.existing(this)
    this.setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.on('pointerover', () => this.setStyle({ backgroundColor: '#555' }))
    this.on('pointerout', () => this.setStyle({ backgroundColor: '#333' }))
    this.on('pointerdown', onClick)
  }

  show(): this {
    this.setVisible(true)
    this.setInteractive({ useHandCursor: true })
    return this
  }

  hide(): this {
    this.setVisible(false)
    this.disableInteractive()
    return this
  }
}
