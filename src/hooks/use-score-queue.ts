
'use client';

export async function queueScore(data: object) {
  const sw = await navigator.serviceWorker.ready;
  const cache = await caches.open('rq');
  const queue = JSON.parse((await cache.match('scoreQueue'))?.text() || '[]');
  queue.push(data);
  await cache.put('scoreQueue', new Response(JSON.stringify(queue)));
  await sw.sync.register('submit-score');
}
