import { wrapSystems } from "@ts-ecs/core"
import { loop, updateTime, type Vec2 } from "../utils";
import { onCleanup } from "solid-js";
import { findNewTarget, makeTargetBundler, makeTargetWorld, navigateChaserToTarget } from "./chaser";

export function Chaser(){
  const targetGroup = <g></g> as SVGGElement;

  function makeTargetElement([cx, cy]:Vec2){
    const circle = <circle r='10' cx={cx} cy={cy} fill='#800'/> as SVGCircleElement;
    targetGroup.appendChild(circle);
    return circle;
  }

  const chaserPlane = <polygon style={{rotate: '-90deg'}} points='20 0 -10 15 -15 0 -10 -15' stroke='white'/> as SVGPolygonElement;

  const targetBundler = makeTargetBundler(makeTargetElement);

  const world = makeTargetWorld(chaserPlane)
  
  const systems = wrapSystems(world);
  systems.addSystem('update:timer', updateTime);
  systems.addSystem('update:findTarget', findNewTarget),
  systems.addSystem('update:navigate', navigateChaserToTarget);
  systems.combineStages('update', ['update:timer', 'update:findTarget', 'update:navigate']);
  loop(systems);
  systems.runStage('loop');
  
  onCleanup(() => {
    world.setResource('running', false);
  });

  const onClick = (event:MouseEvent) => {
    const svg = event.target as SVGSVGElement;
    const matrix = svg.getScreenCTM()?.inverse();
    if(!matrix) return;
    const x = event.clientX * matrix.a + event.clientX * matrix.c + matrix.e;
    const y = event.clientX * matrix.b + event.clientY * matrix.d + matrix.f;
    world.createBundle(targetBundler, [x, y])
  }

  return (
    <svg on:click={onClick} viewBox="-250 -150 500 300" style="background-color: #666;">
      {chaserPlane}
      {targetGroup}
    </svg>
  );
}