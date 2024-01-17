import { effect } from "../reactivity/effect";
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
    patch(null, vnode, container, parent);
  }

  function patch(v1: VNode | null, v2: VNode, container, parent) {
    if (v2.shapeFlag & ShapeFlags.TEXT) {
      processText(v1, v2, container);
    } else if (v2.shapeFlag & ShapeFlags.FRAGMENT) {
      processFragment(v1, v2, container, parent);
    } else if (v2.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(v1, v2, container, parent);
    } else if (v2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(v1, v2, container, parent);
    }
  }

  function processElement(v1, v2, container, parent) {
    // update
    if (v1) {
      patchElement(v1, v2, container, parent);
    } else {
      mountElement(v2, container, parent);
    }
  }

  // update element
  function patchElement(v1, v2, container, parent) {
    console.log("patchElement", v1, v2, container, parent);
  }

  function processText(v1, v2, container) {
    mountText(v1, v2, container);
  }

  function processFragment(v1, v2, container, parent) {
    mountFragment(v2, container, parent);
  }

  function mountText(v1, v2, container: any) {
    const textDom = document.createTextNode(v2.children);
    v2.el = textDom;
    container.appendChild(textDom);
  }

  function mountFragment(vnode: VNode, container: any, parent) {
    mountChild(vnode, container, parent);
  }

  function mountElement(vnode: VNode, container, parent) {
    // create dom
    // const el = document.createElement(vnode.type);
    const el = hostCreateElement(vnode.type);
    vnode.el = el;

    const { props, children } = vnode;

    hostPatchProp(el, props);

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

    for (let i = 0; i < vnode.children.length; i++) {
      const child = vnode.children[i];
      patch(null, child, container, parent);
    }
  }

  function processComponent(v1: VNode | null, v2: VNode, container, parent) {
    mountComponent(v2, container, parent);
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
    effect(() => {
      if (instance.isMounted) {
        // update
        console.log("update");

        const prevSubTree = instance.subTree;
        const subTree = instance.render.call(instance.proxy);
        patch(prevSubTree, subTree, container, instance);
        instance.subTree = subTree;
        instance.vnode.el = subTree.el;
      } else {
        const subTree = instance.render.call(instance.proxy);

        console.log(subTree);
        patch(null, subTree, container, instance);
        // instance.subTree = subTree;
        instance.vnode.el = subTree.el;
        instance.isMounted = true;
      }
    });
  }

  return {
    createApp: createAPI(render),
  };
}
