import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING, helperMapNames } from "./runtimeHelpers";

const functionName = "render";
export function generate(ast) {
  const context = createContext(ast);

  const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"];

  const signature = args.join(", ");
  genFunctionPreamble(ast, context);

  context.push(`export function ${functionName} (${signature}){`);

  context.push(`return `);

  genNode(ast.codegenNode, context);

  context.push(`}`);

  // console.log(context);
  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const VueBinging = "Vue";

  const helpers = ast.helpers;

  if (helpers.length > 0) {
    const helpersString = ast.helpers
      .map((helper) => `${helper} as _${helper}`)
      ?.join(", ");

    context.push(`import { ${helpersString} } from '${VueBinging}'`);
    context.push(`\n`);
  }
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    default:
      break;
  }
}

function genText(node, context) {
  context.push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const n = node.content;
  context.push(`_${helperMapNames[TO_DISPLAY_STRING]}(${n.content})`);
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
