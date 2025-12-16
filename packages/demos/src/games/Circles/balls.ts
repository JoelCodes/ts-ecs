import type { World } from "@ts-ecs/core";

// Ball Behaviour Definition
export type BallComponent = {
  center:[x:number, y:number],
  timeRemaining: number,
  element:SVGElement
};

type BallWorld<Entity = any> = World<Entity, {ball:BallComponent}, {time:{now:number, elapsed:number}}, never>;

export const makeBallBundler = (elementCreator:(cx:number, cy:number) => SVGElement) => 
  <Entity>(entity:Entity, world:Pick<BallWorld<Entity>, 'addComponent'| 'updateResource'>, cx:number, cy:number) => {
    world.addComponent(entity, 'ball', {
      center: [cx, cy],
      timeRemaining: 5000,
      element:elementCreator(cx, cy)
    });
  }

export function updateBalls(world:BallWorld){
  const {elapsed} = world.getResource("time");
  for(const entity of world.query({required: {ball:null}}).keys()){
    world.mutateComponent(entity, "ball", (ball) => {
      ball.timeRemaining -= elapsed;
    });
  }
}
const isBallDead = (ball:BallComponent) => ball.timeRemaining <= 0
const isBallDeadQuery = {required: { ball: isBallDead}};

export const cleanupBall = (ball:BallComponent) => {
  ball.element.remove();
}

export function cleanupBalls(world:BallWorld){
  for(const entity of world.query(isBallDeadQuery).keys()){
    world.removeEntity(entity);
  }
}
