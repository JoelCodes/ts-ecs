import { makeWorldBuilder, wrapSystems } from '@ts-ecs/core';
const svg = document.querySelector('#my-app')! as SVGSVGElement;

let index = 0;
const makeId = () => ++index;

type BallComponent = {
  center:[x:number, y:number],
  timeRemaining: number,
  element:SVGElement
};

const world = makeWorldBuilder(makeId)
  .addResource("time", {now:performance.now(), elapsed:0})
  .addComponent<"ball", BallComponent>("ball")
  .world();

type BallWorld = typeof world;

const makeCircleElement = (cx:number, cy:number) => {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
  circle.setAttribute('r', '50');
  circle.setAttribute('fill', 'red');
  circle.setAttribute('cx', `${cx}`);
  circle.setAttribute('cy', `${cy}`)
  svg.appendChild(circle);
  return circle;
}

const ballBundle = (entity:number, world:BallWorld, cx:number, cy:number) => {
  const element = makeCircleElement(cx, cy);
  world.addComponent(entity, 'ball', {
    center: [cx, cy],
    timeRemaining: 5000,
    element,
  })
}

function updateTimer(world:BallWorld){
  world.mutateResource('time', (time) => {
    const now = performance.now();
    time.elapsed = now - time.now;
    time.now = now;
  });
}

function updateBalls(world:BallWorld){
  const {elapsed} = world.getResource("time");
  for(const identity of world.query({required: {ball: null}}).keys()){
    world.mutateComponent(identity, "ball", (ball) => ball.timeRemaining -= elapsed);
  }
}

const isBallDead = (ball:BallComponent) => ball.timeRemaining <= 0

function cleanup(world:BallWorld){
  for(const [entity, {ball: {element}}] of world.query({
    required: {ball: isBallDead}
  }).entries()){
    element.remove();
    world.removeEntity(entity)
  }
}

const systems = wrapSystems(world);

systems.addSystem("update:timer", updateTimer);
systems.addSystem("update:balls", updateBalls);
systems.addSystem("cleanup", cleanup);
systems.addSystem("request:loop", () => {
  requestAnimationFrame(() => systems.runStage('loop'));
});

systems.combineStages("loop", ["update:timer", "update:balls", "cleanup", "request:loop"]);

systems.runStage("loop");
svg.addEventListener('click', (event) => {
  const matrix = svg.getScreenCTM()?.inverse();
  if(!matrix) return;
  console.log(matrix, event);
  const x = event.clientX * matrix.a + event.clientX * matrix.c + matrix.e;
  const y = event.clientX * matrix.b + event.clientY * matrix.d + matrix.f;
  world.createBundle(ballBundle, x, y);
})