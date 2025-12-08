import { SystemMethods } from "./systems.types";

export function wrapSystems<World>(world:World):SystemMethods<World>{
  const systemsMap = new Map<string, Set<(world:World) => void>>();
  const addSystem = (stage:string, handler:(world:World) => void) => {
    if(!systemsMap.has(stage)){
      systemsMap.set(stage, new Set<(world:World) => void>());
    }
    systemsMap.get(stage)!.add(handler);
    return () => {
      if(!systemsMap.has(stage)) return;
      const handlerSet = systemsMap.get(stage)!;
      handlerSet.delete(handler);
      if(handlerSet.size === 0){
        systemsMap.delete(stage);
      }
    }
  };
  
  const runStage = (stage:string) => {
    for(const handler of systemsMap.get(stage) ?? []){
      handler(world);
    }
  }



  return {
    addSystem,
    combineStages(stage, stages) {
      return addSystem(stage, () => {
        for(const stage of stages){
          runStage(stage);
        }
      })
    },
    runStage,
    hasStage(stage){
      return systemsMap.has(stage);
    }
  }
}
