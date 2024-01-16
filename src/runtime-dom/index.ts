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
function patchProp(el, props) {
  for (const key in props) {
    if (isOn(key)) {
      const eventName = getEventName(key);
      el.addEventListener(eventName, props[key]);
    } else {
      (el as HTMLElement).setAttribute(key, props[key]);
    }
  }
}

function insert(el, container) {
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}
