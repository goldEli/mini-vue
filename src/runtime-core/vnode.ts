import { ShapeFlogs } from "../shared/ShapeFlags";
import { isObject } from "../shared/index";

export type VNode = {
  type: any;
  props: any;
  children: any;
  el: any;
  shapeFlag: ShapeFlogs;
  emit: any;
};
export function createVNode(type, props?, children?) {
  const vnode: VNode = {
    type,
    props,
    children,
    el: null,
    emit: null, // 事件处理函数
    shapeFlag: getShapeFlag(type),
  };

  if (typeof vnode.children === "string") {
    vnode.shapeFlag |= ShapeFlogs.TEXT_CHILDREN;
  } else if (Array.isArray(vnode.children)) {
    vnode.shapeFlag |= ShapeFlogs.ARRAY_CHILDREN;
  }

  return vnode;
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlogs.ELEMENT
    : ShapeFlogs.STATEFUL_COMPONENT;
}
