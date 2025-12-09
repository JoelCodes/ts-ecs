import { World } from "@ts-ecs/core";

export type TimeResource = {
  now: DOMHighResTimeStamp;
  elapsed: number;
}

export function updateNow(world:World<any, {}, {"time": TimeResource}>){
  world.mutateResource("time", (time) => {
    const now = performance.now();
    time.elapsed = now - time.now;
    time.now = now;
  });
}