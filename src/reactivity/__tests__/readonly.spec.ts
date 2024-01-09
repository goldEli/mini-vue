import { readonly, isReadonly } from "../reactive";

describe("readonly", () => {
  it("should call console.warn when set", () => {
    const original = { num: 1 };
    const wrapped = readonly(original);

    console.warn = jest.fn();
    wrapped.num = 2;

    expect(console.warn).toHaveBeenCalled();
  });
  it("should make nest values readonly", () => {
    const original = { num: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(wrapped).not.toBe(original);
    expect(wrapped.num).toBe(original.num);

    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
  });
  it("nest readonly", () => {
    const original = { foo: { bar: 1 }, arr: [{ baz: 2 }] };
    const observed = readonly(original);
    
    expect(isReadonly(observed)).toBe(true);
    expect(isReadonly(observed.foo)).toBe(true);
    expect(isReadonly(observed.foo.bar)).toBe(false);
    expect(isReadonly(observed.arr)).toBe(true);
    expect(isReadonly(observed.arr[0])).toBe(true);
  });
});
