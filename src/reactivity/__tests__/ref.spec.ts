import { effect } from "../effect";
import { ref } from "../ref";

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

    data.value = 2
    expect(count).toBe(2);
    expect(dummy).toBe(2);

    // set the same value, should not trigger
    data.value = 2
    expect(count).toBe(2);
    expect(dummy).toBe(2);
  });
  it('should make nested properties reactive', () => {
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
});
