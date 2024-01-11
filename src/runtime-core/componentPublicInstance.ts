import { hasOwn } from "../shared/index";

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance;

    if (hasOwn(setupState, "$el")) {
      return instance.vnode.el;
    } else if (hasOwn(setupState, key)) {
      return setupState[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter();
    }
    return undefined;
  },
};
