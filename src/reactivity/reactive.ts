import { track, trigger } from "./effect";

export function reactive(raw) {
  return new Proxy(raw, {
    get: (target, key) => {
      const value = Reflect.get(target, key);

      track(target, key);
      // track dep
      return value;
    },
    set: (target, key, newValue) => {
      // trigger dep
      const res = Reflect.set(target, key, newValue);
      trigger(target, key);
      return res;
    },
  });
}
