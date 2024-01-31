interface Options {
  nodeTransforms?: any[];
}

interface Context {
  ast: any;
  nodeTransforms: Options["nodeTransforms"];
}

export function transform(ast, options: Options = {}) {
  const context = createContext(ast, options);
  traverseNode(ast, context);
  createRootCodegen(ast);
}

function createRootCodegen(root) {
    root.codegenNode = root.children[0];
}

function createContext(ast, options: Options = {}) {
  const nodeTransforms = options.nodeTransforms || [];
  return {
    ast,
    nodeTransforms,
  };
}

function traverseNode(node, context: Context) {
  context?.nodeTransforms?.forEach((transform) => {
    // 遍历插件列表
    transform(node);
  });
  traverseChildren(node, context);
}

function traverseChildren(node, context: Context) {
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context); // 递归遍历子节点
  }
}
