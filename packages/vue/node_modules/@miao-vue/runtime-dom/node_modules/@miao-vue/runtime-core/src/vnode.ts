import { isObject, ShapeFlags } from "@miao-vue/shared";
import { Fragment } from "./helpers/renderSlots";

export const Text = Symbol("Text");

export type VNode = {
  type: any;
  props: any;
  children: any;
  el: any;
  shapeFlag: ShapeFlags;
  emit: any;
  key: string | number;
  component?: any;
};
export function createVNode(type, props?, children?) {
  const vnode: VNode = {
    type,
    props,
    children,
    el: null,
    emit: null, // 事件处理函数
    shapeFlag: getShapeFlag(type),
    key: props?.key,
    component: null,
  };

  if (vnode.type === Fragment) {
    vnode.shapeFlag |= ShapeFlags.FRAGMENT;
  }
  if (vnode.type === Text) {
    vnode.shapeFlag |= ShapeFlags.TEXT;
  }

  if (typeof vnode.children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(vnode.children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(vnode.children)) {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}

export function createTextVNode(text: string) {
  return [createVNode(Text, {}, text)];
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
