import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";

export class SwordFishBig extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username?:string) {
    super(scene, FISH_SIZES.BIG, "swordFish",  undefined, 1.7, username, x,y)
    this.dmg *= 2.0
    this.defense *= 0.5
    this.fillHungerMulti = 0.8
    this.lossHungerPerSecond *= 0.5
    this.starveDmg = 0.2
  }

}
