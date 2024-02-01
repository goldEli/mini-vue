import { createVNode } from "./vnode";

export function createAPI(render) {
  return function createApp(App) {
    return {
      mount(rootContainer) {
        // create vnode
        const vnode = createVNode(App);

        render(vnode, rootContainer, null);
      },
    };
  };
}
