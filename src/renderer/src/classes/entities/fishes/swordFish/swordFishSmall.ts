import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";

export class SwordFishSmall extends Fish {
  constructor(scene: MainScene, x = rnum(0, scene.scale.width), y = -24, username = "noname") {
    super(scene, x,y, FISH_SIZES.SMALL, username, "swordFish")
  }

}
