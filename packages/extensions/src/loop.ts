import { SystemMethods, World } from "@ts-ecs/core";

export function makeLoopRequestor(systems:SystemMethods<World<any, {}, {running:boolean}>>, loopStageName = "loop"){
  return (world:World<any, {}, {running:boolean}>) => {
    if(world.getResource("running")){
      requestAnimationFrame(() => systems.runStage(loopStageName));
    }
  }
}