import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";

export class SwordFishSmall extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username = "noname") {
    super(scene, 1.0, x,y, FISH_SIZES.SMALL, username, "swordFish")
  }

}
