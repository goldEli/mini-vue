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

function removeChild(container, child) {
  container.removeChild(child);
}

function removeChildren(container, children) {
  // children.forEach((item, idx) => {
  //   console.log(item, idx)
  //   removeChild(container, item)
  // })
  container.innerHTML = "";
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setChildrenText,
  removeChild,
  removeChildren,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}
