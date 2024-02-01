import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    render() {
        return h('div', { class: 'red' }, [
            h('p', { class: 'red' }, 'message from your father: ' + this.message),
            h('button', {
                onClick: this.onTrigger
            }, '触发自定义事件')
        ])
    },
    setup(props, {emit}) {
        // props.message = 111
        return {
            // msg: props.message
            onTrigger: () => {
                console.log('触发自定义事件')
                // emit('onAdd')
                emit('add', 123)
                emit('add-foo')
            }
        }
    }
}