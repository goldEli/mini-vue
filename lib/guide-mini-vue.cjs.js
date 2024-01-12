'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
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
        instance.setupState = setupResult;
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
            return props[key];
        }
        else if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        return undefined;
    },
};

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (vnode.shapeFlag & 32 /* ShapeFlags.TEXT */) {
        processText(vnode, container);
    }
    else if (vnode.shapeFlag & 64 /* ShapeFlags.FRAGMENT */) {
        processFragment(vnode, container);
    }
    else if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function processText(vnode, container) {
    mountText(vnode, container);
}
function processFragment(vnode, container) {
    mountFragment(vnode, container);
}
function mountText(vnode, container) {
    const textDom = document.createTextNode(vnode.children);
    vnode.el = textDom;
    container.appendChild(textDom);
}
function mountFragment(vnode, container) {
    mountChild(vnode, container);
}
const isOn = (key) => {
    return /^on[A-Z]/.test(key);
};
const getEventName = (key) => {
    // onClick => click
    return key.slice(2).toLowerCase();
};
function mountElement(vnode, container) {
    // create dom
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { props, children } = vnode;
    // process props
    for (const key in props) {
        if (isOn(key)) {
            const eventName = getEventName(key);
            el.addEventListener(eventName, props[key]);
        }
        else {
            el.setAttribute(key, props[key]);
        }
    }
    // process children
    if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChild(vnode, el);
    }
    container.append(el);
}
function mountChild(vnode, container) {
    vnode.children.forEach((child) => {
        patch(child, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // create component instance
    const instance = createComponentInstance(vnode);
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    // 初始化 component
    setupComponent(instance);
    // 执行组件 render 处理后续
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render.call(instance.proxy);
    patch(subTree, container);
    instance.vnode.el = subTree.el;
}

function createApp(App) {
    return {
        mount(rootContainer) {
            // create vnode
            const vnode = createVNode(App);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.renderSlots = renderSlots;
