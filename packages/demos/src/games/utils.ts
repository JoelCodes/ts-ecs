import type { SystemMethods, World } from "@ts-ecs/core";

export type Vec2 = [x:number, y:number];

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

export function loop<LoopWorld extends World<any, Record<string, any>, {running:boolean}, string>>(systems:SystemMethods<LoopWorld>, updateStageName:string = 'update', loopStageName:string = 'loop'){
  systems.addSystem(loopStageName, (world) => {
    if(world.getResource('running')){
      systems.runStage(updateStageName);
      requestAnimationFrame(() => { systems.runStage(loopStageName) })
    }
  });
}