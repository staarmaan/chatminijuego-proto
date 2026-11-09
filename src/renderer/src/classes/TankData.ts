type fishTypeAndSub = { fishType: number, subType: number }

/*
Esta hecho para ser un singleton que centralice algunos datos que afectarian a las entidades globalmente o para simplemente para almacenar datos especificos, como
la calidad del agua, historial de pescados o cantidad de peces.
*/
export class TankData {
  public fishCount: number = 0
  public waterQuality: number = 1.0 //Goes from 1 to 0.
  public fishUserHistory: fishTypeAndSub[] = [] //Aqui, el primer indice es el pez mas reciente.

}
