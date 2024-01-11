import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
    render() {
        window.self = this
        return h("div", { id: 'xxx' }, [
            h(Foo, { message: 'hi son' }),
            h("p", {
                class: "blue", id: "jack", onMouseDown: () => {
                    console.log("down")
                }
            }, "hi " + this.msg),
            h("button", {
                onClick: () => {
                    console.log("clicked")
                }
            }, "click  me"),
        ])
        // return h("div", "hi, " + this.msg)
    },
    setup() {
        return {
            msg: "mini-vue",
        }
    }
}