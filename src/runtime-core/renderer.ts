import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { getSequence } from "../shared/getSequence";
import {
  ComponentInstance,
  createComponentInstance,
  setupComponent,
} from "./component";
import {
  PublicInstanceProxyHandlers,
  shouldUpdateComponent,
} from "./componentPublicInstance";
import { createAPI } from "./createApp";
import { queueJobs } from "./scheduler";
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
      patchElement(v1, v2, container, parent, anchor);
    } else {
      mountElement(v2, container, parent, anchor);
    }
  }

  function isSameNodeType(v1, v2) {
    return v1.type === v2.type && v1.key === v2.key;
  }

  // update element
  function patchElement(v1, v2, container, parent, anchor) {
    // console.log("patchElement", v1, v2, container, parent);

    const el = v1.el;
    v2.el = el;
    const oldProps = v1.props || EMPTY_OBJ;
    const nextProps = v2.props || EMPTY_OBJ;
    patchChildren(v1, v2, el, parent, anchor);
    patchProps(el, oldProps, nextProps);
  }

  function patchChildren(v1, v2, container, parent, anchor) {
    // console.log(v1, v2, container, parent);
    // 老的 child Text  新的 child text
    if (
      v1.shapeFlag & ShapeFlags.TEXT_CHILDREN &&
      v2.shapeFlag & ShapeFlags.TEXT_CHILDREN &&
      v1.children !== v2.children
    ) {
      hostSetChildrenText(v1.el, v2.children);
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
      patchChildrenArray(v1, v2, container, parent, anchor);
    }
  }

  function patchChildrenArray(v1, v2, container, parent, anchor) {
    let i = 0;
    let e1 = v1.children.length - 1;
    let e2 = v2.children.length - 1;
    const c1 = v1.children;
    const c2 = v2.children;
    const l1 = c1.length;
    const l2 = c2.length;

    // 从左往右
    while (i <= e1 && i <= e2) {
      const c1 = v1.children[i];
      const c2 = v2.children[i];
      if (isSameNodeType(c1, c2)) {
        patch(c1, c2, container, parent, anchor);
      } else {
        break;
      }
      i++;
    }

    // 从右往左
    while (i <= e1 && i <= e2) {
      const c1 = v1.children[e1];
      const c2 = v2.children[e2];
      if (isSameNodeType(c1, c2)) {
        patch(c1, c2, container, parent, anchor);
      } else {
        break;
      }
      --e1;
      --e2;
    }

    console.log({ e1, i, e2 });

    if (i > e1) {
      // 前后新增
      const anchor = v1.children[i] ? v1.children[i].el : null;
      while (i <= e2) {
        patch(null, v2.children[i], container, parent, anchor);
        ++i;
      }
    } else if (i > e2) {
      // 前后删除
      while (i <= e1) {
        // patch(null, v2.children[i], v2.el, container, anchor);
        hostRemove(v1.children[i].el);
        ++i;
      }
    } else {
      // 中间对比
      // 中间对比
      let s1 = i;
      let s2 = i;

      // 需要处理的长度
      const toBePatched = e2 - s2 + 1;
      // 已处理的长度
      let patched = 0;
      // 新节点key对应的index
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        // 如果大于了需要处理的新节点，直接删除，优化性能
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;
        if (!prevChild.key) {
          // 如果没有key 循环对比type
          for (let j = s2; j <= e2; j++) {
            if (isSameNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        } else {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        }

        // 如果新的不存在老的节点，删除
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parent, null);
          patched++;
        }
      }
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
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
    if (v1) {
      updateComponent(v1, v2, container, parent);
    } else {
      mountComponent(v2, container, parent);
    }
  }

  function updateComponent(v1, v2, container, parent) {
    const instance = v1.component;
    v2.component = instance;
    if (shouldUpdateComponent(v1, v2)) {
      instance.next = v2;
      instance.update();
    } else {
      v2.el = v1.el;
      instance.vnode = v2;
    }
    // const next = parent.next;
    // next & next();
    // console.log("update component");
  }

  function mountComponent(vnode: VNode, container, parent) {
    // create component instance
    const instance = createComponentInstance(vnode, parent);
    vnode.component = instance;

    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

    // 初始化 component
    setupComponent(instance);

    // 执行组件 render 处理后续
    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance: ComponentInstance, container) {
    instance.update = effect(
      () => {
        console.log("effect", instance);
        if (instance.isMounted) {
          // update
          // console.log("update");
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }

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
      },
      {
        scheduler: () => {
          queueJobs(instance.update);
        },
      }
    );
  }

  return {
    createApp: createAPI(render),
  };
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;

  instance.props = nextVNode.props;
}
