export type SystemMethods<World> = {
  addSystem(stage:string, handler:(world:World) => void):() => void;
  combineStages(stage:string, stages:string[]):() => void;
  runStage(stage:string):void;
  hasStage(stage:string):boolean;
}