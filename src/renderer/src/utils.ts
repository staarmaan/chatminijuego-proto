const max = Math.max
const min = Math.min
const cos = Math.cos
const sin = Math.sin
const exp = Math.exp
const abs = Math.abs
const pow = Math.pow
const random = Math.random
const floor = Math.floor
const ceil = Math.ceil
const sqrt = Math.sqrt

export const clamp = function (value: number, minValue: number, maxValue: number): number {
  return max(min(value, maxValue), minValue)
}

export const moveTo = function (value: number, destiny: number, steps: number): number {
  if (destiny != value) {
    if (destiny > value) {
      value = min(value + steps, destiny)
    } else {
      value = max(value - steps, destiny)
    }
  }
  return value
}

export const fromPloar = function (angle: number, radius = 1.0): number[] {
  // could also have done radius =  ?? 1.0
  return [cos(angle) * radius, sin(angle) * radius]
}

export const angleTo = function (x1: number, y1: number, x2 = x1*2, y2= y1*2): number {
  return Math.atan2(y2-y1, x2-x1)
}

//Best range for decay is approx. 1 to 25. Decay changes pretty much exponentialy.
export const expDec = function (from: number, to: number, decay: number, dt: number, limit = 0.0): number {
  if (from == to) { return to }
  const result = to + (from - to) * exp(-decay * dt)
  if (abs(result - to) < limit) {
    return to
  }
  return result
}

export const rnum = function(a: number, b: number): number {
  return a + (b - a) * random()
}

export const randangle = function (): number {
  return random()*Math.PI
}

export const randegrees = function (): number {
  return random()*360
}

export const rpow = function(a: number, b: number, n = 2): number {
  return a + (b - a) * pow(random(), n)
}

export const round = function (x: number, increment = 0): number {
  if (increment !== 0) { return round(x / increment) * increment }
  if (x >= 0) {
    return floor(x + 0.5)
  }
  return ceil(x - 0.5)
}

export const randbool = function (): boolean {
  return random() > 0.5
}

export const randsign = function (): 1|-1 {
    return randbool() && 1 || -1
}

export const normalize = function (x: number, y: number): number[] {
  const len = sqrt(x * x + y * y)
  if (len > 0) {
    return [x/len, y/len]
  }
  return [x,y]
}

/*
Ejemplo de uso:
const pick = weightedChoice({ cat: 10, dog: 5, frog: 0 }) // Tendra mas chance de elegir cat sobre dog. Nunca se eligira frog.
*/
export function weightedChoice<K extends string | number>(
  weights: Record<K, number>
): K {
  const entries = Object.entries(weights) as [K, number][]

  let sum = 0
  for (const [, w] of entries) {
    //if (w < 0) throw new Error("weight value less than zero")
    sum += max(0, w)
  }
  if (sum === 0) throw new Error("all weights are zero in weightedChoice call. At least one key needs a greather than 0 number!!")

  let rnd = random() * sum // lume.random(sum): float in [0, sum)
  let last = entries[0][0]
  for (const [key, w] of entries) {
    if (w > 0) last = key
    if (rnd < w) return key
    rnd -= w
  }
  return last // only reachable through floating-point rounding
}

/*
local function normalize(x,y)
	local l = len(x,y)
	if l > 0 then
		return x/l, y/l
	end
	return x,y
end
*/
