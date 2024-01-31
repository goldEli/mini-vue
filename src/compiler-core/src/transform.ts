
interface Options {
  plugins?: any[];
}

interface Context {
  ast: any;
  plugins: Options["plugins"];
}

export function transform(ast, options: Options = {}) {
  const context = createContext(ast, options);
  traverseNode(ast, context);
}

function createContext(ast, options: Options = {}) {
  const plugins = options.plugins || [];
  return {
    ast,
    plugins,
  };
}

function traverseNode(node, context: Context) {
  context?.plugins?.forEach((plugin) => {
    // 遍历插件列表
    plugin(node);
  });
  traverseChildren(node, context);
}

function traverseChildren(node, context: Context) {
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    traverseNode(child, context); // 递归遍历子节点
  }
}
