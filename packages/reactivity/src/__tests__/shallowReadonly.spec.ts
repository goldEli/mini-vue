import { isReadonly, shallowReadonly } from "../reactive";
import { vi } from "vitest";

describe("shallowReadonly", () => {
  it("should not make non-reactive properties reactive", () => {
    const original = {
      nested: {
        foo: 1,
      },
    };
    const observed = shallowReadonly(original);

    expect(isReadonly(observed)).toBe(true);
    expect(isReadonly(observed.nested)).toBe(false);
  });

  it("should call console.warn when set", () => {
    console.warn = vi.fn();

    const user = shallowReadonly({
      age: 30,
    });

    user.age = 35;

    expect(console.warn).toHaveBeenCalled();
  });
});
