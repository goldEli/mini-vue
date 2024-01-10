import { h } from "../../lib/guide-mini-vue.esm.js"

export const App = {
    render() {
        return h("div", {},[
            h("p", {class:"red bold"} ,"tom"),
            h("p", {class:"blue"} ,"jack"),
        ])
        // return h("div", "hi, " + this.msg)
    },
    setup() {
        return {
            msg: "mini-vue"
        }
    }
}