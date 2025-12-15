import type { World } from "@ts-ecs/core";

export type TimeResource = {
  now:number;
  elapsed:number;
}

type TimeWorld = World<any, Record<string, any>, {time:TimeResource}, string>;
export function updateTime(world:Pick<TimeWorld, 'mutateResource'>){
  world.mutateResource("time", (time) => {
    const now = performance.now();
    time.elapsed = now - time.now;
    time.now = now;
  });
}