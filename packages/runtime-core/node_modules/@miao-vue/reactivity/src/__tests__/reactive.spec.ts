import { reactive, isReactive, isProxy } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const origin = { num: 0 };
    const observed = reactive(origin);

    expect(origin).not.toBe(observed);
    expect(observed.num).toBe(0);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(origin)).toBe(false);
  });
  it("nest reactive", () => {
    const original = { foo: { bar: 1 }, arr: [{ baz: 2 }] };
    const observed = reactive(original);

    expect(isReactive(observed)).toBe(true);
    expect(isProxy(observed)).toBe(true);
    expect(isReactive(observed.foo)).toBe(true);
    expect(isReactive(observed.foo.bar)).toBe(false);
    expect(isProxy(observed.foo.bar)).toBe(false);
    expect(isReactive(observed.arr)).toBe(true);
    expect(isReactive(observed.arr[0])).toBe(true);
  });
});
