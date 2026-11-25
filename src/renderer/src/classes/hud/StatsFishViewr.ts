import Phaser from 'phaser'
import { MainScene } from '../../main'
import { Fish } from '../entities/Fiish'
import { clamp } from '../../utils'

const FILL_WIDTH = 36
const FILL_HEIGHT = 2
const FILL_OFFSET_X = 9 //Posicion del relleno dentro del statBarVase.
const FILL_OFFSET_Y = 2
const BAR_SPACING_Y = 8
const PICK_SLACK = 4 //Pixeles extra de tolerancia al seleccionar un pez con el mouse.
const USERNAME_MAX_WIDTH = 34 //Ancho disponible abajo a la izquierda, segun el mockup.
const USERNAME_ELLIPSIS = '...'

/*
Muestra las barras de vida y hambre del pez seleccionado al pasar el mouse por encima, en la parte de abajo de la pantalla.
Tambien muestra su nombre abajo a la izquierda. El color del relleno cambia segun el porcentaje: verde > 0.666, amarillo > 0.333, rojo por debajo.
*/
export class StatsFishViewr extends Phaser.GameObjects.Container {
  declare public scene: MainScene

  private fish: Fish | null = null
  private fillers: Phaser.GameObjects.Sprite[] = []
  private usernameText: Phaser.GameObjects.Text
  private onPointerMove: (pointer: Phaser.Input.Pointer) => void

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y)

    this.setDepth(101)

    //Frame 0 del vase = corazon (vida), frame 1 = muslo (hambre).
    for (let i = 0; i < 2; i++) {
      const vase = scene.add.sprite(0, i * BAR_SPACING_Y, 'statBarVase', i).setOrigin(0, 0)
      const filler = scene.add.sprite(FILL_OFFSET_X, i * BAR_SPACING_Y + FILL_OFFSET_Y, 'statBarFiller', 0).setOrigin(0, 0)
      this.fillers.push(filler)
      this.add([vase, filler])
    }

    //Nombre del pez, abajo a la izquierda (absoluto: 12, 311).
    this.usernameText = scene.add.text(-48, 25, '', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#ffffff'
    }).setOrigin(0, 0)
    this.add(this.usernameText)

    scene.add.existing(this)

    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      this.pickFishAt(pointer.x, pointer.y)
    }
    scene.input.on('pointermove', this.onPointerMove)

    this.setVisible(false) //No se muestra hasta que se pase el mouse por encima de un pez.
  }

  override destroy(fromScene?: boolean): void {
    this.scene.input.off('pointermove', this.onPointerMove)
    super.destroy(fromScene)
  }

  setFish(fish: Fish | null): void {
    this.fish = fish
    this.setVisible(fish !== null)
    this.setUsername(fish?.username ?? '')
    this.refresh()
  }

  private setUsername(username: string): void {
    let text = username
    this.usernameText.setText(text)
    if (this.usernameText.width <= USERNAME_MAX_WIDTH) { return }

    //Cortar con puntos suspensivos si el nombre no cabe en el espacio del mockup.
    while (text.length > 0) {
      text = text.slice(0, -1)
      this.usernameText.setText(text + USERNAME_ELLIPSIS)
      if (this.usernameText.width <= USERNAME_MAX_WIDTH) { return }
    }
    this.usernameText.setText('')
  }

  /*
  Busca el pez mas cercano al punto que este dentro de su radio. Si no hay ninguno debajo del mouse, mantiene la seleccion anterior.
  */
  private pickFishAt(x: number, y: number): void {
    let picked: Fish | null = null
    let pickedDistanceSquared = Infinity

    this.scene.fiishes.children.forEach((entity) => {
      if (!(entity instanceof Fish) || !entity.active) { return }

      const dx = entity.getX() - x
      const dy = entity.getY() - y
      const distanceSquared = (dx * dx) + (dy * dy)

      const radius = (entity.body as Phaser.Physics.Arcade.Body).halfWidth + PICK_SLACK
      if (distanceSquared > radius * radius) { return }

      if (distanceSquared < pickedDistanceSquared) {
        picked = entity
        pickedDistanceSquared = distanceSquared
      }
    })

    if (picked !== null) { this.setFish(picked) }
  }

  //Llamado cada frame desde MainScene.update.
  refresh(): void {
    if (this.fish === null) { return }
    if (!this.fish.active) { //El pez murio.
      this.setFish(null)
      return
    }

    this.fish.outlineFx.setActive(true)

    const percents = [
      clamp(this.fish.life / this.fish.initLife, 0, 1),
      clamp(this.fish.hunger, 0, 1)
    ]

    for (let i = 0; i < this.fillers.length; i++) {
      const percent = percents[i]
      const filler = this.fillers[i]

      //Frame 0 = verde, 1 = amarillo, 2 = rojo.
      const frame = percent > 0.666666 ? 0 : (percent > 0.333 ? 1 : 2)
      filler.setFrame(frame)

      const width = Math.round(FILL_WIDTH * percent)
      filler.setVisible(width > 0)
      filler.setCrop(0, 0, width, FILL_HEIGHT)
    }
  }
}
