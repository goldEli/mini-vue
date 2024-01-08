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