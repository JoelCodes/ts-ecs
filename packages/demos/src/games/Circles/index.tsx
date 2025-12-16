import { makeWorldBuilder, wrapSystems } from "@ts-ecs/core";
import { cleanupCircle, cleanupCircles, makeCircleBundler, updateCircles, type CircleComponent } from "./circles";
import { updateTime } from "../utils";
import { onCleanup, onMount } from "solid-js";


export function Circles(){
  let index = 0;
  const makeId = () => ++index;

  const world = makeWorldBuilder(makeId)
    .addResource("time", {now:performance.now(), elapsed:0})
    .addResource("count", 0, (n) => { countText.innerHTML = `${n}`; })
    .addResource("running", true)
    .addComponent("circle", (circle:CircleComponent) => {
      cleanupCircle(circle);
      world.updateResource('count', n => n - 1);
    })
    .world();
  type CircleWorld = typeof world;

  const systems = wrapSystems(world);

  systems.addSystem('update:timer', updateTime);
  systems.addSystem('update:circles', updateCircles);
  systems.addSystem('cleanup:circles', cleanupCircles);
  systems.addSystem('request:loop', (world) => {
    if(world.getResource('running')){
      requestAnimationFrame(() => systems.runStage("loop"));
    }
  });
  systems.combineStages("loop", ["update:timer", "update:circles", "cleanup:circles", "request:loop"]);

  const circleGroup = <g></g> as SVGGElement;
  const countText = <text text-anchor="middle" fill='blue' font-size="100">0</text> as SVGTextElement

  const makeCircleElement = (cx:number, cy:number) => {
    const circle = <circle cx={cx} cy={cy} r='25' fill='red'/> as SVGCircleElement;
    circleGroup.appendChild(circle);
    return circle;
  }

  const circleBundler = makeCircleBundler(makeCircleElement);
  const fullBundler = (entity: number, world:CircleWorld, cx:number, cy:number) => {
    circleBundler(entity, world, cx, cy);
    world.updateResource('count', n => n + 1)
  }
  

  const onClick = (event:MouseEvent) => {
    const svg = event.target as SVGSVGElement;
    const matrix = svg.getScreenCTM()?.inverse();
    if(!matrix) return;
    const x = event.clientX * matrix.a + event.clientX * matrix.c + matrix.e;
    const y = event.clientX * matrix.b + event.clientY * matrix.d + matrix.f;
    world.createBundle(fullBundler, x, y);
  }

  onCleanup(() => {
    world.setResource("running", false);
    world.removeAllEntities();
  });

  onMount(() => {
    systems.runStage("loop");
  }); 

  return <svg on:click={onClick} viewBox="-250 -150 500 300" style="background-color: #eee;">
    {circleGroup}
    {countText}
  </svg>
}