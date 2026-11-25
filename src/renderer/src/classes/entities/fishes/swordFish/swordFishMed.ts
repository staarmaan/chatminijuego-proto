import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";
import { SwordFishBig } from "./swordFishBig";

export class SwordFishMed extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username?:string) {
    super(scene, FISH_SIZES.MED, "swordFish", SwordFishBig, 1.25, username, x,y)
    this.dmg *= 1.25
    this.evolutionMaxTime *= 2
    this.defense *= 0.75
    this.lossHungerPerSecond *= 0.75
    this.fillHungerMulti = 0.8
  }

}
