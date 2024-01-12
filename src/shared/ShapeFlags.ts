export const enum ShapeFlags {
  // 元素
  ELEMENT = 1, // 0001
  // 状态组件
  STATEFUL_COMPONENT = 1 << 1, // 0010
  // 儿子是文本
  TEXT_CHILDREN = 1 << 2, // 0100
  // 儿子是数组
  ARRAY_CHILDREN = 1 << 3, // 1000
  // 儿子是插槽
  SLOT_CHILDREN = 1 << 4, // 10000
  // 文本
  TEXT = 1 << 5,
  // Fragment
  FRAGMENT = 1 << 6,
}
