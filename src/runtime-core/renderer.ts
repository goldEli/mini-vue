import { createComponentInstance, setupComponent } from "./component";
import { VNode } from "./vnode";

export function render(vnode: VNode, container) {
  patch(vnode, container);
}

export function patch(vnode: VNode, container) {
  // processComponent
  processComponent(vnode, container);

  // processElement
}

export function processComponent(vnode:VNode, container) {
  mountComponent(vnode, container);
}

export function mountComponent(vnode:VNode, container) {
  // create component instance
  const instance = createComponentInstance(vnode);

  // 初始化 component
  setupComponent(instance);

  // TODO 不晓得干啥
  setupRenderEffect(instance, container);
}

export function setupRenderEffect(instance, container) {
  const subTree = instance.render();

  patch(subTree, container);
}
