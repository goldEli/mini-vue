import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import {
  ComponentInstance,
  createComponentInstance,
  setupComponent,
} from "./component";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { createAPI } from "./createApp";
import { VNode } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setChildrenText: hostSetChildrenText,
    remove: hostRemove,
  } = options;

  function render(vnode: VNode, container, parent) {
    patch(null, vnode, container, parent, null);
  }

  function patch(v1: VNode | null, v2: VNode, container, parent, anchor) {
    if (v2.shapeFlag & ShapeFlags.TEXT) {
      processText(v1, v2, container);
    } else if (v2.shapeFlag & ShapeFlags.FRAGMENT) {
      processFragment(v1, v2, container, parent);
    } else if (v2.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(v1, v2, container, parent, anchor);
    } else if (v2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(v1, v2, container, parent);
    }
  }

  function processElement(v1, v2, container, parent, anchor) {
    // update
    if (v1) {
      patchElement(v1, v2, container, parent);
    } else {
      mountElement(v2, container, parent, anchor);
    }
  }

  // update element
  function patchElement(v1, v2, container, parent) {
    console.log("patchElement", v1, v2, container, parent);

    const el = v1.el;
    v2.el = el;
    const oldProps = v1.props || EMPTY_OBJ;
    const nextProps = v2.props || EMPTY_OBJ;
    patchChildren(v1, v2, container, parent);
    patchProps(el, oldProps, nextProps);
  }

  function patchChildren(v1, v2, container, parent) {
    console.log(v1, v2, container, parent);
    // 老的 child Text  新的 child text
    if (
      v1.shapeFlag & ShapeFlags.TEXT_CHILDREN &&
      v2.shapeFlag & ShapeFlags.TEXT_CHILDREN &&
      v1.children !== v2.children
    ) {
      hostSetChildrenText(v1.el, v1.children);
      return;
    }

    // 老的 child Text  新的 child array
    if (
      v1.shapeFlag & ShapeFlags.TEXT_CHILDREN &&
      v2.shapeFlag & ShapeFlags.ARRAY_CHILDREN
    ) {
      // 清空text
      hostSetChildrenText(v1.el, null);
      // array append 到 container
      mountChild(v2.children, container, parent);
      return;
    }

    // 老的 child array 新的 child text
    if (
      v1.shapeFlag & ShapeFlags.ARRAY_CHILDREN &&
      v2.shapeFlag & ShapeFlags.TEXT_CHILDREN
    ) {
      // 清空儿子
      unmountChildren(v1.children);

      mountText(v2, v2.el);
      return;
    }

    // 老的 child array 新的 child array
    if (
      v1.shapeFlag & ShapeFlags.ARRAY_CHILDREN &&
      v2.shapeFlag & ShapeFlags.ARRAY_CHILDREN
    ) {
      patchChildrenArray(v1, v2, container, parent);
    }
  }

  function patchChildrenArray(v1, v2, container, parent) {
    let i = 0;
    let e1 = v1.children.length - 1;
    let e2 = v2.children.length - 1;

    // 从左往右
    while (i <= e1) {
      const c1 = v1.children[i];
      const c2 = v2.children[i];
      if (
        c1.key !== c2.key ||
        c1.type !== c2.type ||
        c1.shapeFlag !== c2.shapeFlag
      ) {
        break;
      }
      i++;
    }

    // 从右往左
    while (i <= e1) {
      const c1 = v1.children[e1];
      const c2 = v2.children[e2];
      if (
        c1.key !== c2.key ||
        c1.type !== c2.type ||
        c1.shapeFlag !== c2.shapeFlag
      ) {
        break;
      }
      --e1;
      --e2;
    }

    console.log({ e1, i, e2 });
    // 后面新增
    if (i > e1) {
      const anchor = v1.children[i].el
      debugger
      while (i <= e2) {
        patch(null, v2.children[i], container, parent, anchor);
        ++i;
      }
    }
    // 前面新增
    // if (i > e1) {
    //   while (i <= e2) {
    //     patch(null, v2.children[i], container, parent, null);
    //     ++i;
    //   }
    // }

  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i].el;
      hostRemove(child);
    }
  }

  function patchProps(el, oldProps, nextProps) {
    if (oldProps === nextProps) {
      return;
    }

    for (const key in nextProps) {
      const prevProp = oldProps[key];
      const nextProp = nextProps[key];
      // 数据不同更新
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
      // nextProps undefine 移除 key
      if (nextProp === undefined) {
        hostPatchProp(el, key, prevProp, undefined);
      }
    }

    // 如果key 不存在了 移除
    for (const key in oldProps) {
      if (!(key in nextProps)) {
        hostPatchProp(el, key, undefined, undefined);
      }
    }
  }

  function processText(v1, v2, container) {
    mountText(v2, container);
  }

  function processFragment(v1, v2, container, parent) {
    mountFragment(v2, container, parent);
  }

  function mountText(v2, container: any) {
    const textDom = document.createTextNode(v2.children);
    v2.el = textDom;
    container.appendChild(textDom);
  }

  function mountFragment(vnode: VNode, container: any, parent) {
    mountChild(vnode, container, parent);
  }

  function mountElement(vnode: VNode, container, parent, anchor) {
    // create dom
    // const el = document.createElement(vnode.type);
    const el = hostCreateElement(vnode.type);
    vnode.el = el;

    const { props, children } = vnode;

    for (const key in props) {
      const value = props[key];
      hostPatchProp(el, key, null, value);
    }

    // process children
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChild(vnode.children, el, parent);
    }

    // container.append(el);
    hostInsert(el, container, anchor);
  }

  function mountChild(children, container, parent) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      patch(null, child, container, parent, null);
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
        patch(prevSubTree, subTree, container, instance, null);
        instance.subTree = subTree;
        instance.vnode.el = subTree.el;
      } else {
        const subTree = instance.render.call(instance.proxy);

        patch(null, subTree, container, instance, null);
        instance.subTree = subTree;
        instance.vnode.el = subTree.el;
        instance.isMounted = true;
      }
    });
  }

  return {
    createApp: createAPI(render),
  };
}
