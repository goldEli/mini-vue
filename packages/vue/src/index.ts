export * from "@miao-vue/runtime-dom";

import { registerCompileFunction, baseCompile } from "@miao-vue/compiler-core";
import * as runtimeDom from "@miao-vue/runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);

  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerCompileFunction(compileToFunction);
