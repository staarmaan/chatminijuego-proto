/*
Copyright (c) 2010-2013 Matthias Richter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

Except as contained in this notice, the name(s) of the above copyright holders
shall not be used in advertising or otherwise to promote the sale, use or
other dealings in this Software without prior written authorization.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

TypeScript port of hump.timer (originally Lua).
*/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TweenCallback = (dt: number, remaining: number) => void;
/** Called when a timer fires. Returning `false` cancels the timer. */
export type TweenAfterCallback = (self?: unknown) => boolean | void;
export type EasingFn = (s: number, ...args: number[]) => number;

export interface TweenHandle {
  time: number;
  after: TweenAfterCallback;
  during: TweenCallback;
  limit: number;
  count: number;
}

export type Setter = (this: any, ...values: number[]) => void;
export type Getter = (this: any) => number | number[];
export type SettersAndGetters = Record<string, [Setter, Getter]>;

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

const out = (f: EasingFn): EasingFn => (s, ...args) => 1 - f(1 - s, ...args);

// concatenates two functions
const chain = (f1: EasingFn, f2: EasingFn): EasingFn => (s, ...args) =>
  (s < 0.5 ? f1(2 * s, ...args) : 1 + f2(2 * s - 1, ...args)) * 0.5;

const easings = new Map<string, EasingFn>(
  Object.entries<EasingFn>({
    linear: (s) => s,
    quad: (s) => s * s,
    cubic: (s) => s * s * s,
    quart: (s) => s * s * s * s,
    quint: (s) => s * s * s * s * s,
    sine: (s) => 1 - Math.cos((s * Math.PI) / 2),
    expo: (s) => 2 ** (10 * (s - 1)),
    circ: (s) => 1 - Math.sqrt(1 - s * s),

    back: (s, bounciness = 1.70158) => s * s * ((bounciness + 1) * s - bounciness),

    bounce: (s) => {
      // magic numbers ahead
      const a = 7.5625;
      const b = 1 / 2.75;
      return Math.min(
        a * s ** 2,
        a * (s - 1.5 * b) ** 2 + 0.75,
        a * (s - 2.25 * b) ** 2 + 0.9375,
        a * (s - 2.625 * b) ** 2 + 0.984375,
      );
    },

    elastic: (s, amp?: number, period?: number) => {
      const a = amp ? Math.max(1, amp) : 1;
      const p = period ?? 0.3;
      return -a * Math.sin(((2 * Math.PI) / p) * (s - 1) - Math.asin(1 / a)) * 2 ** (10 * (s - 1));
    },
  }),
);

/** Register a new easing function, usable by name (and as `in-`/`out-`/... variants). */
export function registerEasing(name: string, fn: EasingFn): void {
  easings.set(name, fn);
}

/**
 * Resolves a function or a method name such as "quad", "out-cubic",
 * "in-out-elastic" or "out-in-back" to an easing function.
 */
