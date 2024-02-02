const queue: any[] = [];
const watchEffectJobQueue: any[] = [];

export function addWatchEffectJobQueue(cb) {
  watchEffectJobQueue.push(cb);

  queueFlush();
}

const p = Promise.resolve();
let isFlushPending = false;
export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  if (isFlushPending) {
    return;
  }
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job = queue.shift();

  // dom 更新前
  for (let i = 0; i < watchEffectJobQueue.length; i++) {
    watchEffectJobQueue[i]();
  }

  // component render
  while (job) {
    job & job();
    job = queue.shift();
  }
}
