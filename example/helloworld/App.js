import { h } from "../../lib/guide-mini-vue.esm.js"

export const App = {
    render() {
        console.log(this)
        return h("div", {}, [
            h("p", { class: "red bold" }, this.aaa),
            h("p", { class: "blue", id: "jack" }, "hi " + this.msg),
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