import { readonly } from "../reactive";

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

  });
});
