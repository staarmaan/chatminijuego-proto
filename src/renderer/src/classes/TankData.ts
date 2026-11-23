import { MainScene } from "../main"
import { clamp } from "../utils"

type entityHistorySlot = { username: string, id:number, texture:string, frame:number }

const max = Math.max
const min = Math.min
const abs = Math.abs

const CONTAMINATION_EXTRA_HUNGER_LOSS = 2.0

/*
Esta hecho para ser un singleton que centralice algunos datos que afectarian a las entidades globalmente o para simplemente para almacenar datos especificos, como
la calidad del agua, historial de pescados o cantidad de peces.
*/
export class TankData {
  private userEntityHistory: entityHistorySlot[] = [] //Aqui, el primer indice es la entidad mas reciente.
  private waterContaminationPercentage: number = 0.0 //Goes from 0.0 to 1.0.
  private aliveFishCount = 0

  public scene: MainScene

  constructor(scene: MainScene) {
    this.scene = scene
  }

  contaminateWater(percent: number):void { clamp(this.waterContaminationPercentage += abs(percent), 0, 1) }
  cureWater(percent: number):void { clamp(this.waterContaminationPercentage -= abs(percent),0,1) }

  getExtraHungerLossPercentFromContamination():number {
    return 1 + Math.pow(this.waterContaminationPercentage, CONTAMINATION_EXTRA_HUNGER_LOSS+1)*CONTAMINATION_EXTRA_HUNGER_LOSS
  }

  incrementAliveFishCount(amount = 1): void {
    this.aliveFishCount += amount
    this.scene.fishCounter.setValue(this.aliveFishCount)
  }

  getWaterContaminationPercentage(): number {return this.waterContaminationPercentage}
}
