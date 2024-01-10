import { createComponentInstance, setupComponent } from "./component";
import { VNode } from "./vnode";

export function render(vnode: VNode, container) {
  patch(vnode, container);
}

export function patch(vnode: VNode, container) {
  // processElement
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else {
    // processComponent
    processComponent(vnode, container);
  }
}

export function processElement(vnode: VNode, container) {
  mountElement(vnode, container);
}

export function mountElement(vnode: VNode, container) {
  // create dom
  const el = document.createElement(vnode.type);

  const { props, children } = vnode;

  // process props
  for (const key in props) {
    (el as HTMLElement).setAttribute(key, props[key]);
  }

  // process children
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChild(vnode, container);
  }

  container.append(el);
}

function mountChild(vnode: VNode, container) {
  vnode.children.forEach((child) => {
    patch(child, container);
  });
}

export function processComponent(vnode: VNode, container) {
  mountComponent(vnode, container);
}

export function mountComponent(vnode: VNode, container) {
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
