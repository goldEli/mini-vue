const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance;
    if (key in setupState) {
      return setupState[key];
    }
    if (key === "$el") {
      return instance.vnode.el;
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter();
    }
    return undefined;
  },
};
