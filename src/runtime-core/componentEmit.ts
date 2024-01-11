import { camelize, toHandlerKey } from "../shared/index";
import { ComponentInstance } from "./component";

export function emit(instance: ComponentInstance, event, ...args) {
  const { props } = instance;

  const handlerName = toHandlerKey(camelize(event));

  const handler = props[handlerName];

  handler && handler(...args);
}
