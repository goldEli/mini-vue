import { effect } from "@miao-vue/reactivity";
import { addWatchEffectJobQueue } from "./scheduler";
import { ReactiveEffect } from "../../reactivity/src/effect";

export function watchEffect(fn) {
  let context = {
    cleanup: null as any,
  };
  const onCleanup = (cb) => {
    console.log("onCleanup");
    context.cleanup = cb; // 保存回调函数
    // context.cleanup();
  };
  const effect = new ReactiveEffect(
    () => {
      console.log("effect run");
      fn(onCleanup);
    },
    () => {
      addWatchEffectJobQueue(() => {
        context.cleanup?.();
        effect.run();
      });
    }
  );

  const stop = () => {
    context.cleanup?.();
    effect.stop();
  };

  effect.run();
  return stop;
}
