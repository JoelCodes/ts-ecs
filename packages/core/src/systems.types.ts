export type SystemHandler<World> = (
  world:World, 
  schedule:(fn:() => void) => void,
) => void

export type SystemMethods<World, Stages extends string> = {
  runStage<Stage extends Stages>(stage:Stage):void;
  on<Stage extends Stages>(stage:Stage, handler:SystemHandler<World>):() => void;
  pre<Stage extends Stages>(stage:Stage, handler:SystemHandler<World>):() => void;
  post<Stage extends Stages>(stage:Stage, handler:SystemHandler<World>):() => void;
  clearStage<Stage extends Stages>(stage:Stage):void;
  clearAllStages():void;
}

export type SystemsBuilder<World, Stages extends string> = {
  addStage<NewStage extends string>(newStage:NewStage):SystemsBuilder<World, Stages | NewStage>;
  systems():SystemMethods<World, Stages>;
}