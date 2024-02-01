const queue = [];
const p = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending) {
        return;
    }
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job = queue.shift();
    while (job) {
        job & job();
        job = queue.shift();
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isString = (str) => typeof str === "string";
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
        key: props === null || props === void 0 ? void 0 : props.key,
        component: null,
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

// 最长连续递增序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
    if (Component.template && !Component.render) {
        instance.render = compiler(Component.template);
    }
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
let compiler;
function registerCompileFunction(_compiler) {
    compiler = _compiler;
}

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
    $props: (instance) => instance.props,
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
const shouldUpdateComponent = (prevVNode, nextVNode) => {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
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
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setChildrenText: hostSetChildrenText, remove: hostRemove, } = options;
    function render(vnode, container, parent) {
        patch(null, vnode, container, parent, null);
    }
    function patch(v1, v2, container, parent, anchor) {
        if (v2.shapeFlag & 32 /* ShapeFlags.TEXT */) {
            processText(v1, v2, container);
        }
        else if (v2.shapeFlag & 64 /* ShapeFlags.FRAGMENT */) {
            processFragment(v1, v2, container, parent);
        }
        else if (v2.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
            processElement(v1, v2, container, parent, anchor);
        }
        else if (v2.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
            processComponent(v1, v2, container, parent);
        }
    }
    function processElement(v1, v2, container, parent, anchor) {
        // update
        if (v1) {
            patchElement(v1, v2, container, parent, anchor);
        }
        else {
            mountElement(v2, container, parent, anchor);
        }
    }
    function isSameNodeType(v1, v2) {
        return v1.type === v2.type && v1.key === v2.key;
    }
    // update element
    function patchElement(v1, v2, container, parent, anchor) {
        // console.log("patchElement", v1, v2, container, parent);
        const el = v1.el;
        v2.el = el;
        const oldProps = v1.props || EMPTY_OBJ;
        const nextProps = v2.props || EMPTY_OBJ;
        patchChildren(v1, v2, el, parent, anchor);
        patchProps(el, oldProps, nextProps);
    }
    function patchChildren(v1, v2, container, parent, anchor) {
        // console.log(v1, v2, container, parent);
        // 老的 child Text  新的 child text
        if (v1.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ &&
            v2.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ &&
            v1.children !== v2.children) {
            hostSetChildrenText(v1.el, v2.children);
            return;
        }
        // 老的 child Text  新的 child array
        if (v1.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ &&
            v2.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 清空text
            hostSetChildrenText(v1.el, null);
            // array append 到 container
            mountChild(v2.children, container, parent);
            return;
        }
        // 老的 child array 新的 child text
        if (v1.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ &&
            v2.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 清空儿子
            unmountChildren(v1.children);
            mountText(v2, v2.el);
            return;
        }
        // 老的 child array 新的 child array
        if (v1.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ &&
            v2.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            patchChildrenArray(v1, v2, container, parent, anchor);
        }
    }
    function patchChildrenArray(v1, v2, container, parent, anchor) {
        let i = 0;
        let e1 = v1.children.length - 1;
        let e2 = v2.children.length - 1;
        const c1 = v1.children;
        const c2 = v2.children;
        c1.length;
        const l2 = c2.length;
        // 从左往右
        while (i <= e1 && i <= e2) {
            const c1 = v1.children[i];
            const c2 = v2.children[i];
            if (isSameNodeType(c1, c2)) {
                patch(c1, c2, container, parent, anchor);
            }
            else {
                break;
            }
            i++;
        }
        // 从右往左
        while (i <= e1 && i <= e2) {
            const c1 = v1.children[e1];
            const c2 = v2.children[e2];
            if (isSameNodeType(c1, c2)) {
                patch(c1, c2, container, parent, anchor);
            }
            else {
                break;
            }
            --e1;
            --e2;
        }
        console.log({ e1, i, e2 });
        if (i > e1) {
            // 前后新增
            const anchor = v1.children[i] ? v1.children[i].el : null;
            while (i <= e2) {
                patch(null, v2.children[i], container, parent, anchor);
                ++i;
            }
        }
        else if (i > e2) {
            // 前后删除
            while (i <= e1) {
                // patch(null, v2.children[i], v2.el, container, anchor);
                hostRemove(v1.children[i].el);
                ++i;
            }
        }
        else {
            // 中间对比
            // 中间对比
            let s1 = i;
            let s2 = i;
            // 需要处理的长度
            const toBePatched = e2 - s2 + 1;
            // 已处理的长度
            let patched = 0;
            // 新节点key对应的index
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 如果大于了需要处理的新节点，直接删除，优化性能
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (!prevChild.key) {
                    // 如果没有key 循环对比type
                    for (let j = s2; j <= e2; j++) {
                        if (isSameNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                else {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                // 如果新的不存在老的节点，删除
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
        // 前面新增
        // if (i > e1) {
        //   while (i <= e2) {
        //     patch(null, v2.children[i], container, parent, null);
        //     ++i;
        //   }
        // }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i].el;
            hostRemove(child);
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
    function mountElement(vnode, container, parent, anchor) {
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
        hostInsert(el, container, anchor);
    }
    function mountChild(children, container, parent) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            patch(null, child, container, parent, null);
        }
    }
    function processComponent(v1, v2, container, parent) {
        if (v1) {
            updateComponent(v1, v2);
        }
        else {
            mountComponent(v2, container, parent);
        }
    }
    function updateComponent(v1, v2, container, parent) {
        const instance = v1.component;
        v2.component = instance;
        if (shouldUpdateComponent(v1, v2)) {
            instance.next = v2;
            instance.update();
        }
        else {
            v2.el = v1.el;
            instance.vnode = v2;
        }
        // const next = parent.next;
        // next & next();
        // console.log("update component");
    }
    function mountComponent(vnode, container, parent) {
        // create component instance
        const instance = createComponentInstance(vnode, parent);
        vnode.component = instance;
        instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
        // 初始化 component
        setupComponent(instance);
        // 执行组件 render 处理后续
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        instance.update = effect(() => {
            console.log("effect", instance);
            if (instance.isMounted) {
                // update
                // console.log("update");
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const prevSubTree = instance.subTree;
                const subTree = instance.render.call(instance.proxy, instance.proxy);
                patch(prevSubTree, subTree, container, instance, null);
                instance.subTree = subTree;
                instance.vnode.el = subTree.el;
            }
            else {
                const subTree = instance.render.call(instance.proxy, instance.proxy);
                patch(null, subTree, container, instance, null);
                instance.subTree = subTree;
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
        }, {
            scheduler: () => {
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
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
function insert(el, container, anchor) {
    container.insertBefore(el, anchor || null);
}
function setChildrenText(el, text) {
    el.textContent = text;
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    setChildrenText,
    remove,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    toDisplayString: toDisplayString,
    nextTick: nextTick,
    createTextVNode: createTextVNode,
    createRenderer: createRenderer,
    h: h,
    renderSlots: renderSlots,
    getCurrentInstance: getCurrentInstance,
    registerCompileFunction: registerCompileFunction,
    provide: provide,
    inject: inject,
    ref: ref,
    proxyRef: proxyRef
});

var NodeTypes;
(function (NodeTypes) {
    NodeTypes["INTERPOLATION"] = "INTERPOLATION";
    NodeTypes["SIMPLE_EXPRESSION"] = "SIMPLE_EXPRESSION";
    NodeTypes["ROOT"] = "ROOT";
    NodeTypes["ELEMENT"] = "ELEMENT";
    NodeTypes["TEXT"] = "TEXT";
    NodeTypes["COMPOUND"] = "COMPOUND";
})(NodeTypes || (NodeTypes = {}));

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapNames = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

const functionName = "render";
function generate(ast) {
    const context = createContext$1(ast);
    const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"];
    const signature = args.join(", ");
    genFunctionPreamble(ast, context);
    context.push(`return function ${functionName} (${signature}){`);
    context.push(`return `);
    genNode(ast.codegenNode, context);
    context.push(`}`);
    // console.log(context);
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    var _a;
    const VueBinging = "Vue";
    const helpers = ast.helpers;
    if (helpers.length > 0) {
        const helpersString = (_a = ast.helpers
            .map((helper) => `${helper}: _${helper}`)) === null || _a === void 0 ? void 0 : _a.join(", ");
        context.push(`const { ${helpersString} } = ${VueBinging}`);
        context.push(`\n`);
    }
}
function genNode(node, context) {
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context);
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genSimpleExpression(node, context);
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context);
            break;
        case NodeTypes.COMPOUND:
            genCompound(node, context);
            break;
    }
}
function genCompound(node, context) {
    const { children } = node;
    for (let i = 0; i < children.length; ++i) {
        const child = children[i];
        if (isString(child)) {
            genStr(child, context);
        }
        else {
            genNode(children[i], context);
        }
    }
}
function genElement(node, context) {
    const { tag, children, props } = node;
    context.push(`${context.helper(CREATE_ELEMENT_VNODE)}(`);
    const str = genNullList([`'${tag}'`, props]).join(", ");
    context.push(str);
    context.push(", ");
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        genNode(child, context);
    }
    context.push(")");
}
const genNullList = (list) => {
    return list.map((item) => item || "null");
};
function genText(node, context) {
    context.push(`'${node.content}'`);
}
function genStr(str, context) {
    context.push(`${str}`);
}
function genSimpleExpression(node, context) {
    context.push(`${node.content}`);
}
function genInterpolation(node, context) {
    context.push(`${context.helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    context.push(")");
}
function createContext$1(ast) {
    const context = {
        ast,
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapNames[key]}`;
        },
    };
    return context;
}

function baseParse(source) {
    const context = createParserContext(source);
    const root = createRoot(parseChildren(context, []));
    return root;
}
const interpolationStart = "{{";
const interpolationEnd = "}}";
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        const s = context.source;
        let node;
        if (s.startsWith(interpolationStart)) {
            // 处理插值
            node = parseInterpolation(context);
        }
        else if (s.startsWith("<")) {
            if (/[a-z]/i.test(s[1])) {
                // 处理element
                node = parseElement(context, ancestors);
            }
        }
        else {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    if (s.startsWith("</")) {
        const tag = ancestors[ancestors.length - 1].tag;
        if (startWithEndTagOpen(context, tag)) {
            return true;
        }
        else {
            lackOfEndTagError(tag);
        }
        // for (let i = ancestors.length - 1; i >= 0; i--) {
        //   const tag = ancestors[i].tag;
        //   if (startWithEndTagOpen(context, tag)) {
        //     return true;
        //   }
        // }
    }
    return !s;
}
function parseText(context) {
    let lastIndex = context.source.length;
    if (context.source.indexOf(interpolationStart) !== -1) {
        lastIndex = context.source.indexOf(interpolationStart);
    }
    if (context.source.indexOf("<") !== -1) {
        const idx = context.source.indexOf("<");
        lastIndex = lastIndex < idx ? lastIndex : idx;
    }
    const content = parseTextData(context, lastIndex);
    return {
        type: NodeTypes.TEXT,
        content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element); // 用于后续的结束标签匹配
    element.children = parseChildren(context, ancestors);
    ancestors.pop(); // 移除当前元素，用于后续的兄弟元素匹配
    //   parseTag(context, TagType.End);
    if (startWithEndTagOpen(context, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        lackOfEndTagError(element.tag);
    }
    return element;
}
function lackOfEndTagError(tag) {
    throw new Error(`lack of end tag: ${tag}`);
}
function startWithEndTagOpen(context, tag) {
    const s = context.source;
    const t = s.slice(2, tag.length + 2);
    return s.startsWith("</") && t.toLowerCase() === tag.toLowerCase();
}
function parseTag(context, type) {
    const { tag, raw } = getTag(context);
    advanceBy(context, raw.length); // 跳过标签名和标签结束符
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: NodeTypes.ELEMENT,
        tag,
        children: [],
    };
}
function getTag(context) {
    const reg = /<\/?([a-z]*)>/i;
    const match = context.source.match(reg);
    if (match) {
        return {
            tag: match[1],
            raw: match[0],
        };
    }
    return {
        tag: "",
        raw: "",
    };
}
function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children,
    };
}
function parseInterpolation(context) {
    advanceBy(context, interpolationStart.length);
    const closeIndex = context.source.indexOf(interpolationEnd);
    const rawContent = parseTextData(context, closeIndex);
    const content = rawContent.trim();
    advanceBy(context, interpolationEnd.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createParserContext(source) {
    return {
        source,
    };
}

function transform(ast, options = {}) {
    const context = createContext(ast, options);
    traverseNode(ast, context);
    createRootCodegen(ast);
    ast.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    root.codegenNode = root.children[0];
}
function createContext(ast, options = {}) {
    const nodeTransforms = options.nodeTransforms || [];
    const context = {
        ast,
        nodeTransforms,
        helpers: new Map(),
        helper: (key) => {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    var _a, _b;
    let exitFns = [];
    (_a = context === null || context === void 0 ? void 0 : context.nodeTransforms) === null || _a === void 0 ? void 0 : _a.forEach((transform) => {
        // 遍历插件列表
        const exit = transform(node, context);
        if (exit) {
            exitFns.push(exit);
        }
    });
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(helperMapNames[TO_DISPLAY_STRING]);
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context);
            break;
    }
    let len = (_b = exitFns.length) !== null && _b !== void 0 ? _b : 0;
    while (len--) {
        exitFns[len](node, context);
    }
}
function traverseChildren(node, context) {
    const children = node.children || [];
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context); // 递归遍历子节点
    }
}

function isText(node) {
    return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}
function transformCompound(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            const children = node.children;
            let compoundNode;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    compoundNode = {
                        type: NodeTypes.COMPOUND,
                        children: [child],
                    };
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            compoundNode.children.push(" + ");
                            compoundNode.children.push(next);
                            children[i] = compoundNode;
                            children.splice(j, 1);
                            --j;
                        }
                        else {
                            compoundNode = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function transformElement(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        console.log(node);
        context.helper(helperMapNames[CREATE_ELEMENT_VNODE]);
    }
}

function transformExpression(node) {
    if (node.type === NodeTypes.INTERPOLATION) {
        const n = node.content;
        transformText(n);
    }
}
function transformText(node) {
    if (node.type === NodeTypes.SIMPLE_EXPRESSION) {
        node.content = `_ctx.${node.content}`;
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformCompound],
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerCompileFunction(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRef, ref, registerCompileFunction, renderSlots, toDisplayString };
