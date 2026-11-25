import { MainScene } from "../../../../main";
import { rnum } from "../../../../utils";
import { Fish, FISH_SIZES } from "../../Fiish";
import { SwordFishMed } from "./swordFishMed";

export class SwordFishSmall extends Fish {
  constructor(scene: MainScene, x?:number, y?: number, username?:string) {
    super(scene, FISH_SIZES.SMALL, "swordFish",  SwordFishMed, 1.0, username, x,y)
  }

}
