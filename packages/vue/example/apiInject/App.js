// 组件 provide 和 inject 功能
import { h, provide, inject } from "../../lib/guide-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "爷爷");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
    // return h("div", {}, [h("p", {}, "Provider"), h(Consumer)]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "爸爸");
    const foo = inject("foo");

    return {
      foo,
    };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `ProviderTwo foo:${this.foo}`),
      h(Consumer),
    ]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", () => "bazDefault");

    return {
      foo,
      bar,
      baz,
    };
  },

  render() {
    return h("div", {}, [
      h("p", {}, `Consumer: - ${this.foo} - ${this.bar}-${this.baz}`),
      h(Consumer1)
    ]);
  },
};

const Consumer1 = {
  name: "Consumer1",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // const baz = inject("baz", () => "bazDefault");

    return {
      foo,
      bar,
    };
  },

  render() {
    return h("div", {}, `Consumer1: - ${this.foo} - ${this.bar}`);
  },
};

export default {
  name: "App",
  setup() { },
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};