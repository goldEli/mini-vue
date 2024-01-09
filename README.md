# mini-vue
learn vue3

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

# isProxy

* 判断是否是代理对象 isReactive 和 isReadonly 