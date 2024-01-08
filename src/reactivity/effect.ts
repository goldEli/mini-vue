import { extend } from "./shared";

const targetMap = new Map();
export function track(target, key) {
  let depMap = targetMap.get(target);
  if (!depMap) {
    depMap = new Map();
    targetMap.set(target, depMap);
  }
  let dep = depMap.get(key);
  if (!dep) {
    dep = new Set();
    depMap.set(key, dep);
  }
  if (!activeEffect) {
    return
  }

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

let activeEffect: ReactiveEffect;

type effectOptions = {
  scheduler?: Function;
  onStop?: Function;
};
// 用于依赖收集
export class ReactiveEffect {
  private _fn: any;
  public scheduler?: Function;
  deps: any[] = [];
  onStop?: Function;
  active = true;

  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
  stop() {
    if (!this.active) {
      this.active = false;
      return;
    }
    clearUpEffect(this);
    if (this.onStop) {
      this.onStop();
    }
  }
}
function clearUpEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
}

export function effect(fn, options: effectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  extend(_effect, options);

  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function trigger(target, key) {
  // trigger dep
  const depMap = targetMap.get(target);
  const deps = depMap.get(key);

  for (let effect of deps) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function stop(runner: any) {
  runner.effect.stop();
}
