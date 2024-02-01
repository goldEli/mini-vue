import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helperMapNames,
} from "./runtimeHelpers";

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
    case NodeTypes.SIMPLE_EXPRESSION:
      genSimpleExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND:
      genCompound(node, context);
      break;
    default:
      break;
  }
}

function genCompound(node, context) {
  const { children } = node;
  for (let i = 0; i < children.length; ++i) {
    const child = children[i];

    if (isString(child)) {
      genStr(child, context);
    } else {
      genNode(children[i], context);
    }
  }
}

function genElement(node, context) {
  const { tag, children, props } = node;
  context.push(`${context.helper(CREATE_ELEMENT_VNODE)}(`);
  const str = genNullList([`'${tag}'`, props]).join(", ");
  context.push(str);
  context.push(", ");
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    genNode(child, context);
  }
  context.push(")");
}

const genNullList = (list) => {
  return list.map((item) => item || "null");
};

function genText(node, context) {
  context.push(`'${node.content}'`);
}

function genStr(str, context) {
  context.push(`${str}`);
}

function genSimpleExpression(node, context) {
  context.push(`${node.content}`);
}

function genInterpolation(node, context) {
  context.push(`${context.helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);

  context.push(")");
}

function createContext(ast) {
  const context = {
    ast,
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapNames[key]}`;
    },
  };
  return context;
}
