import { makeWorldBuilder } from "./world";

const ENTITY_1 = "ENTITY_1";
const ENTITY_2 = "ENTITY_2";
const ENTITY_3 = "ENTITY_3";
const ENTITY_4 = "ENTITY_4";
type TestEntity =
  | typeof ENTITY_1
  | typeof ENTITY_2
  | typeof ENTITY_3
  | typeof ENTITY_4

type Vec2 = [x:number, y:number];

describe('makeWorldBuilder', () => {
  it('creates a world builder to which you can add components and resources', () => {
    
    const world = makeWorldBuilder(() => ENTITY_1)
      .addResource("time", {current: 1800, delta: 0})
      .addComponent<"position", Vec2>("position")
      .addFlag("flagged")
      .world();
    
    expect(world.getResource("time")).toEqual({current: 1800, delta: 0});

    const entity = world.createEntity();
    expect(entity).toBe(ENTITY_1);

    world.addComponent(entity, "position", [1, 2]);
    world.addFlag(entity, "flagged");
    
    expect(world.hasEntity(ENTITY_1)).toBe(true);
    expect(world.hasEntity(ENTITY_2)).toBe(false);
    expect(world.getComponents(ENTITY_1)).toEqual({position: [1, 2], flagged: true});
  });

  describe('Bundle', () => {
    it('uses a bundler to add components', () => {
      const makeEntity = jest.fn<TestEntity, []>().mockReturnValue(ENTITY_1);
      type Vec2 = [x:number, y:number];
      
      const world = makeWorldBuilder(makeEntity)
        .addResource("time", {current:1800, delta:0})
        .addComponent<"position", Vec2>("position")
        .addFlag("flagged")
        .addComponent<"createdAt", number>("createdAt")
        .world();
        
      expect(world.createBundle((entity, world) => {
        world.addComponent(entity, "position", [1, 2]);
        world.addFlag(entity, "flagged");
        world.addComponent(entity, "createdAt", world.getResource("time").current);
      })).toBe(ENTITY_1);

      expect(world.getComponents(ENTITY_1)).toEqual({"position": [1, 2], "flagged": true, createdAt: 1800});
    });

    it('allows adding args to a bundle', () => {
      const makeEntity = jest.fn<TestEntity, []>().mockReturnValue(ENTITY_1);
      type Vec2 = [x:number, y:number];
      
      const world = makeWorldBuilder(makeEntity)
        .addResource("time", {current:1800, delta:0})
        .addComponent<"position", Vec2>("position")
        .addFlag("flagged")
        .addComponent<"createdAt", number>("createdAt")
        .world();
      type TestWorld = typeof world;

      const bundleWithExtraParams = (entity:TestEntity, world:TestWorld, position:Vec2) => {
        world.addComponent(entity, "position", position);
        world.addFlag(entity, "flagged");
        world.addComponent(entity, "createdAt", world.getResource("time").current);
      }

      const created = world.createBundle(bundleWithExtraParams, [1, 2]);
      expect(created).toBe(ENTITY_1);
      expect(world.getComponents(created)).toEqual({
        flagged: true,
        position: [1, 2],
        createdAt: 1800
      })
    })
    
    it('creates bundles as child entities', () => {
      const makeEntity = jest.fn<TestEntity, []>().mockReturnValue(ENTITY_1);
      type Vec2 = [x:number, y:number];
      
      const world = makeWorldBuilder(makeEntity)
      .addResource("time", {current:1800, delta:0})
      .addComponent<"createdAt", number>("createdAt")
      .addComponent<"position", Vec2>("position")
      .addFlag("flagged")
      .addComponent<"numChildren", number>("numChildren")
      .world();
      
      world.createBundle((entity, world) => {
        world.addComponent(entity, "numChildren", 0);
      });
      
      makeEntity.mockReturnValue(ENTITY_2);
      const position:Vec2 = [1, 2];
      expect(world.createChildBundle(ENTITY_1, (child, parent, world, position) => {
        world.addComponent(child, "position", position);
        world.addFlag(child, "flagged");
        world.addComponent(child, "createdAt", world.getResource("time").current);
        world.updateComponent(parent, "numChildren", n => n + 1);
      }, position)).toBe(ENTITY_2);
      
      const childComponents = world.getComponents(ENTITY_2);
      
      expect(childComponents).toEqual({"position": [1, 2], "flagged": true, "createdAt":1800});
      expect(world.getComponents(ENTITY_1)).toEqual({numChildren: 1});
    });
  });

  describe("Removing Entities", () => {
    const makeWorld = () => {
      const makeEntity = jest.fn<TestEntity, []>().mockReturnValue(ENTITY_4);
      const world = makeWorldBuilder(makeEntity)
        .addComponent<'position', Vec2>('position')
        .addComponent<'childCount', number>('childCount')
        .addResource('running', true)
        .world();
      type TestWorld = typeof world;

      const bundle = (v:Vec2) => (entity:TestEntity, world:Pick<TestWorld, 'addComponent'>) => {
        world.addComponent(entity, 'position', v);
        world.addComponent(entity, 'childCount', 0);
      };

      const bundleWithParent = (v:Vec2) => (child:TestEntity, parent:TestEntity, world:Pick<TestWorld, 'addComponent' | 'updateComponent'>) => {
        world.addComponent(child, 'position', v);
        world.updateComponent(parent, 'childCount', (n) => n + 1)
      };
      makeEntity.mockReturnValueOnce(ENTITY_1);
      world.createBundle(bundle([1, 2]));
      makeEntity.mockReturnValueOnce(ENTITY_2)
      world.createBundle(bundle([2, 3]));
      makeEntity.mockReturnValueOnce(ENTITY_3);
      world.createChildBundle(ENTITY_1, bundleWithParent([3, 4]));
      return world;
    }

    it('removes entities and their components', () => {
      const world = makeWorld();
      expect(world.getComponents('ENTITY_1')).toEqual({
        position: [1, 2],
        childCount: 1
      });
      expect(world.getComponents('ENTITY_2')).toEqual({
        position: [2, 3],
        childCount: 0
      });
      expect(world.getComponents('ENTITY_3')).toEqual({
        position: [3, 4]
      });
      const removed = [...world.removeEntity('ENTITY_1')].toSorted(([a], [b]) => a.localeCompare(b));
      expect(removed).toEqual([
        [ENTITY_1, {
          position: [1, 2],
          childCount: 1
        }],
        [ENTITY_3, {
          position: [3, 4]
        }]
      ]);
      for(const [removedEntity] of removed){
        expect(world.hasEntity(removedEntity)).toBe(false);
        expect(world.getComponents(removedEntity)).toEqual({});
      }

      expect([...world.allEntities()]).toEqual([ENTITY_2]);
      expect([...world.query({ required: { position: undefined } }).entries()]).toEqual([[ENTITY_2, {position: [2, 3]}]])
    });

    it('removes all entities and components', () => {
      const world = makeWorld();
      const removed = [...world.removeAllEntities()].toSorted(([a], [b]) => a.localeCompare(b));
      expect(removed).toEqual([
        [ENTITY_1, { position: [1, 2], childCount: 1 }], 
        [ENTITY_2, { position: [2, 3], childCount: 0 }],
        [ENTITY_3, { position: [3, 4] }]
      ]);

      for(const [entity] of removed){
        expect(world.hasEntity(entity)).toBe(false);
        expect(world.getComponents(entity)).toEqual({});
      }

      expect([...world.allEntities()]).toEqual([])
      expect([...world.query({required:{position: null}}).entries()]).toEqual([]);
    });
  });
});