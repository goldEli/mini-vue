import { createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    return createVNode("div", {}, slot(props));
  }
  return null; // 或者返回一个默认的内容
}
