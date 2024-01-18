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

  // for (const key in nextProps) {
  //   if (isOn(key)) {
  //     const eventName = getEventName(key);
  //     el.addEventListener(eventName, nextProps[key]);
  //   } else {
  //     nextProps[key] && (el as HTMLElement).setAttribute(key, nextProps[key]);
  //   }
  // }
  // // value 变成了 undefined，移除key
  // for (const key in nextProps) {
  //   if (nextProps[key] === undefined) {
  //     (el as HTMLElement).removeAttribute(key);
  //   }
  // }
  // // 如果key不存在了 则删除
  // for (const key in prevProps) {
  //   console.log(key, key in nextProps)
  //   if (!(key in nextProps)) {

  //     (el as HTMLElement).removeAttribute(key);
  //   }
  // }
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
