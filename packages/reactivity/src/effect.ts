import { extend } from "@miao-vue/shared";

const targetMap = new Map();
// 当前 effect
let activeEffect: ReactiveEffect;
// 是否可以收集依赖
let shouldTrack = false;

export function track(target, key) {
  if (!isTracking()) return;
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

  // 如果收集过就不添加
  if (dep.has(activeEffect)) return;

  trackEffects(dep);
}

export function trackEffects(dep) {
  // if (!isTracking()) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function trigger(target, key) {
  // trigger dep
  const depMap = targetMap.get(target);
  const dep = depMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (let effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

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
    // 如果被stop
    if (!this.active) {
      return this._fn();
    }

    /**
     * 每次执行完后 将 shouldTrack 关闭，避免收集到 stop 的 effect
     */
    shouldTrack = true;
    activeEffect = this;
    const res = this._fn();
    shouldTrack = false;

    return res;
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

export function stop(runner: any) {
  runner.effect.stop();
}
