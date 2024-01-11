import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    render(props) {
        return h('div', { class: 'red' }, 'message from your father: ' + props.message)
    },
    setup() {
        return {}
    }
}