export function resolveEasing(key: string | EasingFn): EasingFn {
  if (typeof key === "function") return key;
  if (typeof key !== "string") throw new Error("Method must be function or string.");

  const direct = easings.get(key);
  if (direct) return direct;

  const construct = (pattern: RegExp, f: (m: EasingFn) => EasingFn): EasingFn | undefined => {
    const m = key.match(pattern);
    const method = m ? easings.get(m[1]) : undefined;
    return method ? f(method) : undefined;
  };

  const result =
    construct(/^in-([^-]+)$/, (f) => f) ??
    construct(/^out-([^-]+)$/, out) ??
    construct(/^in-out-([^-]+)$/, (f) => chain(f, out(f))) ??
    construct(/^out-in-([^-]+)$/, (f) => chain(out(f), f));

  if (!result) throw new Error("Unknown interpolation method: " + key);
  return result;
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

const nothing = (): void => {};

function updateTimerHandle(handle: TweenHandle, dt: number): void {
  handle.time += dt;
  handle.during(dt, Math.max(handle.limit - handle.time, 0));

  while (handle.time >= handle.limit && handle.count > 0) {
    if (handle.after(handle.after) === false) {
      handle.count = 0;
      break;
    }
    handle.time -= handle.limit;
    handle.count -= 1;
  }
}

interface PayloadEntry {
  subject: any;
  key: string;
  delta: number;
}

export class Timer {
  functions = new Set<TweenHandle>();

  update(dt: number): void {
    // timers may create new timers, so iterate over a snapshot
    const toUpdate = Array.from(this.functions);

    for (const handle of toUpdate) {
      if (this.functions.has(handle)) {
        updateTimerHandle(handle, dt);
        if (handle.count === 0) {
          this.functions.delete(handle);
        }
      }
    }
  }

  during(delay: number, during: TweenCallback, after?: TweenAfterCallback): TweenHandle {
    const handle: TweenHandle = {
      time: 0,
      during,
      after: after ?? nothing,
      limit: delay,
      count: 1,
    };
    this.functions.add(handle);
    return handle;
  }

  after(delay: number, func: TweenAfterCallback): TweenHandle {
    return this.during(delay, nothing, func);
  }

  every(delay: number, after: TweenAfterCallback, count: number = Infinity): TweenHandle {
    // Infinity - 1 === Infinity, so infinite repetition just works
    const handle: TweenHandle = { time: 0, during: nothing, after, limit: delay, count };
    this.functions.add(handle);
    return handle;
  }

  cancel(handle: TweenHandle): void {
    this.functions.delete(handle);
  }

  clear(): void {
    this.functions = new Set();
  }

  /**
   * Runs a generator as a script. Each `yield <seconds>` pauses the script
   * for that long (replaces Lua's coroutine-based `wait(t)`).
   *
   *   timer.script(function* () {
   *     console.log("a");
   *     yield 1;
   *     console.log("b, one second later");
   *   });
   */
  script(f: () => Generator<number, void, void>): void {
    const gen = f();
    const step = (): void => {
      const r = gen.next();
      if (!r.done) this.after(r.value, step);
    };
    step();
  }

  /**
   * Tween numeric fields of `subject` towards the values in `target` over `len` seconds.
   * `method` is an easing name or function (default "linear"); extra `args` are
   * passed to the easing function.
   */
  tween(
    len: number,
    subject: any,
    target: any,
    method: string | EasingFn = "linear",
    after?: TweenAfterCallback,
    ...args: number[]
  ): TweenHandle {
    return this.funcTween(len, subject, target, method, after, undefined, ...args);
  }

  /**
   * Like `tween`, but fields without a direct property are accessed via
   * `setX`/`getX` methods on the subject, or via `settersAndGetters[key] = [setter, getter]`.
   * Getters may return a number or an array of numbers; setters receive the values spread.
   */
  funcTween(
    len: number,
    subject: any,
    target: any,
    method: string | EasingFn = "linear",
    after?: TweenAfterCallback,
    settersAndGetters?: SettersAndGetters,
    ...args: number[]
  ): TweenHandle {
    // subject -> key -> [current values, setter]
    const toFuncTween = new Map<any, Map<string, [number[], Setter]>>();

    const setAndGet = (subj: any, k: string, v: any): [any, any] => {
      let setter: Setter | undefined;
      let getter: Getter | undefined;
      if (settersAndGetters && settersAndGetters[k]) {
        [setter, getter] = settersAndGetters[k];
      } else {
        setter = subj["set" + k];
        getter = subj["get" + k];
      }
      if (!setter || !getter) {
        throw new Error("key's value in subject is nil with no set/getter");
      }

      if (!toFuncTween.has(subj)) toFuncTween.set(subj, new Map());

      const got = getter.call(subj);
      const ref: number[] = Array.isArray(got) ? [...got] : [got];
      toFuncTween.get(subj)!.set(k, [ref, setter]);

      if (typeof v === "number" || (ref.length === 1 && !Array.isArray(v))) {
        v = [v];
      }
      return [ref, v];
    };

    // recursively collects fields defined in both subject and target into a flat list
    const collectPayload = (subj: any, tgt: any, outList: PayloadEntry[]): PayloadEntry[] => {
      for (const k of Object.keys(tgt)) {
        let v = tgt[k];
        let ref = subj[k];
        if (ref === undefined) {
          [ref, v] = setAndGet(subj, k, v);
        }
        if (typeof v !== typeof ref) {
          throw new Error(`Type mismatch in field "${k}". ${typeof v} vs ${typeof ref}`);
        }
        if (typeof v === "object" && v !== null) {
          collectPayload(ref, v, outList);
        } else {
          if (typeof v !== "number" || typeof ref !== "number") {
            throw new Error(`Field "${k}" does not support arithmetic operations`);
          }
          outList.push({ subject: subj, key: k, delta: v - ref });
        }
      }
      return outList;
    };

    const easing = resolveEasing(method);
    const payload = collectPayload(subject, target, []);
    let t = 0;
    let lastS = 0;

    return this.during(
      len,
      (dt) => {
        t += dt;
        const s = easing(Math.min(1, t / len), ...args);
        const ds = s - lastS;
        lastS = s;

        for (const { subject: ref, key, delta } of payload) {
          ref[key] = ref[key] + delta * ds;
        }
        for (const [ref, setters] of toFuncTween) {
          for (const [setterArgs, setter] of setters.values()) {
            setter.call(ref, ...setterArgs);
          }
        }
      },
      after,
    );
  }
}

// ---------------------------------------------------------------------------
// Default instance + module-style bound functions
// ---------------------------------------------------------------------------

const defaultTimer = new Timer();

export const update = defaultTimer.update.bind(defaultTimer);
export const during = defaultTimer.during.bind(defaultTimer);
export const after = defaultTimer.after.bind(defaultTimer);
export const every = defaultTimer.every.bind(defaultTimer);
export const cancel = defaultTimer.cancel.bind(defaultTimer);
export const clear = defaultTimer.clear.bind(defaultTimer);
export const script = defaultTimer.script.bind(defaultTimer);
export const tween = defaultTimer.tween.bind(defaultTimer);
export const funcTween = defaultTimer.funcTween.bind(defaultTimer);

/** Create a new, independent timer (like `Timer.new()` in Lua). */
export const newTimer = (): Timer => new Timer();

export default defaultTimer;
