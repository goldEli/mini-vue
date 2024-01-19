const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (val, key) => Object.hasOwnProperty.call(val, key);
const camelize = (str) => {
    // add-foo => addFoo
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : "";
};

const Fragment = Symbol("Fragment");
function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
    return null; // 或者返回一个默认的内容
}

const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        emit: null, // 事件处理函数
        shapeFlag: getShapeFlag(type),
    };
    if (vnode.type === Fragment) {
        vnode.shapeFlag |= 64 /* ShapeFlags.FRAGMENT */;
    }
    if (vnode.type === Text) {
        vnode.shapeFlag |= 32 /* ShapeFlags.TEXT */;
    }
    if (typeof vnode.children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(vnode.children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(vnode.children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return [createVNode(Text, {}, text)];
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

const targetMap = new Map();
// 当前 effect
let activeEffect;
// 是否可以收集依赖
let shouldTrack = false;
function track(target, key) {
    if (!isTracking())
        return;
    let depMap = targetMap.get(target);
    if (!depMap) {
        depMap = new Map();
        targetMap.set(target, depMap);
    }
    let dep = depMap.get(key);
    if (!dep) {
        dep = new Set();
        depMap.set(key, dep);
    }
    // 如果收集过就不添加
    if (dep.has(activeEffect))
        return;
    trackEffects(dep);
}
function trackEffects(dep) {
    // if (!isTracking()) return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    // trigger dep
    const depMap = targetMap.get(target);
    const dep = depMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (let effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
// 用于依赖收集
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 如果被stop
        if (!this.active) {
            return this._fn();
        }
        /**
         * 每次执行完后 将 shouldTrack 关闭，避免收集到 stop 的 effect
         */
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        if (!this.active) {
            this.active = false;
            return;
        }
        clearUpEffect(this);
        if (this.onStop) {
            this.onStop();
        }
    }
}
function clearUpEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const createGetter = (isReadonly = false, shallow = false) => {
    return (target, key) => {
        const value = Reflect.get(target, key);
        if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        if (shallow) {
            return value;
        }
        if (isObject(value)) {
            return isReadonly ? readonly(value) : reactive(value);
        }
        if (!isReadonly) {
            track(target, key);
        }
        // track dep
        return value;
    };
};
const createSetter = () => {
    return (target, key, newValue) => {
        // trigger dep
        const res = Reflect.set(target, key, newValue);
        trigger(target, key);
        return res;
    };
};
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set: (target, key, newValue) => {
        console.warn(`${target} is readonly, cannot set ${newValue} to ${String(key)}`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(raw) {
    return new Proxy(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be an object`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

class RefImpl {
    constructor(_value) {
        this._value = _value;
        this.dep = new Set(); //收集依赖
        this.__isRef = true; // 标识是否是ref
        this._rawValue = _value;
        this._value = convert(_value);
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        // 如果新值和老值相等那么不触发trigger
        if (hasChanged(this._rawValue, newVal)) {
            this._value = convert(newVal);
            this._rawValue = newVal;
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(val) {
    return isObject(val) ? reactive(val) : val;
}
function ref(val) {
    return new RefImpl(val);
}
function isRef(ref) {
    return ref !== null && ref !== undefined && !!ref.__isRef;
}
function unRef(ref) {
    if (isRef(ref)) {
        return ref.value;
    }
    return ref;
}
// 代理 ref,解决 .value 问题
function proxyRef(obj) {
    /**
     * get -> isRef ? obj.value : obj
     * set -> isRef ? newValue : target[key].value = newValue
     */
    return new Proxy(obj, {
        get: (target, key) => {
            const res = Reflect.get(target, key);
            return unRef(res);
        },
        set: (target, key, newValue) => {
            /**
             * 1. 原值是ref，新值ref 直接替换
             * 2. 原值是ref, 新值不是ref 通过.value 修改
             * 3. 原值不是ref, 新值ref 直接替换
             * 4. 原值不是ref, 新值不是ref 直接替换
             */
            if (isRef(target[key]) && !isRef(newValue)) {
                target[key].value = newValue;
                return true;
            }
            return Reflect.set(target, key, newValue);
        }
    });
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

const initProps = (instance, rawProps) => {
    // 初始化props
    instance.props = rawProps || {};
};

function initSlots(instance, children) {
    // slots
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        isMounted: false,
        subTree: {},
        setupState: {},
        props: {},
        parent,
        emit: () => { },
        slots: {},
        provides: parent ? parent.provides : [],
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // 初始化props
    initProps(instance, instance.vnode.props);
    // 初始化slots
    initSlots(instance, instance.vnode.children);
    // // 初始化事件
    // setupEvent(instance);
    // 执行setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 执行setup
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // setupResult is object or function
    // TODO function
    // handle object
    if (typeof setupResult === "object") {
        instance.setupState = proxyRef(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(props, key)) {
            const ret = props[key];
            return ret;
        }
        else if (hasOwn(setupState, key)) {
            const ret = setupState[key];
            return ret;
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        return undefined;
    },
};

function createAPI(render) {
    return function createApp(App) {
        return {
            mount(rootContainer) {
                // create vnode
                const vnode = createVNode(App);
                render(vnode, rootContainer, null);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setChildrenText: hostSetChildrenText, removeChild: hostRemoveChild, removeChildren: hostRemoveChildren } = options;
    function render(vnode, container, parent) {
        patch(null, vnode, container, parent);
    }
    function patch(v1, v2, container, parent) {
        if (v2.shapeFlag & 32 /* ShapeFlags.TEXT */) {
            processText(v1, v2, container);
        }
        else if (v2.shapeFlag & 64 /* ShapeFlags.FRAGMENT */) {
            processFragment(v1, v2, container, parent);
        }
        else if (v2.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
            processElement(v1, v2, container, parent);
        }
        else if (v2.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
            processComponent(v1, v2, container, parent);
        }
    }
    function processElement(v1, v2, container, parent) {
        // update
        if (v1) {
            patchElement(v1, v2, container, parent);
        }
        else {
            mountElement(v2, container, parent);
        }
    }
    // update element
    function patchElement(v1, v2, container, parent) {
        console.log("patchElement", v1, v2, container, parent);
        const el = v1.el;
        v2.el = el;
        const oldProps = v1.props || EMPTY_OBJ;
        const nextProps = v2.props || EMPTY_OBJ;
        patchChildren(v1, v2, container, parent);
        patchProps(el, oldProps, nextProps);
    }
    function patchChildren(v1, v2, container, parent) {
        console.log(v1, v2, container, parent);
        // 老的 child Text  新的 child text
        if (v1.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ &&
            v2.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ &&
            v1.children !== v2.children) {
            hostSetChildrenText(v1.el, v1.children);
            return;
        }
        // 老的 child Text  新的 child array
        if (v1.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ &&
            v2.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 清空text
            hostSetChildrenText(v1.el, null);
            // array append 到 container
            mountChild(v2.children, v2.el, parent);
            return;
        }
        // 老的 child array 新的 child text
        if (v1.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ &&
            v2.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 清空儿子
            hostRemoveChildren(v1.el, v1.el.childNodes);
            mountText(v2, v2.el);
            // 清空text
            // hostSetChildrenText(v1.el, null);
            // array append 到 container
            // mountChild(v2.children, v2.el, parent);
            return;
        }
    }
    function patchProps(el, oldProps, nextProps) {
        if (oldProps === nextProps) {
            return;
        }
        for (const key in nextProps) {
            const prevProp = oldProps[key];
            const nextProp = nextProps[key];
            // 数据不同更新
            if (prevProp !== nextProp) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
            // nextProps undefine 移除 key
            if (nextProp === undefined) {
                hostPatchProp(el, key, prevProp, undefined);
            }
        }
        // 如果key 不存在了 移除
        for (const key in oldProps) {
            if (!(key in nextProps)) {
                hostPatchProp(el, key, undefined, undefined);
            }
        }
    }
    function processText(v1, v2, container) {
        mountText(v2, container);
    }
    function processFragment(v1, v2, container, parent) {
        mountFragment(v2, container, parent);
    }
    function mountText(v2, container) {
        const textDom = document.createTextNode(v2.children);
        v2.el = textDom;
        container.appendChild(textDom);
    }
    function mountFragment(vnode, container, parent) {
        mountChild(vnode, container, parent);
    }
    function mountElement(vnode, container, parent) {
        // create dom
        // const el = document.createElement(vnode.type);
        const el = hostCreateElement(vnode.type);
        vnode.el = el;
        const { props, children } = vnode;
        for (const key in props) {
            const value = props[key];
            hostPatchProp(el, key, null, value);
        }
        // process children
        if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChild(vnode.children, el, parent);
        }
        // container.append(el);
        hostInsert(el, container);
    }
    function mountChild(children, container, parent) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            patch(null, child, container, parent);
        }
    }
    function processComponent(v1, v2, container, parent) {
        mountComponent(v2, container, parent);
    }
    function mountComponent(vnode, container, parent) {
        // create component instance
        const instance = createComponentInstance(vnode, parent);
        instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
        // 初始化 component
        setupComponent(instance);
        // 执行组件 render 处理后续
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        effect(() => {
            if (instance.isMounted) {
                // update
                console.log("update");
                const prevSubTree = instance.subTree;
                const subTree = instance.render.call(instance.proxy);
                patch(prevSubTree, subTree, container, instance);
                instance.subTree = subTree;
                instance.vnode.el = subTree.el;
            }
            else {
                const subTree = instance.render.call(instance.proxy);
                console.log(subTree);
                patch(null, subTree, container, instance);
                instance.subTree = subTree;
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
        });
    }
    return {
        createApp: createAPI(render),
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function provide(key, val) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultVal) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // const { provides } = currentInstance ?? {};
        // console.log(currentInstance, provides, key, defaultVal);
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        if (typeof defaultVal === "function") {
            return defaultVal();
        }
        return defaultVal; // 如果没有提供，则返回默认值
    }
}

function createElement(type) {
    return document.createElement(type);
}
const isOn = (key) => {
    return /^on[A-Z]/.test(key);
};
const getEventName = (key) => {
    // onClick => click
    return key.slice(2).toLowerCase();
};
function patchProp(el, key, prevVal, nextVal) {
    if (isOn(key)) {
        const eventName = getEventName(key);
        el.addEventListener(eventName, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
            return;
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container) {
    container.append(el);
}
function setChildrenText(el, text) {
    el.textContent = text;
}
function removeChild(container, child) {
    container.removeChild(child);
}
function removeChildren(container, children) {
    // children.forEach((item, idx) => {
    //   console.log(item, idx)
    //   removeChild(container, item)
    // })
    container.innerHTML = "";
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    setChildrenText,
    removeChild,
    removeChildren,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRef, ref, renderSlots };
