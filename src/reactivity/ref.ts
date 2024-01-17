import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "../shared/index";

class RefImpl {
  private dep = new Set(); //收集依赖
  private _rawValue: any; //原始值
  __isRef = true; // 标识是否是ref

  constructor(private _value: any) {
    this._rawValue = _value;
    this._value = convert(_value);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    // 如果新值和老值相等那么不触发trigger
    if (hasChanged(this._rawValue, newVal)) {
      this._value = convert(newVal);
      this._rawValue = newVal;
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

function convert(val) {
  return isObject(val) ? reactive(val) : val;
}

export function ref(val) {
  return new RefImpl(val);
}

export function isRef(ref) {
  return ref !== null && ref !== undefined && !!ref.__isRef;
}

export function unRef(ref) {
  if (isRef(ref)) {
    return ref.value;
  }
  return ref;
}

// 代理 ref,解决 .value 问题
export function proxyRef(obj) {
  /**
   * get -> isRef ? obj.value : obj
   * set -> isRef ? newValue : target[key].value = newValue
   */

  return new Proxy(obj, {
    get: (target, key) => {
      const res = Reflect.get(target, key)
      return unRef(res);
    },
    set: (target, key, newValue) => {
        /**
         * 1. 原值是ref，新值ref 直接替换
         * 2. 原值是ref, 新值不是ref 通过.value 修改
         * 3. 原值不是ref, 新值ref 直接替换
         * 4. 原值不是ref, 新值不是ref 直接替换
         */
        if (isRef(target[key]) && !isRef(newValue)) {
          target[key].value = newValue;
          return true
        }
        return Reflect.set(target, key, newValue);
    }
  });
}
