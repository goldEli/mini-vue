import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
    render() {
        window.self = this
        return h("div", { id: 'xxx' }, [
            h(Foo, {
                message: 'hi son', onAdd: (num) => {
                    console.log("trigger add" + num)
                },
                onAddFoo() {
                    console.log("onAddFoo");
                },
            }),
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