import { SystemHandler, SystemMethods, SystemsBuilder } from "./systems.types";

export type StageHandlerSet<World> = Record<"on"|"pre"|"post", Set<SystemHandler<World>>>

export function makeSystemManager<World, Stages extends string>(
  world:World,
  stageHandlers: Record<Stages, StageHandlerSet<World>>
):SystemMethods<World, Stages>{
  return {
    on(stage, handler) {
      stageHandlers[stage]?.on.add(handler);
      return () => {
        stageHandlers[stage]?.on.delete(handler)
      }
    },
    pre(stage, handler){
      stageHandlers[stage]?.pre.add(handler);
      return () => {
        stageHandlers[stage]?.pre.delete(handler);
      }
    },
    post(stage, handler){
      stageHandlers[stage]?.post.add(handler);
      return () => {
        stageHandlers[stage]?.post.delete(handler);
      }
    },
    runStage(stage){
      const postPost = new Set<() => void>();
      const schedule = (fn:() => void) => { postPost.add(fn); };
      const stageHandlerSets = stageHandlers[stage];
      if(!stageHandlerSets) return;
      for(const handler of stageHandlerSets.pre){
        handler(world, schedule);
      }
      for(const handler of stageHandlerSets.on){
        handler(world, schedule);
      }
      for(const handler of stageHandlerSets.post){
        handler(world, schedule);
      }
      for(const handler of postPost){
        handler();
      }
    },
    clearStage(stage){
      const stageHandlerSets = stageHandlers[stage];
      if(!stageHandlerSets) return;
      stageHandlerSets.pre.clear();
      stageHandlerSets.on.clear();
      stageHandlerSets.post.clear();
    },
    clearAllStages() {
      for(const value of Object.values(stageHandlers) as Iterable<StageHandlerSet<unknown>>){
        value.pre.clear();
        value.on.clear();
        value.post.clear();
      }
    },
  }
}

export function makeStageHandlerSet<World>():StageHandlerSet<World>{
  return {
    on: new Set<SystemHandler<World>>(),
    pre: new Set<SystemHandler<World>>(),
    post: new Set<SystemHandler<World>>(),
  }
}

export function makeSystemsBuilder<World, Stages extends string = never>(world:World, stageHandlers:Record<Stages, StageHandlerSet<World>>):SystemsBuilder<World, Stages>{
  return {
    addStage<NewStage extends string>(newStage:NewStage) {
      return makeSystemsBuilder<World, Stages | NewStage>(
        world, {
        ...stageHandlers,
        [newStage]: makeStageHandlerSet<World>()
      } as Record<Stages | NewStage, StageHandlerSet<World>>);
    },
    systems() {
      return makeSystemManager(world, stageHandlers);
    },
  }
}