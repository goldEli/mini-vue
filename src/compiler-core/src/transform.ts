import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING, helperMapNames } from "./runtimeHelpers";

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
  context?.nodeTransforms?.forEach((transform) => {
    // 遍历插件列表
    transform(node);
  });

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(helperMapNames[TO_DISPLAY_STRING]);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
    default:
      break;
  }
}

function traverseChildren(node, context: Context) {
  const children = node.children || [];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context); // 递归遍历子节点
  }
}
