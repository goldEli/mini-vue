import { createRenderer, createElementVNode } from "@miao-vue/runtime-core";
export { toDisplayString } from "@miao-vue/shared";
export * from "@miao-vue/runtime-core";

function createElement(type) {
  return document.createElement(type);
}
const isOn = (key: string) => {
  return /^on[A-Z]/.test(key);
};
const getEventName = (key: string) => {
  // onClick => click

  return key.slice(2).toLowerCase();
};
function patchProp(el, key, prevVal, nextVal) {
  if (isOn(key)) {
    const eventName = getEventName(key);
    el.addEventListener(eventName, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      (el as HTMLElement).removeAttribute(key);
      return;
    } else {
      (el as HTMLElement).setAttribute(key, nextVal);
    }
  }
}

function insert(el, container, anchor) {
  container.insertBefore(el, anchor || null);
}

function setChildrenText(el, text) {
  el.textContent = text;
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setChildrenText,
  remove,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}
