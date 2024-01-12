import { hasOwn } from "../shared/index";
import { getCurrentInstance } from "./component";

export function provide(key, val) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;

    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }

    provides[key] = val;
  }
}

export function inject(key, defaultVal) {
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    // const { provides } = currentInstance ?? {};
    // console.log(currentInstance, provides, key, defaultVal);
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    }
    if (typeof defaultVal === "function") {
      return defaultVal();
    }
    return defaultVal; // 如果没有提供，则返回默认值
  }
}
