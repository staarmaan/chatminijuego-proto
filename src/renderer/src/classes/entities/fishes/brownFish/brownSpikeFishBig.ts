import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";

export class BrownSpikeFishBig extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username?:string) {
    super(scene, FISH_SIZES.BIG, "brownSpikeFish",  undefined, 1.85, username, x,y)

    this.defense = 0.4
    this.dmg = 0.28*3.1
    this.lossHungerPerSecond = 0.017 * 0.6
    this.healPercentFromFullHungerPerSecond = 0.04
    this.starveDmg = 0.065
    this.speedMulti = 0.85
    this.fillHungerMulti = 0.7
  }

}
