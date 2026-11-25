import { invLerp, rnum, round } from "../../../utils";
import { Fish } from "../Fiish";
import { Food } from "../Food";

export class CorpseFish extends Food {
  constructor(fish: Fish) {
    const fishSize = fish.fishSize

    const hits = 10 + (5 * fishSize)
    const circleRadius = 4.0 * (fishSize + 1)
    const contaminateFrequency = rnum(10,20)
    super(fish.scene, hits, circleRadius, contaminateFrequency, fish.fishTexture, fish.username, fish.x, fish.y)
    fish.scene.food.add(this) // Needed so Group.preUpdate() calls Entity.update() every frame.
    this.play(`${fish.fishTexture}-size${fishSize}`)

    this.velxMulti = 0.25

    this.contaminationLifeLoss = 5
    this.contaminationPercentAdd = 0.05 + (0.01 * fishSize)
    this.hungerPercentAdd = 0.05 + (0.05 * fishSize)

    this.anims.timeScale = 0.0
    this.setDepth(0.01)
    this.setTint(0x8b8b8c)
    this.setFlipY(true)

    const offset = 24 - circleRadius
    this.body?.setOffset(offset, offset)

    this.targetVelY = 0.001
  }

  override thisupdate(dt: number): void {
    const scale = 0.5 + (0.5 * invLerp(0, this.initHits, this.hits))
    this.setScale(scale)
  }
}
