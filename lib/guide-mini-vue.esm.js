function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // // 初始化props
    // initProps(instance, instance.vnode.props);
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
        if (key in setupState) {
            return setupState[key];
        }
        if (key === "$el") {
            return instance.vnode.el;
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
function mountElement(vnode, container) {
    // create dom
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { props, children } = vnode;
    // process props
    for (const key in props) {
        el.setAttribute(key, props[key]);
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
    const subTree = instance.render.call(instance.proxy);
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
