import { effect } from "@miao-vue/reactivity";
import { addWatchEffectJobQueue } from "./scheduler";
import { ReactiveEffect } from "../../reactivity/src/effect";

export function watchEffect(fn) {
  let cleanup;
  const onCleanup = (cb) => {
    cleanup = cb; // 保存回调函数
    effect.onStop = cb;
  };
  const getter = () => {
    if (cleanup) {
      cleanup();
    }
    fn(onCleanup);
  };
  const job = () => {
    effect.run();
  };
  const effect = new ReactiveEffect(getter, () => {
    addWatchEffectJobQueue(job);
  });

  const stop = () => {
    effect.stop();
  };

  effect.run();
  return stop;
}
