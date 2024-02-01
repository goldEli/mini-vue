import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE, helperMapNames } from "../runtimeHelpers";


export function transformElement(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        console.log(node)

      context.helper(helperMapNames[CREATE_ELEMENT_VNODE]);
    }
}