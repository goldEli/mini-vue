import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, ref, unRef, proxyRef } from "../ref";

describe("ref", () => {
  it("basic", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("should be reactive", () => {
    const data = ref(1);
    let dummy;
    let count = 0;
    effect(() => {
      count++;
      dummy = data.value;
    });

    expect(count).toBe(1);
    expect(dummy).toBe(1);

    data.value = 2;
    expect(count).toBe(2);
    expect(dummy).toBe(2);

    // set the same value, should not trigger
    data.value = 2;
    expect(count).toBe(2);
    expect(dummy).toBe(2);
  });
  it("should make nested properties reactive", () => {
    const obj = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = obj.value.count;
    });
    expect(dummy).toBe(1);
    obj.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("isRef", () => {
    const a = ref(1);
    const data = reactive({ b: 1 });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(data)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);

    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRef", () => {
    const user = {
      age: ref(1),
      name: "zhangsan",
    };
    const proxyUser = proxyRef(user);

    expect(user.age.value).toBe(1);
    expect(proxyUser.age).toBe(1);
    expect(proxyUser.name).toBe("zhangsan");

    proxyUser.age = 2;
    expect(user.age.value).toBe(2);
    expect(proxyUser.age).toBe(2);

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
