import { ReactiveEffect } from "./effect";


class ComputedRefImpl {
    private _effect: any;
    private _dirty = true; // 默认是脏的
    private _value: any;
    constructor(effect) {
        this._effect = new ReactiveEffect(effect, () => {
            this._dirty = true; // 当依赖的数据发生变化时，将_dirty设置为true，表示数据是脏的
        });
    }

    get value() {
        if (this._dirty) {
            this._dirty = false; // 执行effect后，将_dirty设置为false，表示数据不是脏的
            this._value = this._effect.run(); // 执行effect，获取计算属性的值
        }
        return this._value; // 执行getter
    }
}

export function computed(effect) {

    return new ComputedRefImpl(effect)
}