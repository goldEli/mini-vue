import { shallowReadonly } from "../reactivity/reactive";
import { ShapeFlags } from "../shared/ShapeFlags";
import { ComponentInstance, createComponentInstance, setupComponent } from "./component";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { VNode, createVNode } from "./vnode";

export function render(vnode: VNode, container) {
  patch(vnode, container);
}

export function patch(vnode: VNode, container) {
  // processElement
  if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // processComponent
    processComponent(vnode, container);
  }
}

export function processElement(vnode: VNode, container) {
  mountElement(vnode, container);
}

const isOn = (key: string) => {
  return /^on[A-Z]/.test(key);
};

const getEventName = (key: string) => {
  // onClick => click

  return key.slice(2).toLowerCase();
};

export function mountElement(vnode: VNode, container) {
  // create dom
  const el = document.createElement(vnode.type);
  vnode.el = el;

  const { props, children } = vnode;

  // process props
  for (const key in props) {
    if (isOn(key)) {
      const eventName = getEventName(key);
      el.addEventListener(eventName, props[key]);
    } else {
      (el as HTMLElement).setAttribute(key, props[key]);
    }
  }

  // process children
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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

export function setupRenderEffect(instance: ComponentInstance, container) {
  const subTree = instance.render.call(instance.proxy);

  patch(subTree, container);
  instance.vnode.el = subTree.el;
}
