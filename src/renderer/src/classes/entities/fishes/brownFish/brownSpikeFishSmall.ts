import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";
import { BrownSpikeFishMed } from "./brownSpikeFishMed";

export class BrownSpikeFishSmall extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username?:string) {
    super(scene, FISH_SIZES.SMALL, "brownSpikeFish", BrownSpikeFishMed, 1.1, username, x, y)
    this.evolutionMaxTime *= 1.1
    this.defense = 0.925
    this.dmg = 0.28
    this.lossHungerPerSecond = 0.017
    this.healPercentFromFullHungerPerSecond = 0.04
    this.starveDmg = 0.055
    this.speedMulti = 0.9
  }

}
