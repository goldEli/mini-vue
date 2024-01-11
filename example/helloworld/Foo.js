import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    render(props) {
        props.message = 111
        return h('div', { class: 'red' }, 'message from your father: ' + props.message)
    },
    setup() {
        return {}
    }
}