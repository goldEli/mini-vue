import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helperMapNames,
} from "./runtimeHelpers";

interface Options {
  nodeTransforms?: any[];
}

interface Context {
  ast: any;
  nodeTransforms: Options["nodeTransforms"];
  helpers: Map<string, 1>;
  helper: (key: string) => void;
}

export function transform(ast, options: Options = {}) {
  const context = createContext(ast, options);
  traverseNode(ast, context);
  createRootCodegen(ast);
  ast.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root) {
  root.codegenNode = root.children[0];
}

function createContext(ast, options: Options = {}) {
  const nodeTransforms = options.nodeTransforms || [];
  const context = {
    ast,
    nodeTransforms,
    helpers: new Map(),
    helper: (key) => {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function traverseNode(node, context: Context) {
  let exitFns:any[] = []
  context?.nodeTransforms?.forEach((transform) => {
    // 遍历插件列表
    const exit = transform(node, context);
    if (exit) {
      exitFns.push(exit);
    }
  });

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(helperMapNames[TO_DISPLAY_STRING]);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }

  let len = exitFns.length ?? 0
  while(len--) {
    exitFns[len](node, context);
  }
}

function traverseChildren(node, context: Context) {
  const children = node.children || [];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context); // 递归遍历子节点
  }
}
