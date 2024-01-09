import { track, trigger } from "./effect";

const createGetter = (readonly = false) => {
  return (target, key) => {
    const value = Reflect.get(target, key);

    if (!readonly) {
      track(target, key);
    }
    // track dep
    return value;
  };
};
const createSetter = () => {
  return (target, key, newValue) => {
    // trigger dep
    const res = Reflect.set(target, key, newValue);
    trigger(target, key);
    return res;
  };
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set: (target, key, newValue) => {
    console.warn(
      `${target} is readonly, cannot set ${newValue} to ${String(key)}`
    );
    return true;
  },
};