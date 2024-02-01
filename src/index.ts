export * from "./runtime-dom/index";

import { baseCompile } from "./compiler-core/src";
import { registerCompileFunction } from "./runtime-core/component";
import * as runtimeDom from "./runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);

  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerCompileFunction(compileToFunction);
