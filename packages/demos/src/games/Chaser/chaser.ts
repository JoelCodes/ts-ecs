import { makeWorldBuilder } from "@ts-ecs/core";
import type { Vec2 } from "../utils"

export type Target = {
  position:Vec2;
  element:Element
  dead:boolean;
}

export type ChaserRes<Entity = any> = {
  targetEntity?:Entity;
  position: Vec2;
  velocity: Vec2;
  theta: number;
  element:SVGElement;
}

export const makeTargetWorld = (chaserElement:SVGElement) => {
  let index = 0;
  const world = makeWorldBuilder(() => ++index)
    .addResource('time', {now: performance.now(), elapsed: 0})
    .addResource('running', true as boolean, (val) => val || world.removeAllEntities())
    .addResource<'findNewTarget', boolean>('findNewTarget', false)
    .addResource<'chaser', ChaserRes<number>>('chaser', {
      position: [0, 0],
      velocity: [0, 0],
      theta: Math.PI / 2,
      element: chaserElement
    })
    .addComponent<'target', Target>('target')
    .world();
  return world;
}

type TargetWorld = ReturnType<typeof makeTargetWorld>;

export const makeTargetBundler = (elementMaker:(position:Vec2) => Element) => {
  return (entity:any, world:TargetWorld, position: Vec2) => {
    world.addComponent(entity, "target", {
      position,
      element:elementMaker(position),
      dead: false,
    });
    world.setResource('findNewTarget', true)
  }
}

export function clearDeadTargets(world:TargetWorld){
  for(const [targetEntity, {target: {element}}] of world.query({required:{target:({dead}) => dead}}).entries()){
    element.remove();
    world.removeEntity(targetEntity);
  }
}

const sumSq = ([x1, y1]:Vec2, [x2, y2]:Vec2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function findNewTarget(world:TargetWorld){
  if(world.getResource('findNewTarget')){
    world.setResource('findNewTarget', false);
    const {position: chaserPosition} = world.getResource('chaser');
    const targets = world.query({required: {target:({dead}) => !dead}})

    if(targets.size === 0) return;
    const [[firstTargetEntity, {target:{position: targetPosition}}], ...otherTargets] = targets.entries();
    let [closestEntity, distance] = [firstTargetEntity, sumSq(chaserPosition, targetPosition)];

    for(const [nextTargetEntity, {target:{position: targetPosition}}] of otherTargets){
      const newDistance = sumSq(chaserPosition, targetPosition);
      if(newDistance < distance){
        closestEntity = nextTargetEntity;
        distance = newDistance
      }
    }
    world.mutateResource('chaser', (chaser) => {
      chaser.targetEntity = closestEntity;
    });
  }
}
const MAX_ROTATE_PER_SECOND = 0.1;

const sub = ([ax, ay]:Vec2, [bx, by]:Vec2):Vec2 => [ax - bx, ay - by];
const length = ([x, y]:Vec2) => Math.hypot(x, y);
const normalize = (v:Vec2):Vec2 => {
  const len = length(v);
  if(len === 0) return v;
  return [v[0] / len, v[1] / len];
}

const getTheta = (v:Vec2):number => {
  const len = length(v);
  if(len === 0) return NaN;
  const [nx, ny] = [v[0] / len, v[1] / len];
  const acos = Math.acos(nx);
  const asin = Math.asin(ny);
  if(asin < 0) return (Math.PI * 2) - acos;
  return acos;
}

export function navigateChaserToTarget(world:TargetWorld){
  const chaser = world.getResource('chaser');
  if(typeof chaser.targetEntity !== 'number' || !world.hasEntity(chaser.targetEntity)) return;
  const chaserTarget = world.getComponent(chaser.targetEntity, 'target');
  if(!chaserTarget[0]) {
    world.mutateResource('chaser', (chaser) => {
      delete chaser.targetEntity;
    });
  } else {
  /* Move the chaser toward its nearest target */

  //   const [,{position}] = chaserTarget
  //   const diff = sub(position, chaser.position);
  //   const diffTheta = getTheta(diff);
    
  } 
}