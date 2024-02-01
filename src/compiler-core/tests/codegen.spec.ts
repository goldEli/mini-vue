import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";


describe('codegen', () => {
    it('string', () => {
       const ast = baseParse("Hello World") 
       transform(ast)

       const {code} = generate(ast)

       expect(code).toMatchSnapshot(); // 生成快照并比较
    });


    it('interpolation', () => {
       const ast = baseParse("{{message}}") 
       transform(ast, {
         nodeTransforms: [transformExpression]
       })
       const {code} = generate(ast)

       expect(code).toMatchSnapshot(); // 生成快照并比较
    });


    it('compound', () => {
       const ast = baseParse("<div>hi,{{message}}</div>") 
       transform(ast, {
         nodeTransforms: [transformElement]
       })
       console.log(ast)
       const {code} = generate(ast)

       expect(code).toMatchSnapshot(); // 生成快照并比较
    });
    
});