# mini-vue
learn vue3

[流程图](https://www.yuque.com/miaoyu-lgfuc/ul2581/xgcrdiqvupc6qe2g?singleDoc#)

* 初始化项目
* 引入jest
* babel 配置
* 配置 ts jest

# reactivity

```
const data = reactive({a:1})

let newData

effect(() => {
    newData = data.a + 1
})

data => set trigger dep
     => get  track dep
```

# effect

* effect 的参数（函数），立即执行
* get 的时候 track依赖
* set 的时候 trigger依赖
* effect 运行返回 runner
* TODO 这个effect 和 watchEffect 有什么区别？

### scheduler 参数

```js
effect(fn, { scheduler })
```

* 初始化时 fn 会被调用
* 当响应式数据 set, trigger的时候 fn 不会被调用，scheduler 会被调用

### stop 和 onStop

* stop 的时候，会从依赖中删除当前 effect
* onStop: 当 stop 执行后，会执行 onStop，处理用户逻辑

# Readonly

* 只读，不能修改
* 使用场景：把响应式变成只读
* 没啥用

# isReadonly and isReactive

* isReadonly 判断是否是只读的
* isReactive 判断是否是响应式的

# stop 修复

* stop 的时候，会从依赖中删除当前 effect
* 如果后续又有get操作，又会会重新track

# 嵌套 readonly 和 嵌套 reactive

# shallowReadonly

性能角度考虑，有时候并不希望递归处理我们的数据，这里就需要用shallowReadonly
比如 处理 props

# isProxy

* 判断是否是代理对象 isReactive 和 isReadonly 

# Ref

* 为布尔、数字、字符串创建响应式数据
* 由于不是对象无法使用 proxy，所以在内容构造一个对象，赋值给value
* 注：边缘case，当修改的值和原值相等的时候，不会触发更新

# computed

* 计算属性
* 依赖的响应式数据发生变化，才会重新计算
* 计算属性也是个 ref
* .value 时才会去获取，执行effect
* 当属性没有发生变化时，.value 调用缓存
* 当计算属性发生改变，需要重新计算缓存，利用 scheduler 把 dirty 改为 true

# component 主流程

createApp 
=> createVNode 
=> render 
=> patch => processComponent => mountComponent => createComponentInstance => setupComponent => setupStatefulComponent => handleSetupResult => finishComponentSetup
                                                                                                                      => setupRenderEffect => patch
         => processElement => mountElement => children => string => append to container
                                                       => array => patch


# rollup

```
yarn add @rollup/plugin-typescript@8.2.5 rollup@2.57.0 tslib@2.3.1
```

# process element

* type 判断是组件还是元素 如果是 div  p 等元素字符串 则处理元素
* 元素属性 分为 type props children
* props 通过 setAttribute 处理
* children 则继续调用patch 处理

processElement => mountElement => create element => append to container
                               => process props => setAttribute
                               => process children => string => append to container
                                                   => array => patch    

# setup state

render 方法需要访问 setup state

采用 instance 代理 setup state