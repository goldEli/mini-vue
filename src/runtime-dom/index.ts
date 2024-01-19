import { createRenderer } from "../runtime-core/renderer";

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

function insert(el, container) {
  container.append(el);
}

function setChildrenText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setChildrenText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}
