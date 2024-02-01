import { createVNode } from "../vnode";

export const Fragment = Symbol("Fragment");

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    return createVNode(Fragment, {}, slot(props));
  }
  return null; // 或者返回一个默认的内容
}
