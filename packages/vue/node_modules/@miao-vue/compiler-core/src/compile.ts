import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformCompound } from "./transforms/transformCompound";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";

export function baseCompile(template) {
  const ast: any = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformCompound],
  });
  return generate(ast);
}
