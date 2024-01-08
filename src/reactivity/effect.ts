const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }
  deps.add(activeEffect);
}

let activeEffect;

type effectOptions = {
  scheduler?: Function;
};
// 用于依赖收集
export class ReactiveEffect {
  private _fn: any;
  public scheduler?: Function;
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}

export function effect(fn, options: effectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();
  const runner = _effect.run.bind(_effect);

  return runner;
}

export function trigger(target, key) {
  // trigger dep
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);

  for (let effect of deps) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
