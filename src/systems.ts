export type SystemMethods<World> = {
  addSystem(stage:string, handler:(world:World) => void):() => void;
  orderSystem(stage:string, stages:string[]):() => void;
  runSystem(stage:string):void;
  hasStage(stage:string):boolean;
}

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
  
  const runSystem = (stage:string) => {
      for(const handler of systemsMap.get(stage) ?? []){
        handler(world);
      }
    }
  return {
    addSystem,
    orderSystem(stage, stages) {
      return addSystem(stage, () => {
        for(const stage of stages){
          runSystem(stage);
        }
      })
    },
    runSystem,
    hasStage(stage){
      return systemsMap.has(stage);
    }
  }
}
