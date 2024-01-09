import { mutableHandlers, readonlyHandlers } from "./baseHandler";

export enum ReactiveFlags {
  IS_READONLY = "__v_isReadonly",
  IS_REACTIVE = "__v_isReactive",
}

export function reactive(raw) {
  return new Proxy(raw, mutableHandlers);
}

export function readonly(raw) {
  return new Proxy(raw, readonlyHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}
