import { ShapeFlags } from "../shared/ShapeFlags";
import {
  ComponentInstance,
  createComponentInstance,
  setupComponent,
} from "./component";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { createAPI } from "./createApp";
import { VNode } from "./vnode";

export function createRenderer(options: { createElement; patchProp; insert }) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;

  function render(vnode: VNode, container, parent) {
    patch(vnode, container, parent);
  }

  function patch(vnode: VNode, container, parent) {
    if (vnode.shapeFlag & ShapeFlags.TEXT) {
      processText(vnode, container);
    } else if (vnode.shapeFlag & ShapeFlags.FRAGMENT) {
      processFragment(vnode, container, parent);
    } else if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(vnode, container, parent);
    } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(vnode, container, parent);
    }
  }

  function processElement(vnode: VNode, container, parent) {
    mountElement(vnode, container, parent);
  }

  function processText(vnode: VNode, container) {
    mountText(vnode, container);
  }

  function processFragment(vnode, container, parent) {
    mountFragment(vnode, container, parent);
  }

  function mountText(vnode: VNode, container: any) {
    const textDom = document.createTextNode(vnode.children);
    vnode.el = textDom;
    container.appendChild(textDom);
  }

  function mountFragment(vnode: VNode, container: any, parent) {
    mountChild(vnode, container, parent);
  }

  const isOn = (key: string) => {
    return /^on[A-Z]/.test(key);
  };

  const getEventName = (key: string) => {
    // onClick => click

    return key.slice(2).toLowerCase();
  };

  function mountElement(vnode: VNode, container, parent) {
    // create dom
    // const el = document.createElement(vnode.type);
    const el = hostCreateElement(vnode.type);
    vnode.el = el;

    const { props, children } = vnode;

    // process props
    // for (const key in props) {
    //   if (isOn(key)) {
    //     const eventName = getEventName(key);
    //     el.addEventListener(eventName, props[key]);
    //   } else {
    //     (el as HTMLElement).setAttribute(key, props[key]);
    //   }
    // }
    hostPatchProp(el, props)

    // process children
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChild(vnode, el, parent);
    }

    // container.append(el);
    hostInsert(el, container);
  }

  function mountChild(vnode: VNode, container, parent) {
    vnode.children.forEach((child) => {
      patch(child, container, parent);
    });
  }

  function processComponent(vnode: VNode, container, parent) {
    mountComponent(vnode, container, parent);
  }

  function mountComponent(vnode: VNode, container, parent) {
    // create component instance
    const instance = createComponentInstance(vnode, parent);

    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

    // 初始化 component
    setupComponent(instance);

    // 执行组件 render 处理后续
    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance: ComponentInstance, container) {
    const subTree = instance.render.call(instance.proxy);

    patch(subTree, container, instance);
    instance.vnode.el = subTree.el;
  }

  return {
    createApp: createAPI(render),
  };
}
