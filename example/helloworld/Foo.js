import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    render() {
        return h('div', { class: 'red' }, 'message from your father: ' + this.message)
    },
    setup(props) {
        // props.message = 111
        return {
            // msg: props.message
        }
    }
}