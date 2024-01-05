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
     => get  trace dep
```