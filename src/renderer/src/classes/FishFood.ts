import { Entity } from './Entity';
import { moveTo, clamp, angleTo, rpow, rnum, expDec, round, randbool } from '../utils'

const random = Math.random
const abs = Math.abs
const sin = Math.sin
const cos = Math.cos


const MAX_LIFETIME = 60.0
const FLOOR_Y_LEVEL_MIN = 262
const FLOOR_Y_LEVEL_MAX = FLOOR_Y_LEVEL_MIN + 2

export class FishFood extends Entity {
  public readonly dir: 1|-1 = randbool() && 1 || -1
  public sinecosMoveAngle: number = 0.0
  public targetVel: number = 3.0
  public extraTargetVelY: number = rnum(0.65, 1.0)
  public state: 0 | 1 = 0
  public lifeTime: number = rnum(0.45, 1.0)*MAX_LIFETIME

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'fishFood')

    const type = round(random() * 3)
    this.play(`fishFood${type}`)

    const size = 2.5
    this.body?.setCircle(size)
    this.body?.setOffset(size, size)

    this.sinecosMoveAngle = random() * Math.PI

    const { width } = this.scene.scale
    const ox = 32.0
    this.setX(rnum(ox, width - ox))
  }

  private floatState(dt: number): void {
    this.extraTargetVelY = moveTo(this.extraTargetVelY, 0.0, rnum(0.005, 1.0) * dt)

    if (this.body!.position.y > FLOOR_Y_LEVEL_MIN) {
      this.targetVel = moveTo(this.targetVel, 0.0, rnum(0.5, 2.5) * dt)
    } else {
      this.targetVel = moveTo(this.targetVel, rnum(0.05, 2.5), rnum(0.01, 8) * dt)
    }
    this.anims.timeScale = this.targetVel

    if (this.targetVel <= 0) {
      this.setVelocity(0, 0)
      this.targetVel = 1.0
      this.sinecosMoveAngle = random() * Math.PI
      this.state = 1
      return
    }

    this.sinecosMoveAngle += dt
    const SPEED_X = 16.0
    const SPEED_Y = 12.0
    const velx = cos(this.sinecosMoveAngle) * SPEED_X * this.targetVel * this.dir
    const vely = abs(sin(this.sinecosMoveAngle)) * SPEED_Y * this.targetVel
    const extraVely = this.extraTargetVelY * 64.0
    this.setVelocity(velx, vely + extraVely)
  }

  private onFloorState(dt: number): void {
    this.sinecosMoveAngle += dt*rpow(0, 1, 1.5)
    this.setVelocityX(cos(this.sinecosMoveAngle)*3.0*this.dir)

    const y = this.body!.position.y
    if (y > FLOOR_Y_LEVEL_MAX) {
      this.targetVel = -1.0
    }
    if (y < FLOOR_Y_LEVEL_MIN) {
      this.targetVel = 1.0
    }

    const vely = this.body!.velocity.y
    const speed = rnum(0.01, 1.0) * 16
    const nextVely = moveTo(vely, this.targetVel*speed, rnum(1,5)*dt)
    this.setVelocityY(nextVely)

    this.anims.timeScale = abs(this.targetVel) * 0.2
  }

  /*
  Esta funcion sirve para evitar que se salga de la pantalla horizontalmente.
  No funciona tan perfecto porque con alta velocidad puede pasarse un poco.
  Supongo que tiene que ver con como Phaser corre sus fisicas.
  Por eso, a parte de ajustar la posicion x hacia el borde izquierdo o derecho, tambien se le mueve un poco al centro (por un pixel).
  */
  private clampToScreenXBorders(): void {
    /*
    Se supone que esta entidad aparece en una posicion x aleatoria (vease en el constructor), pero por alguna razon siempre termina
    su posicion x en 0, por eso utilizo age para evitar que no se ejecute el siguiente codigo por un solo frame al spawnear, eso lo arregla
    aunque de una forma algo sucia.
    */
    if (this.age <= 0) { return }

    const { width } = this.scene.scale
    const ox = 3.0
    const x = this.body!.position.x
    if (x < ox) {
      this.setX(ox + 1)
    }
    if (x > width - ox) {
      this.setX(width - ox - 1)
    }

    /*
    const newx = clamp(this.body!.position.x, ox, width - ox)
    console.log(newx, this.body!.position.x)
    this.setX(newx)
    */
  }

  override thisupdate(dt: number): void {
    switch (this.state) {
      case 0:
        this.floatState(dt)
        break
      case 1:
        this.onFloorState(dt)
        break
    }
    this.setAngle(this.angle + (this.body!.velocity.x * 0.1 * this.dir))
    this.clampToScreenXBorders()

    this.lifeTime -= dt
    if (this.lifeTime <= 0) {
      this.destroy()
    }
  }
}
