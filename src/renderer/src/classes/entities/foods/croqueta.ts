import { MainScene } from "../../../main";
import { rnum, round } from "../../../utils";
import { Food } from "../Food";

export class Croqueta extends Food {
  constructor(scene: MainScene, username = "noname", x = rnum(0, scene.scale.width), y = -8) {
    const circleRadius = 2.0
    const contaminateFrequency = rnum(15,30)
    super(scene, 1, circleRadius, contaminateFrequency, 'fishFood', username, x, y)

    const type = round(rnum(0,3))
    this.play(`fishFood${type}`)
  }

  override thisupdate(dt: number):void {
    this.setAngle(this.angle + (this.body!.velocity.x * 0.1 * this.moveDirX))
    this.clampHorizontally(3)
  }
}
