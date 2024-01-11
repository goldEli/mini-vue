import { initProps } from "./componentProps";
import { VNode } from "./vnode";

export type ComponentInstance = {
  vnode: VNode;
  type: VNode["type"];
  setupState?: any;
  render?: any;
  proxy?: any;
  props?: any;
};

export function createComponentInstance(vnode: VNode) {
  const component: ComponentInstance = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
  };

  return component;
}

export function setupComponent(instance: ComponentInstance) {
  // TODO
  // // 初始化props
  initProps(instance, instance.vnode.props);
  // // 初始化slots
  // initSlots(instance, instance.vnode.children);
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
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}
export function handleSetupResult(instance: ComponentInstance, setupResult) {
  // setupResult is object or function
  // TODO function

  // handle object
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

export function finishComponentSetup(instance: ComponentInstance) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}
