import { effect } from "../effect";
import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const origin = { num: 0 };
    const observed = reactive(origin);

    expect(origin).not.toBe(observed);
  });
});
