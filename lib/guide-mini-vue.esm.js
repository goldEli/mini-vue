const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasOwn = (val, key) => Object.hasOwnProperty.call(val, key);

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

const initProps = (instance, rawProps) => {
    // 初始化props
    instance.props = rawProps || {};
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // // 初始化props
    initProps(instance, instance.vnode.props);
    // // 初始化slots
    // initSlots(instance, instance.vnode.children);
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
        const setupResult = setup();
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

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (hasOwn(setupState, "$el")) {
            return instance.vnode.el;
        }
        else if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter();
        }
        return undefined;
    },
};

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    // processElement
    if (vnode.shapeFlag & 1 /* ShapeFlogs.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (vnode.shapeFlag & 2 /* ShapeFlogs.STATEFUL_COMPONENT */) {
        // processComponent
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
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
    if (vnode.shapeFlag & 4 /* ShapeFlogs.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (vnode.shapeFlag & 8 /* ShapeFlogs.ARRAY_CHILDREN */) {
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
    const subTree = instance.render.call(instance.proxy, shallowReadonly(instance.props));
    patch(subTree, container);
    console.log(subTree);
    instance.vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: getShapeFlag(type),
    };
    if (typeof vnode.children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlogs.TEXT_CHILDREN */;
    }
    else if (Array.isArray(vnode.children)) {
        vnode.shapeFlag |= 8 /* ShapeFlogs.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlogs.ELEMENT */
        : 2 /* ShapeFlogs.STATEFUL_COMPONENT */;
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

export { createApp, h };
