import { createComponentInstance, setupComponent } from "./component";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
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
  vnode.el = el;

  const { props, children } = vnode;

  // process props
  for (const key in props) {
    (el as HTMLElement).setAttribute(key, props[key]);
  }

  // process children
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChild(vnode, el);
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

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  // 初始化 component
  setupComponent(instance);

  // 执行组件 render 处理后续
  setupRenderEffect(instance, container);
}

export function setupRenderEffect(instance, container) {
  const subTree = instance.render.call(instance.proxy);

  patch(subTree, container);
  console.log(subTree);
  instance.vnode.el = subTree.el;
}
