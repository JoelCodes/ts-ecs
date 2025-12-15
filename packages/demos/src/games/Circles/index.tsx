import { makeWorldBuilder, wrapSystems } from "@ts-ecs/core";
import { cleanupBall, cleanupBalls, makeBallBundler, updateBalls, type BallComponent } from "./balls";
import { updateTime } from "../utils";
import { onCleanup } from "solid-js";


export function Circles(){
  let index = 0;
  const makeId = () => ++index;

  const world = makeWorldBuilder(makeId)
    .addResource("time", {now:performance.now(), elapsed:0})
    .addResource("count", 0)
    .addResource("running", true)
    .addComponent("ball", (ball:BallComponent) => {
      cleanupBall(ball);
      world.updateResource('count', n => n - 1);
    })
    .world();
  type BallWorld = typeof world;

  const systems = wrapSystems(world);

  systems.addSystem('update:timer', updateTime);
  systems.addSystem('update:balls', updateBalls);
  systems.addSystem('cleanup:balls', cleanupBalls);
  systems.addSystem('request:loop', (world) => {
    if(world.getResource('running')){
      requestAnimationFrame(() => systems.runStage("loop"));
    }
  });
  systems.combineStages("loop", ["update:timer", "update:balls", "cleanup:balls", "request:loop"]);

  const ballGroup = <g></g> as SVGGElement;

  const makeCircleElement = (cx:number, cy:number) => {
    const circle = <circle cx={cx} cy={cy} r='25' fill='red'/> as SVGCircleElement;
    ballGroup.appendChild(circle);
    return circle;
  }

  const ballBundler = makeBallBundler(makeCircleElement);
  const fullBundler = (entity: number, world:BallWorld, cx:number, cy:number) => {
    ballBundler(entity, world, cx, cy);
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

  systems.runStage("loop")
  return <svg on:click={onClick} viewBox="-250 -150 500 300" style="background-color: #eee;">
    {ballGroup}
  </svg>
}