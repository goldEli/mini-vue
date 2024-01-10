export type VNode = {
    type: any
    props: any
    children: any
}
export function createVNode(type, props?, children?) {
  const vnode: VNode = {
    type,
    props,
    children,
  };
  return vnode;
}