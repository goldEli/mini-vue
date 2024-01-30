import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("Parse", () => {
  describe("interpolation", () => {
    test("simple interpolation", () => {
      const ast = baseParse("{{message}}");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("element", () => {
    it("simple element div", () => {
      const ast = baseParse("<div></div>");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
      });
    });
  });

  describe('text', () => {
    it('simple text', () => {
      const ast = baseParse("message");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "message",
      });
        
    }); 
    it('simple text with interpolation', () => {
      const ast = baseParse("message{{count}}");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "message",
      });
        
    }); 
    it('simple text with element', () => {
      const ast = baseParse("message<div></div>");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "message",
      });
        
    }); 
  });
});
