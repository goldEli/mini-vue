export type VNode = {
    type: any
    props: any
    children: any
    el: any
}
export function createVNode(type, props?, children?) {
  const vnode: VNode = {
    type,
    props,
    children,
    el: null
  };
  return vnode;
}
