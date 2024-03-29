import { track, trigger } from "./effect";
import { ReactiveFlags, reactive, readonly } from "./reactive";
import { extend, isObject } from "@miao-vue/shared";

const createGetter = (isReadonly = false, shallow = false) => {
  return (target, key) => {
    const value = Reflect.get(target, key);

    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    if (shallow) {
      return value;
    }

    if (isObject(value)) {
      return isReadonly ? readonly(value) : reactive(value);
    }

    if (!isReadonly) {
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
const shallowReadonlyGet = createGetter(true, true);

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

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
