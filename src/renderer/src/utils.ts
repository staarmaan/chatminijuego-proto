const max = Math.max
const min = Math.min
const cos = Math.cos
const sin = Math.sin
const exp = Math.exp
const abs = Math.abs
const pow = Math.pow
const random = Math.random

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

export const angleTo = function (x1: number, y1: number, x2?: number, y2?: number): number {
  if (x2 && y2) {
    return Math.atan2(y2-y1, x2-x1)
  }
  return Math.atan2(y1, x1)
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

export const rpow = function(a: number, b: number, n = 2): number {
  return a + (b - a) * pow(random(), n)
}

/*
function rpow(a, b, n) --n is 2 by default.
    return a + (b - a) * (random() ^ (n or 2))
end

*/
