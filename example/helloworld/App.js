import { h } from "../../lib/guide-mini-vue.esm.js"

export const App = {
    render() {
        window.self = this
        return h("div", { id: 'xxx' }, [
            h("p", { class: "red bold" }, this.aaa),
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
            aaa: "123"
        }
    }
}