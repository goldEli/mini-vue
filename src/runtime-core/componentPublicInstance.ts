import { proxyRef } from "../reactivity";
import { hasOwn } from "../shared/index";

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(props, key)) {
      const ret = props[key];
      return ret;
    } else if (hasOwn(setupState, key)) {
      const ret = setupState[key]
      return ret;
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
    return undefined;
  },
};
