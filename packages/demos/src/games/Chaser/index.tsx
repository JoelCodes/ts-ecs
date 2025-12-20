import { makeSystemsBuilder } from "@ts-ecs/core"
import { makeLoop, updateTime, type Vec2 } from "../utils";
import { onCleanup, onMount } from "solid-js";
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
  const systems = makeSystemsBuilder(world)
    .addStage('update')
    .systems();
  systems.pre('update', updateTime);
  systems.on('update', (world) => {
    findNewTarget(world);
    navigateChaserToTarget(world);
  });
  makeLoop(systems);
  
  onMount(() => {
    systems.runStage('update');
  });

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