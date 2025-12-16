import type { World } from "@ts-ecs/core";

// Circle Behaviour Definition
export type CircleComponent = {
  center:[x:number, y:number],
  timeRemaining: number,
  element:SVGElement
};

type CircleWorld<Entity = any> = World<Entity, {circle:CircleComponent}, {time:{now:number, elapsed:number}}, never>;

export const makeCircleBundler = (elementCreator:(cx:number, cy:number) => SVGElement) => 
  <Entity>(entity:Entity, world:Pick<CircleWorld<Entity>, 'addComponent'| 'updateResource'>, cx:number, cy:number) => {
    world.addComponent(entity, 'circle', {
      center: [cx, cy],
      timeRemaining: 5000,
      element:elementCreator(cx, cy)
    });
  }

export function updateCircles(world:CircleWorld){
  const {elapsed} = world.getResource("time");
  for(const entity of world.query({required: {circle:null}}).keys()){
    world.mutateComponent(entity, "circle", (circle) => {
      circle.timeRemaining -= elapsed;
    });
  }
}
const isCircleDead = (circle:CircleComponent) => circle.timeRemaining <= 0
const isCircleDeadQuery = {required: { circle: isCircleDead}};

export const cleanupCircle = (circle:CircleComponent) => {
  circle.element.remove();
}

export function cleanupCircles(world:CircleWorld){
  for(const entity of world.query(isCircleDeadQuery).keys()){
    world.removeEntity(entity);
  }
}
