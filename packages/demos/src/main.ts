import { makeWorldBuilder, wrapSystems } from '@ts-ecs/core';
const $svg = document.querySelector('#my-app')! as SVGSVGElement;
const $ballGroup = $svg.querySelector('#ball-group') as SVGGElement;
const $text = $svg.querySelector('#count-text') as SVGTextElement;

const makeCircleElement = (cx:number, cy:number) => {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');

  circle.setAttribute('cx', `${cx}`);
  circle.setAttribute('cy', `${cy}`)
  circle.classList.add('ball');
  $ballGroup.appendChild(circle);
  return circle;
}

const updateCountText = (count:keyof any) => {
  $text.innerHTML = count.toString();
}

// Ball Behaviour Definition
type BallComponent = {
  center:[x:number, y:number],
  timeRemaining: number,
  element:SVGElement
};

const ballBundle = (entity:number, world:BallWorld, cx:number, cy:number) => {
  const element = makeCircleElement(cx, cy);
  world.addComponent(entity, 'ball', {
    center: [cx, cy],
    timeRemaining: 5000,
    element,
  });
  updateCount(n => n + 1);
}

function updateBalls(world:BallWorld){
  const {elapsed} = world.getResource("time");
  for(const identity of world.query({required: {ball: null}}).keys()){
    world.mutateComponent(identity, "ball", (ball) => ball.timeRemaining -= elapsed);
  }
}

const isBallDead = (ball:BallComponent) => ball.timeRemaining <= 0
const isBallDeadQuery = {required: { ball: isBallDead}};

function cleanup(world:BallWorld){
  for(const entity of world.query(isBallDeadQuery).keys()){
    world.removeEntity(entity)
  }
}

function updateTimer(world:BallWorld){
  world.mutateResource('time', (time) => {
    const now = performance.now();
    time.elapsed = now - time.now;
    time.now = now;
  });
}

// Create World
let index = 0;
const makeId = () => ++index;

const world = makeWorldBuilder(makeId)
  .addResource("time", {now:performance.now(), elapsed:0})
  .addResource("count", 0)
  .addComponent("ball", ({element}:BallComponent) => {
    element.remove();
    updateCount(n => n - 1);
  })
  .world();

const updateCount = (update:(n:number) => number) => {
  const [_,n] = world.updateResource("count", update);
  updateCountText(n);
}

type BallWorld = typeof world;

const systems = wrapSystems(world);

systems.addSystem("update:timer", updateTimer);
systems.addSystem("update:balls", updateBalls);
systems.addSystem("cleanup", cleanup);
systems.addSystem("request:loop", () => {
  requestAnimationFrame(() => systems.runStage('loop'));
});

systems.combineStages("loop", ["update:timer", "update:balls", "cleanup", "request:loop"]);

systems.runStage("loop");

$svg.addEventListener('click', (event) => {
  const matrix = $svg.getScreenCTM()?.inverse();
  if(!matrix) return;
  const x = event.clientX * matrix.a + event.clientX * matrix.c + matrix.e;
  const y = event.clientX * matrix.b + event.clientY * matrix.d + matrix.f;
  world.createBundle(ballBundle, x, y);
})