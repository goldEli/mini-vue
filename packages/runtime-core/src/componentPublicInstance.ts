import { proxyRef } from "@miao-vue/reactivity";
import { hasOwn } from "@miao-vue/shared";

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
  $props: (instance) => instance.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(props, key)) {
      const ret = props[key];
      return ret;
    } else if (hasOwn(setupState, key)) {
      const ret = setupState[key];
      return ret;
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
    return undefined;
  },
};

export const shouldUpdateComponent = (prevVNode, nextVNode) => {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;

  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
};
