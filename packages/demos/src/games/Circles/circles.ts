import type { World } from "@ts-ecs/core";

// Circle Behaviour Definition
export type CircleComponent = {
  center:[x:number, y:number],
  timeRemaining: number,
  element:SVGElement
};

type CircleWorld<Entity = any> = World<Entity, {circle:CircleComponent}, {time:{now:number, elapsed:number}, circleGroup:SVGElement}, never>;

export const circleBundler = <Entity>(entity:Entity, world:CircleWorld<Entity>, cx:number, cy:number, element:SVGElement) => {
  world.addComponent(entity, 'circle', {
    center: [cx, cy],
    timeRemaining: 5000,
    element,
  });
  world.getResource('circleGroup').appendChild(element);
}

export function updateCircles(world:CircleWorld){
  const {elapsed} = world.getResource("time");
  for(const entity of world.query({required: {circle:null}}).keys()){
    world.mutateComponent(entity, "circle", (circle) => {
      circle.timeRemaining -= elapsed;
    });
  }
}

const isCircleDeadQuery = { 
  required: { 
    circle: (circle:CircleComponent) => circle.timeRemaining <= 0 
  } 
};

export const cleanupCircle = (circle:CircleComponent) => {
  circle.element.remove();
}

export function cleanupCircles(world:CircleWorld){
  for(const entity of world.query(isCircleDeadQuery).keys()){
    world.removeEntity(entity);
  }
}
