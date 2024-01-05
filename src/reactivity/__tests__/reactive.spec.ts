import { effect } from "../effect";
import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy pass", () => {
    const data = reactive({ num: 0 });

    let newNum;
    effect(() => {
      newNum = data.num + 1;
    });

    expect(newNum).toBe(1);

    data.num += 1;

    expect(newNum).toBe(2);
  });
});
