import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";


describe('codegen', () => {
    it.only('string', () => {
       const ast = baseParse("Hello World") 
       transform(ast)

       const {code} = generate(ast)

       expect(code).toMatchSnapshot(); // 生成快照并比较
    });
    
});