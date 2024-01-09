import { effect } from "../effect";
import { reactive, isReactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const origin = { num: 0 };
    const observed = reactive(origin);

    expect(origin).not.toBe(observed);
    expect(observed.num).toBe(0);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(origin)).toBe(false);
  });
});
