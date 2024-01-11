import { hasOwn } from "../shared/index";

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(props, key)) {
      return props[key];
    } else if (hasOwn(setupState, key)) {
      return setupState[key];
    }

    if (hasOwn(setupState, "$el")) {
      return instance.vnode.el;
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter();
    }
    return undefined;
  },
};
