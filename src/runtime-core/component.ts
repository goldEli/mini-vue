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
};

export function createComponentInstance(vnode: VNode) {
  const component: ComponentInstance = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
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
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
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
