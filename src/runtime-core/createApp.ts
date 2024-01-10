import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(App) {
    return {
        mount(rootContainer) {

            // create vnode
            const vnode = createVNode(rootContainer);

            render(vnode, rootContainer)
        }
    }
}