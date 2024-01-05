const targetMap = new Map();
export function trace(target, key) {
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

export function effect(fn) {
  // inject dep
  activeEffect = fn;

  // call fn
  fn();

}

export function trigger(target, key) {
  // trigger dep
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);
  deps.forEach((dep) => {
    dep();
  });
}
