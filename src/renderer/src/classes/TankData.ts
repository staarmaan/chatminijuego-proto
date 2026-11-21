type entityHistorySlot = { username: string, id:number, texture:string, frame:number }

const max = Math.max
const min = Math.min
const abs = Math.abs

/*
Esta hecho para ser un singleton que centralice algunos datos que afectarian a las entidades globalmente o para simplemente para almacenar datos especificos, como
la calidad del agua, historial de pescados o cantidad de peces.
*/
export class TankData {
  private userEntityHistory: entityHistorySlot[] = [] //Aqui, el primer indice es la entidad mas reciente.
  private waterContaminationPercentage: number = 0.0 //Goes from 0.0 to 1.0.

  contaminateWater(percent: number):void { min(1, this.waterContaminationPercentage += abs(percent)) }
  cureWater(percent: number):void { max(0, this.waterContaminationPercentage -= abs(percent)) }

  getWaterContaminationPercentage(): number {return this.waterContaminationPercentage}
}
