import { proxyRef } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { VNode } from "./vnode";

export type ComponentInstance = {
  vnode: VNode;
  type: VNode["type"];
  setupState?: any;
  render?: any;
  proxy?: any;
  props?: any;
  emit?: any;
  slots?: any;
  provides?: any; // 用于实现provide/inject
  parent?: any
  subTree?: any;
  isMounted?: boolean
};

export function createComponentInstance(vnode: VNode , parent) {
  const component: ComponentInstance = {
    vnode,
    type: vnode.type,
    isMounted: false,
    subTree: {},
    setupState: {},
    props: {},
    parent,
    emit: () => {},
    slots: {},
    provides: parent ? parent.provides : [],
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance: ComponentInstance) {
  // 初始化props
  initProps(instance, instance.vnode.props);
  // 初始化slots
  initSlots(instance, instance.vnode.children);
  // // 初始化事件
  // setupEvent(instance);
  // 执行setup
  setupStatefulComponent(instance);
}

export function setupStatefulComponent(instance: ComponentInstance) {
  const Component = instance.type;
  // 执行setup
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);

    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });

    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}
export function handleSetupResult(instance: ComponentInstance, setupResult) {
  // setupResult is object or function
  // TODO function

  // handle object
  if (typeof setupResult === "object") {
    instance.setupState = proxyRef(setupResult);
  }

  finishComponentSetup(instance);
}

export function finishComponentSetup(instance: ComponentInstance) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}

let currentInstance: ComponentInstance | null = null;
export function getCurrentInstance() {
  return currentInstance;
}
export function setCurrentInstance(instance: ComponentInstance | null) {
  currentInstance = instance;
}
