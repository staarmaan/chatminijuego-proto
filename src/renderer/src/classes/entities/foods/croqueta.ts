import { MainScene } from "../../../main";
import { rnum, round } from "../../../utils";
import { Food } from "../Food";

export class Croqueta extends Food {
  constructor(scene: MainScene, username = "noname", x?:number, y?:number) {
    const circleRadius = 3.0
    const contaminateFrequency = rnum(15,30)
    super(scene, 1, circleRadius, contaminateFrequency, 'fishFood', username, x, y)

    const offset = 2.5 - circleRadius
    this.body?.setOffset(offset, offset)

    const type = round(rnum(0,3))
    this.play(`fishFood${type}`)
  }

  override thisupdate(dt: number):void {
    this.setAngle(this.angle + (this.body!.velocity.x * 0.1 * this.moveDirX))
    this.anims.timeScale = Math.abs(this.body!.velocity.y) * 0.1
    this.clampHorizontally(3)
  }
}
