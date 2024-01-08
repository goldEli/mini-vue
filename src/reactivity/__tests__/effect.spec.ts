import { effect } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const data = reactive({ num: 0 });

    let newNum;
    effect(() => {
      newNum = data.num + 1;
    });

    expect(newNum).toBe(1);

    data.num += 1;

    expect(newNum).toBe(2);
  });

  it("should return runner when call the effect", () => {
    // effect(fn) => return runner = fn => runner() => return

    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    // test effect fn called
    expect(foo).toBe(11);

    const result = runner();

    expect(foo).toBe(12);
    // test runner return
    expect(result).toBe("foo");
  });
});
