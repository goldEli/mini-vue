import { NodeTypes } from "../ast";


export function transformElement(node) {
    if (node.type === NodeTypes.ELEMENT) {
        console.log(node)
    }
}