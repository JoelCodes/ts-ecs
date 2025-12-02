import { makeWorldBuilder, wrapSystems } from "../src/index.ts";

const makeId = () => Math.random().toString(16).substring(2);
type ClockHand = 'HOUR' | 'MINUTE' | 'SECOND'
const world = makeWorldBuilder(makeId)
  .addComponent<"hand", {theta: number, which: ClockHand}>("hand")
  .addResource("now", new Date())
  .world();

const numToAngle = (num:number, divisor:number) => (num % divisor) * 2 * Math.PI / divisor;
const angles:Record<ClockHand, (date:Date) => number> = {
  HOUR: (date:Date) => numToAngle(date.getHours(), 12),
  MINUTE: (date:Date) => numToAngle(date.getMinutes(), 60),
  SECOND: (date:Date) => numToAngle(date.getSeconds(), 60),
}


const systems = wrapSystems(world);

systems.addSystem('setup', (world) => {
  for(const which of ['HOUR',  'MINUTE', 'SECOND'] as const){
    world.createBundle((entity, world) => {
      world.addComponent(entity, 'hand', {
        theta: angles[which](world.getResource('now')),
        which
      });
    });
  }  
});

systems.addSystem('pre:update', (world) => world.setResource('now', new Date()));

systems.addSystem('on:update', (world) => {
  const now = world.getResource('now');
  for(const entity of world.query({hand: undefined}).keys()){
    world.updateComponent(entity, 'hand', (hand) => ({
      ...hand,
      theta: angles[hand.which](now)
    }));
  };
});

systems.addSystem('post:update', () => {
  const hands = [...world.query({hand: undefined}).values()]
    .toSorted(({hand:aHand}, {hand:bHand}) => aHand?.which === 'HOUR' ? -1 : bHand?.which === 'HOUR' ? 1 : aHand?.which === 'MINUTE' ? -1 : 1)
    .map(({hand:{theta} = {}}) => theta).join(',');
  console.log(hands);
})

systems.orderSystem('update', ['pre:update', 'on:update', 'post:update']);

systems.addSystem('cleanup', (world) => {
  world.removeAllEntities();
})