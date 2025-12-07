# TS ECS

This is a TypeScript-friendly Entity Component System (ECS) Library for a data-oriented approach to games.  Since there's data that is frequently added, searched for, and deleted, this library relies on `Set` and `Map` for this data management.  In the future, this may stretch to include object pools and typed arrays where possible.

## What's ECS?

The Entity-Component-System paradigm is a way of organizing all your coding behaviour for games, with an emphasis on composition over inheritance.

In ECS, we have a __World__ that holds all the things in our game and all the data associated with them.  Every object in your game is an __Entity__, and is represented by a simple ID.  you can create an Entity by itself, or as the child of another Entity.  If an Entity has children, then when the parent Entity is deleted from the system, its children are deleted as well.

```ts
// Random ID generator
const makeId = () => Math.random().toString(32).substring(2);
const world = makeWorldBuilder(makeId).world();

const enemy = world.createEntity();
const enemyArrow = world.createChildEntity(enemy);

const isEnemyStillInOurWorld = world.hasEntity(enemy); // true;
world.removeEntity(enemy);
```

Any data associated with an Entity is a __Component__, like "position" or "sprite" or "hp". You can even have simple flags like "isEnemy".  We can update these Components, and also use them to query the Entities (e.g. query all the Entities with the "isEnemy" set to true).  You can use objects, so you have the choice to create Components that either have many data fields or just one as you see fit.  Again, when an Entity is deleted from our system, all its components are deleted as well.

```ts
type Vec2 = [x:number, y:number];

const world = makeWorldBuilder(makeId)
  .addComponent<"position", Vec2>("position")
  .addComponent<"velocity", Vec2>("velocity")
  .addComponent<"isEnemy", true>("isEnemy")
  .world();

const enemy = world.createEntity();
world.addComponent(enemy, "position", [0, 0]);
world.addComponent(enemy, "isEnemy", true);

const enemyArrow = world.createChildEntity(enemy)
world.addComponent(enemyArrow, "position", [0, 0])
world.addComponent(enemyArrow, "velocity", [1, 0]);
```

The last element of ECS is __Systems__, which describe all the ways our app will interact with the Entities, Components, and Resources in our world.  Currently, this system doesn't enforce any particular stages and leaves it to you to decide how and when each system will run. To define a system, you define a function that accepts the worlds as a parameter.

```ts
function setup(world){
  const enemy = world.createEntity();
  world.addComponent(enemy, "position", [0, 0]);
  world.addComponent(enemy, "isEnemy", true);

  const enemyArrow = world.createChildEntity(enemy)
  world.addComponent(enemyArrow, "position", [0, 0])
  world.addComponent(enemyArrow, "velocity", [1, 0]);
}

const systems = wrapSystems(world);
systems.addSystem("setup", setup);

systems.runSystem("setup");
```

That's enough to do everything you'd want, but there's some additional vocab I've picked up along the way that I've added to this library.

There is a parallel to Components called __Resources__, which have much the same structure, but are global to the entire game. For instance, you may make a Resource called "time" that keeps track of the current timestamp, and the time elapsed since the last timestamp was captured.  Think of it like this: imagine that each world has one Entity that's global to the system, and that global Entity has Components associated with it.  That's what a resource is.

```ts
const world = makeWorldBuilder(makeId)
  .addResource("time", { 
    current:performance.now(), 
    elapsed:0 
  })
  .world();
type TimeWorld = typeof world;

function updateTime(world:TimeWorld){
  world.mutateResource("time", (time) => {
    const now = performance.now();
    time.elapsed = now - time.current;
    time.current = now;
  });
}
```

This also includes a concept called __Bundles__, which is basically a utility that, once an entity is created, adds components or updates the world as needed.  We can refactor the creation of `enemy` and `enemyArrow` as bundles.

```ts
type Vec2 = [x:number, y:number];

const world = makeWorldBuilder(makeId)
  .addComponent<"position", Vec2>("position")
  .addComponent<"velocity", Vec2>("velocity")
  .addComponent<"isEnemy", true>("isEnemy")
  .world();

const enemyBundle = (entity, world) => {
  world.addComponent(entity, "position", [0, 0]);
  world.addComponent(entity, "isEnemy", true);
}

const enemyArrowBundle = (arrow, _enemy, world) => {
  world.addComponent(arrow, "position", [0, 0])
  world.addComponent(arrow, "velocity", [1, 0]);
}

const enemy = world.createBundle(enemyBundle);
const enemyArrow = world.createChildBundle(enemy, enemyArrowBundle);
```

## Why ECS?

That's a good question.

For many game developers, Class-based OOP has been the coding paradigm of choice, and if there was ever a place for it, games seemed like the best fit.  After all, what OOP (arguably) does well is keeping data and operations together, as well as providing a "thing"-based taxonomy for your system.  But using inheritance as your main strategy for code reuse and modification can create rigidities in the system.

ECS was developed first as a way of collocating similarly shaped data in memory, but to me, it also solves "human" problems as well as technical problems.  You see, to me, that's what programming paradigms are: solutions to human problems.  They are techniques design to help our minds organize the behaviours of our systems.  And for me, ECS as an approach allows me to do just that.

## Examples

> TODO: List examples

## What's Next?

> TODO: Talk about future features.