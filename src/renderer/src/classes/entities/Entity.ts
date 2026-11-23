import Phaser from 'phaser'
import { Timer } from '../Timer'
import { StateMachine } from '../StateMachine'
import { MainScene } from '../../main'

let nextId = 0

type EntityFilter = (entity: Entity) => boolean


export class Entity extends Phaser.Physics.Arcade.Sprite {
  private ageTime: number = 0 //Cuenta el tiempo que tiene activo (en segundos, claro). No es modificable.
  public timeCount: number = 0 //Cuenta el tiempo que tiene activo (en segundos, claro). A diferencia de ageTime lo puedes modificar a tu necesidad.
  public tickCount: number = 0
  public justTicked = false
  private tickCountTimer: number = 0
  public readonly id: number //Numero entero unico para esta entidad.
  public stateMachine = new StateMachine() //Se actualiza despues de thisupdate.
  public timer = new Timer() //Se actualiza despues de thisupdate.
  public scene!: MainScene

  constructor(scene: MainScene, x: number, y: number, texture: string, frame?: number) {
    super(scene, x, y, texture, frame)
    scene.physics.add.existing(this)

    this.id = nextId
    nextId++

    // Both calls are required when you create the sprite yourself
    scene.add.existing(this)             // adds it to the display list
    scene.physics.add.existing(this) // gives it an Arcade body

    this.setCollideWorldBounds(true)
  }

  public getAge(): number {return this.ageTime}

  override update(_time: number, delta: number): void {
    const dt = delta * 0.001
    this.thisupdate(dt)

    this.stateMachine.update(this, dt)
    this.timer.update(dt)

    this.ageTime += dt
    this.timeCount += dt
    this.tickCountTimer += dt
      this.justTicked = false
    if (this.tickCountTimer > (1 / 60)) {
      this.tickCount++
      this.justTicked = true
    } //1/60 porque es el framerate default.
  }

  thisupdate(dt: number): void {return}

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

  //Al ser llamada, mantiene a la entidad adentro de la pantalla. Un offset positivo reduce el espacio en el que se mantiene, y uno negativo lo aumenta hacia por fuera de la pantalla. Por defecto el offset es 0
  public clampHorizontally(offset = 0): void {
    const { width } = this.scene.scale
    if (this.x < offset) {this.setX(offset)}
    if (this.x > width-offset) {this.setX(width-offset)}
  }
  //Al ser llamada, mantiene a la entidad adentro de la pantalla. Un offset positivo reduce el espacio en el que se mantiene, y uno negativo lo aumenta hacia por fuera de la pantalla. El offseet es 80 por defecto ya que el tamaño del area "jugable" es de 240 pixeles, pero el tamaño de la resolucion vertical del juego es 320.
  public clampVertically(offset = 80): void {
    const { height } = this.scene.scale
    if (this.y < offset) {this.setY(offset)}
    if (this.y > height-offset) {this.setY(height-offset)}
  }

  public getNearestEntity(group: Phaser.Physics.Arcade.Group, range=180, extraFilter?: EntityFilter): Entity|null {
    let closestEntity: Entity | null = null
    let closestRangeSquared = range*range

    group.children.forEach((entity) => {
      //Hacer algunas validaciones para considerarlo en el each.
      const isNotEntityClass = !(entity instanceof Entity)
      if ( isNotEntityClass || !entity.active || entity === this ) { return }
      if (extraFilter && !extraFilter(entity)) { return }

      const dx = entity.x - this.x
      const dy = entity.y - this.y
      //No es necesario conseguir la raiz cuadrada para la distancia, de hecho es considerablemente un poco mas optimizado a que si se usara Math.sqrt.
      const distanceSquared = (dx * dx) + (dy * dy)
      if (distanceSquared <= closestRangeSquared) {
        closestEntity = entity
        closestRangeSquared = distanceSquared
      }
    })

    return closestEntity
  }
}
