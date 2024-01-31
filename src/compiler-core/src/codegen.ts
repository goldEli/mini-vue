import { NodeTypes } from "./ast";

const functionName = "render";
export function generate(ast) {
  const context = createContext(ast);

  const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"];

  const signature = args.join(", ");

  context.push(`export function ${functionName} (${signature}){`);

  context.push(`return `);

  console.log(ast);
  genNode(ast.codegenNode, context);

  context.push(`}`);

  console.log(context);
  return {
    code: context.code,
  };
}

function genNode(node, context) {
  if (node.type === NodeTypes.TEXT) {
    context.push(`'${node.content}'`);
  }
}

function createContext(ast) {
  const context = {
    ast,
    code: "",
    push(source) {
      context.code += source;
    },
  };
  return context;
}
