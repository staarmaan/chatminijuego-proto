/** A state callback. `this` is bound to the entity it is called on. */
export type StateFunc = (this: any, ...args: any[]) => void;

/** Replaces the Lua tuple {update, start, end, timer} so the timer can be typed properly. */
interface StateData {
  update?: StateFunc;
  start?: StateFunc;
  end?: StateFunc;
  timer: number;
}

/** Equivalent of lume.call: calls `fn` (if any) with `this` set to the entity. */
function call(fn: StateFunc | undefined | null, entity: unknown, ...args: unknown[]): void {
  if (fn) fn.call(entity, ...args);
}

/**
 * A component to handle complex entity behavior (practically all entities :p).
 */
export class StateMachine {
  private _count = 0;
  private _current = "";
  private _states = new Map<string, StateData>();

  /**
   * Adds a new state it can then switch to.
   * @returns itself, to allow chaining.
   */
  register(
    name: string,
    updateFunc?: StateFunc,
    startFunc?: StateFunc,
    endFunc?: StateFunc,
  ): this {
    this._states.set(name, { update: updateFunc, start: startFunc, end: endFunc, timer: 0 });
    this._count += 1;
    return this;
  }

  /**
   * Adds a new state and automatically takes its update, start and end functions from the
   * entity, based on the state name. E.g. for 'default' it uses the entity's
   * `defaultUpdate`, `defaultStart` and `defaultEnd` methods.
   * @returns itself, to allow chaining.
   */
  autoRegister(name: string, entity: Record<string, any>): this {
    return this.register(
      name,
      entity[name + "Update"],
      entity[name + "Start"],
      entity[name + "End"],
    );
  }

  /**
   * Runs the previous state's end function, then the new state's start function.
   * @param entity Required (state callbacks are called with `this` = entity), to prevent circular references.
   * @param name The new state's name. It must exist or an error is thrown.
   * @param resetTimer Reset the previous state's timer to 0. True by default.
   * @param force When switching to the same state, call end and start anyways. False by default.
   * @param args Custom arguments for the new state's start function.
   * @returns itself, to allow chaining; `undefined` if nothing happened (same state, not forced).
   */
  switch(
    entity: unknown,
    name: string,
    resetTimer?: boolean,
    force?: boolean,
    ...args: unknown[]
  ): this | undefined {
    if (!force && this._current === name) return undefined;

    const prev = this._states.get(this._current);
    if (prev) {
      call(prev.end, entity);
      if (resetTimer || resetTimer === undefined) prev.timer = 0;
    }

    const next = this._states.get(name);
    if (!next) throw new Error(`A "${name}" state doesn't exist here.`);
    this._current = name;

    call(next.start, entity, ...args);

    return this;
  }

  /**
   * A version of `switch` that takes fewer arguments.
   * @param entity Required (state callbacks are called with `this` = entity), to prevent circular references.
   * @param name The new state's name. It must exist or an error is thrown.
   * @param args Custom arguments for the new state's start function.
   */
  simpleSwitch(entity: unknown, name: string, ...args: unknown[]): this | undefined {
    return this.switch(entity, name, undefined, undefined, ...args);
  }

  /** Calls the current state's update function, if it has one, and advances its timer. */
  update(entity: unknown, dt: number): void {
    const state = this._states.get(this._current);
    if (!state) throw new Error(`${this._current} state doesnt exits, on update`);

    call(state.update, entity, dt);
    state.timer += dt;
  }

  /** The name of the current state. */
  getName(): string {
    return this._current;
  }

  /** Time passed in the current state. */
  getTime(): number {
    return this.current().timer;
  }

  /** Sets the time of the current state. */
  setTime(time: number): void {
    this.current().timer = time;
  }

  /** Checks if it is currently in any of the passed state names. */
  isOn(...names: string[]): boolean {
    return names.includes(this._current);
  }

  /** The amount of registered states. */
  getCount(): number {
    return this._count;
  }

  private current(): StateData {
    const state = this._states.get(this._current);
    if (!state) throw new Error(`${this._current} state doesn't exist`);
    return state;
  }
}

export default State;
