import { NodeTypes } from "../ast";

function isText(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}

export function transformCompound(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
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
            compoundNode.children.push(next);
            children[i] = compoundNode;
            children.splice(j, 1);
            --j;
          } else {
            compoundNode = undefined;
            break;
          }
        }
      }
    }
  }
}
