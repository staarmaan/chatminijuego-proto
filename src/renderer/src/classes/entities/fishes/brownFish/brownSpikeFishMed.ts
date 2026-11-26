import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";
import { BrownSpikeFishBig } from "./brownSpikeFishBig";

export class BrownSpikeFishMed extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username?:string) {
    super(scene, FISH_SIZES.MED, "brownSpikeFish", BrownSpikeFishBig, 1.35, username, x,y)
    this.evolutionMaxTime *= 2.1
    this.defense = 0.65
    this.dmg = 0.28*2.05
    this.lossHungerPerSecond = 0.017 * 0.8
    this.healPercentFromFullHungerPerSecond = 0.04
    this.starveDmg = 0.065
    this.speedMulti = 0.875
    this.fillHungerMulti = 0.85
  }

}
