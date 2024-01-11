export const enum ShapeFlogs {
  // 元素
  ELEMENT = 1, // 0001
  // 状态组件
  STATEFUL_COMPONENT = 1 << 1, // 0010
  // 儿子是文本
  TEXT_CHILDREN = 1 << 2, // 0100
  // 儿子是数组
  ARRAY_CHILDREN = 1 << 3, // 1000
}
