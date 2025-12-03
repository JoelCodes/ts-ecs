# TS ECS

This is a TypeScript-friendly Entity Component System (ECS) Library for a data-oriented approach to games.

## What's ECS?

The Entity-Component-System paradigm is a way of organizing all your coding behaviour for games, with an emphasis on composition over inheritance.  

In ECS, every object in your game is an __Entity__, and is represented by a simple ID.  you can create an Entity by itself, or as the child of another Entity.

Any data associated with an Entity is a __Component__, like "position" or "sprite" or "hp". You can even have simple flags like "isEnemy".  We can update these Components, and also use them to query the Entities (e.g. query all the Entities with the "isEnemy" set to true).  You can use objects, so you have the choice to create Components that either have many data fields or just one as you see fit.

There is a parallel to Components called __Resources__, which have much the same structure, but are global to the entire game. For instance, you may make a Resource called "time" that keeps track of the current timestamp, and the time elapsed since the last timestamp was captured.

The last element of ECS is __Systems__, which describe all the ways our app will interact with the Entities, Components, and Resources in our world.  Currently, this system doesn't enforce any particular stages and leaves it to you to decide how and when each system will run.

This also includes a concept called __Bundles__, which is basically a utility that, once an entity is created, adds components or updates the world as needed. 

### Example

Let's try to use this system to make a clock.  We'll use a random string generator for our Entity type

```ts
// Random Entity Maker
const makeId = () => Math.random().toString(32).subtring(2);
```

We'll have three clock hands, which will be entities with a `ClockHandComponent` showing which clock hand they represent and their current angle.

```ts
type ClockHand = "HOUR" | "MINUTE" | "SECOND";
type ClockHandComponent = {
  hand: ClockHand;
  theta: number;
};

const angleFromDate:Record<ClockHand, (d:Date) => number> = {
  HOUR: (d:Date) => (d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds()) * 2 * Math.PI / (12 * 60 * 60),
  MINUTE: (d:Date) => (d.getMinutes() * 60 + d.getSeconds()) * 2 * Math.PI / (60 * 60),
  SECOND: (d:Date) => (d.getSeconds() % 60) * 2 * Math.PI / 60
}
```

We can now create a "World" with that `clockHandComponent` available, as well as a resource with the current time and resource to say whether or not the clock is running.

```ts
// Make a "world" that has a clock hand component.
const clockWorld = makeWorldBuilder(makeId)
  .addResource("now", new Date())
  .addResource("running", true)
  .addComponent<"clockHand",ClockHandComponent>("clockHand")
  .world();

type ClockWorld = typeof clockWorld;
```

Okay, so what systems will we want?

Well, we'll want one system to add three clock hand entities to the world.  We'll create a bundler and a system for this.
```ts
// Create a systems wrapper for clock world;
const systems = wrapSystems(clockWorld);

// Make a bundler that adds the clock hand component.
const clockHandBundler = (hand:ClockHand) => (
  entity:string, 
  world:ClockWorld
) => {
  world.addComponent(entity, 'clockHand', {
    hand, 
    theta: angleFromData[hand](world.getResource('now'))
  });
}

const setupSystem = (world:ClockWorld) => {
  const now = new Date();
  world.setResource('now', now);

  for(const hand of ['HOUR', 'MINUTE', 'SECOND'] as const){
    world.createBundle(clockHandBundler(hand));
  }
}

```

We can also write systems to update the world.  One will update the "now" resource,

```ts
// Updates the "now"
const updateNowResource = (world:ClockWorld) => {
  world.setResource('now', new Date());
}
```

One will update where the hands angle in response to the "now",
```ts
// Moves the hands
const updateHandsComponents = (world:ClockWorld) => {
  const now = world.getResource('now');
  for(const handEntity in world.query({hand:undefined}).keys()){
    world.updateComponent('clockHand', handEntity, (handComponent) => ({
      ...handComponent,
      theta: angleFromData[handComponent.hand](now)
    }))
  }
}
```

And one will "render" (which for this example will be a `console.log`).
```ts
const render = (world:ClockWorld) => {
  console.log('Rendering')
  for(const {hand, theta} in world.query({clockHand:undefined}).values()){
    console.log(hand, theta);
  }
  console.log('Done Rendering');
};
```

Let's also write a cleanup system that will remove all the entities and their components.
```ts
const cleanup = (world:ClockWorld) => {
  world.removeAllEntities();
}
```

Now we can use `wrapSystems` to coordinate all these efforts 
```ts
const systems = wrapSystems(world);

systems.addSystem('setup', setup);
systems.addSystem('update:now', updateNowResource);
systems.addSystem('update:hands', updateHandsComponent);
systems.addSystem('render', render);
systems.addSystem('cleanup', cleanup);
```

I'd like to put everything that I'll loop into one big system called `loop`, complete with a system to request looping.

```ts
systems.addSystem('request:loop', (world) => {
  // Assume there is some case where "running" gets set to false.
  if(world.getResource("running")){
    requestAnimationFrame(() => systems.runSystem('loop'));
  } else {
    systems.runSystem('cleanup');
  }
})

// This creates a new system called "loop" that runs these systems in order.
system.sorderSystem('loop', ['update:now', 'update:hands', 'render', 'request:loop']);
```

Now I can call the `setup` stage and the `loop` stage, which will get our system moving.

```ts
systems.runSystem('setup');
systems.runSystem('loop');
```

So what's so great about this? Well, everything's a bit more modular, and the pieces can be reused, replaced, and redesigned with ease.

