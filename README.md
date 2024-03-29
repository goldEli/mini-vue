# mini-vue
learn vue3

[流程图](https://www.yuque.com/miaoyu-lgfuc/ul2581/xgcrdiqvupc6qe2g?singleDoc#)

# 总结

vue 响应式驱动 ui，ui 通过 template 来描述

整个过程，依赖几个核心包 complier，runtime-dom,runtime-core,reactivity

* complier 编译 template 生成 render 函数
* runtime-dom vnode挂载到页面
* runtime-core 数据和dom 关联
* reactivity 实现响应式

```
vue -> runtime-dom -> runtime-core -> reactivity
    -> compiler
```

complier 可以脱离vue运行时，好处是打包工具可以提前将 template 编译成 render 函数

#### reactivity 实现响应式

* reactive 数据劫持
* ref 基础数据劫持
* computed 计算属性
  * 维护一个dirty状态，判断是否使用缓存
* effect 
  * get 收集依赖
  * set 触发依赖
  * scheduler 处理依赖触发时机，比如异步更新
  * stop 删除依赖
* 其他
  * shallowReadonly 处理 props

#### runtime-core 

数据和dom 关联

* setup 
  * 初始化数据方法
* render
  * 创建虚拟dom
  * 拿到setup的数据
* patch 
  * 基于不同的vnode 进行处理
* 数据更新后，会触发依赖，重新执行render，拿到新的vnode，然后进行patch
* diff 对比
  * type 不同直接替换
  * 对比儿子
    * 双端算法，找到哪些儿子不一样
    * 前后新增儿子
    * 先后添加儿子
    * 中间的儿子发生变化
      * 删除 添加
      * 移动
        * 最长递增子序列，基于此进行移动
  * 对比属性
    * 删除 添加

#### runtime-dom

* 处理dom 操作
* 将 runtime-core 的 vnode 转换成 dom, 挂载到页面

#### compiler

template => ast => transform ast => generate code => render

* parse
  * 状态机原理将 template 编译成 render 函数
  * 遇到 < 处理元素节点
  * 遇到 {{ 处理插值节点
  * 其他情况 处理成文本节点

* transform
  * 遍历处理ast
  * 处理文本 插值等
  * 创建联合类型
* generate
  * 遍历ast
  * 创建render 函数




  


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
* 这个effect 和 watchEffect 有什么区别？

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

instance 挂载一个proxy属性，将proxy绑定到render函数，render 内部调用this,实际上是访问到 proxy，拦截get 基于 key 拿到 setup的state

# $el

* for components with a single root element, $el will point to that element
* 同样通过 proxy 拦截 key 为 $el 的 get 返回 root element

# shapeFlags

* 标记当前元素是组件还是元素
* 标记当前元素儿子是文本还是数组
* 通过二进制的方式来描述类型
  * 复合类型用一个值来表示
  * 使用起来更高效
  * 但是可读性更低

| 表示都是0才为0
& 表示都是1才为1 

组件 元素 儿子文本 儿子数组
0101 表示元素和儿子数据
是否是元素 0101 & 0100 = 0100 true

# 事件注册

检测 props 的参数 on + Event
比如onClick 转换成 window.addEventListener('click', () => {})
onClick => Click => click

# props

* 创建 instance 的时候，将 props 挂载到 instance.props
* 调用 setup 时，将props作为参数传入
* props,shadow readonly 不能被修改，如果被修改报错提醒
* 在 render 方法可以直接通过this 访问props属性 这里需要通过 instance.proxy 代理

# emit

* 儿子调用父组件的自定义事件
* emit 挂载到 instance, 通过 props 拿到父组件定义的自定义事件
* 在执行 setup 时候传入 emit
* 事件名处理  onAdd -> add   onAddFoo -> add-foo

# slot

* 具名插销，没有名字的插销默认default名字
* 插槽作用域

1. 创建虚拟节点：定义插槽类型，如果是组件且children是对象
2. 初始化插槽：将插槽对象挂载到instance.slots
3. 调用renderSlot方法，将插槽对象通过代理获取到，然后作为参数传入

# Text 

增加 TEXT 类型，CHILDREN_TEXT 其实就没有用了

# Fragment

* 创建虚拟节点 避免用div包裹

# getCurrentInstance

getCurrentInstance 在 setup 中调用，所以在 setup 执行前，赋值 currentInstance
当setup 执行完，currentInstance 置为null

# provide inject

* 父组件 provider 子组件 inject,inject 取不到可以设置默认值
* 子组件先找父亲，再找爷爷，再找曾爷爷，直到找到为止，类似于js原型链的，可以基于此实现跨层级读取
* 设计很巧妙

# customer render

vue3 高度模块化，编译 运行时 dom渲染 都进行了分离。可以将dom 渲染替换成自定义的
比如可以把dom渲染替换成渲染到canvas，用 PixiJS 这个库来操作canvas的渲染

# element 流程搭建

1. 创建虚拟dom =》 创建真实节点
2. 更新数据  =》 更新虚拟dom
3. 对比新旧虚拟dom =》 update

利用 effect 收集虚拟dom创建方法，数据变化后update

# update props

1. 原来的props.key 的值被修改了 =》 触发update
2. 原来的props.key 的值被设置为了undefind =》 触发remove
3. 原来的props.key 的key不存在了 =》 触发remove

# update children

有四种情况

1. 原来的children 是 text，新children 是 array
  * 选清空text 然后 mountChildren
2. 原来的children 是 array，新children 是 text
  * unmountChildren 然后 setText
3. 原来的children 是 text，新children 是 text 
  * 直接setText
4. 原来的children 是 array，新children 是 array
  * 两端对比算法

# 两端对比算法

* 基于场景来选择算法
* 基于children 经常被修改的场景，采用双指针算法
* 通常是某个部分被修改了，两端对比可以快速找到修改的部分，再后续的循环遍历中 只针对这部分进而提升算法效率
* 场景：
  * 头部添加更新删除
  * 尾部添加更新删除
  * 中间添加更新删除
* 找到中间修改的区域
  * 删除
  * 添加
  * 最长递增子序列，来控制dom移动

三个指针
prevchildren: a b c
                  e1

nextchildren: a b
              i e2 

### 尾部添加更新

ab
abc

i=0 e1=1 e2=2
i=1 e1=1 e2=2
i=2 e1=1 e2=2

i > e1 

### 头部添加更新
ab
cab

i=0 e1=1 e2=2
i=0 e1=0 e2=1
i=0 e1=-1 e2=0

i > e1 

### 删除尾部

abc
ab

i=0 e1=2 e2=1
i=1 e1=2 e2=1
i=2 e1=2 e2=1

i <= e1

### 删除头部
abc
bc

i=0 e1 = 2 e2 = 1
i=0 e1 = 1 e2 = 0
i=0 e1 = 0 e2 = -1

i <= e1

### 处理中间

a,b,(c,d,e,z),f,g
a,b,(d,c,y,e),f,g

找到中间不同的区域
老的 s1 e1 0 3
新的 s2 e2 0 3

1. 删除不存在的
   1. 新的存入map，key -> index
   2. 遍历老的，如果map中没有，则删除
2. 存在则patch，判断children props的区别
3. 从后遍历新的
   1. 添加
   2. 移动

newIndexToOldIndexMap=[4,3,0,5]
最长递归子序列下标  3 5 => [1, 3] 


# 组件更新

update component => trigger effect => newSubTree 和 oldSubTree 进行patch

1. effect 返回的 run 方法存到instance.update
2. componentUpdate trigger  instance.update, 修改 instance 的props，生成新的 subTree
3. patch 对比 newSubTree 和 oldSubTree

# nextTick

1. 业务场景中，可能需要多次修改data, 会触发多次更新，造成性能问题
2. 对于页面的呈现，我们只需要等data修改完毕后再进行更新，不管修改多少次
3. 同步代码结束后，在微任务中执行更新，实现异步更新

# compiler

字符串 -》 render函数

字符串很难进行遍历以及简历关系，所以需要将字符串转换成语法树, 然后再通过语法树转换成render函数

1. 解析模板，生成ast语法树
2. transform 遍历ast语法树，对语法树进行改造，得到新的ast语法树
3. generate 遍历ast语法树，生成render函数


例子：

```text
<div>hi,{{message}}</div>


状态机 --- 遇到<符号 --> parseElement ----> parseTag -----> 状态机 
       ----遇到\{\{符号----> parseInterpolation ----> 状态机 
       ---- 遇到非其他两种情况 ---> parseText -------> 状态机

root 
  - element
    - children
      - text
      - parseInterpolation
```

## parse interpolation

```
{{message}}
```

## parse element

```
<div></div>
```

## parse text

```
message
```

# transform 

* 遍历节点
* 通过插件机制去修改ast语法树

## 处理 string 类型


```
Hello World

=> 

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return "Hello World"
}
```

# 模块依赖

```
                compiler-sfc 
               |           |
               v           v
vue -> compiler-dom -> complier-core

    -> runtime-dom -> runtime-core -> reactivity
```

# monorepo

好处
* 共用配置，多个项目不用重复配置
* 项目之间调用更方便
* 版本管理更方便，某一个版本升级，不用每一个库都升级
* build  发版 更方便

缺点
* 项目权限管理不能独立控制某个库

## pnpm

* 软链接节约磁盘空间
* 非扁平结构，nodemodule 展示更清晰, 也可以规避某些包冲突问题

1. create pnpm-workspace.yaml
2. 每个包都需要一个 package.json pnpm init -y
  * 执行项目安装 pnpm i @miao-vue/shared --filter @miao-vue/reactivity
  * 修改tsconfig.json, paths
3. 根目录安装  pnpm i vitest -D -w

# watchEffect

* 在dom挂载前调用，effect 与 dom 无关
* 依赖发生变化会调用 watchEffect
* onCleanup 会在 watchEffect 之前调用, 初始化不调用
* stop 停止监听,调用 onCleanup







 




