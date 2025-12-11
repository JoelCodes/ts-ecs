import { makeComponentManager } from "./components";

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
type TestComponents = {
  position: Vec2,
  velocity:Vec2,
}
type TestFlag = 'flagged' | 'dead'
describe("Components", () => {
  const makeTestComponentManger = () => makeComponentManager<TestEntity, TestComponents, TestFlag>({
    position:new Map<TestEntity, Vec2>(), 
    velocity:new Map<TestEntity, Vec2>(),
  }, {
    flagged: new Set<TestEntity>(),
    dead: new Set<TestEntity>()
  });

  describe("Get Names", () => {
    it('gets the names of all the components and flags', () => {
      const componentManager = makeTestComponentManger();
      
      const componentNames = [...componentManager.getComponentNames()].sort((a, b) => a.localeCompare(b));
      expect(componentNames).toEqual(["position", "velocity"]);

      const flagNames = [...componentManager.getFlagNames()].sort((a, b) => a.localeCompare(b));
      expect(flagNames).toEqual(["dead", "flagged"])
    })
  })
  describe('Adding', () => {
    it('adds a component', () => {
      const componentManager = makeTestComponentManger();
      const vec:Vec2 = [1, 2];
      expect(componentManager.addComponent(ENTITY_1, "position", vec)).toBe(true);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, vec]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({position: vec});
    });

    it('does not add when a component exists', () => {
      const componentManager = makeTestComponentManger()
      const vec:Vec2 = [1, 2];
      expect(componentManager.addComponent(ENTITY_1, "position", vec)).toBe(true);

      expect(componentManager.addComponent(ENTITY_1, "position", [2, 3])).toBe(false);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, vec]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({position: vec});
    });
    
    it('adds a flag', () => {
      const componentManager = makeTestComponentManger();
      expect(componentManager.hasFlag(ENTITY_1, 'flagged')).toBe(false)
      expect(componentManager.addFlag(ENTITY_1, 'flagged')).toBe(true);
      expect(componentManager.hasFlag(ENTITY_1, 'flagged')).toBe(true);
      expect(componentManager.addFlag(ENTITY_1, 'flagged')).toBe(false);
    })
  });

  describe('Setting', () => {
    it('sets or replaces a value', () => {
      const componentManager = makeTestComponentManger();
      const vec1:Vec2 = [1, 2];
      
      expect(componentManager.setComponent(ENTITY_1, "position", vec1)).toEqual([false]);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, vec1]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({position:vec1})
      
      const vec2:Vec2 = [2, 3];
      expect(componentManager.setComponent(ENTITY_1, "position", vec2)).toEqual([true, vec1]);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, vec2]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({position:vec2});
    });
  });

  describe('Removing', () => {
    it('deletes a component', () => {
      const componentManager = makeTestComponentManger();
      const vec:Vec2 = [1, 2];
      componentManager.setComponent(ENTITY_1, "position", vec);
      expect(componentManager.getComponent(ENTITY_1, 'position')).toEqual([true, vec]);

      expect(componentManager.removeComponent(ENTITY_1, "position")).toEqual([true, vec]);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([false]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({});

      expect(componentManager.removeComponent(ENTITY_1, "position")).toEqual([false]);
    });

    it('removes a flag', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addFlag(ENTITY_1, "flagged");

      expect(componentManager.hasFlag(ENTITY_1, "flagged")).toBe(true);
      expect(componentManager.removeFlag(ENTITY_1, "flagged")).toBe(true);
      expect(componentManager.hasFlag(ENTITY_1, "flagged")).toBe(false);
      
      expect(componentManager.removeFlag(ENTITY_1, "flagged")).toBe(false);
      expect(componentManager.hasFlag(ENTITY_1, "flagged")).toBe(false);
    });

    it('deletes all components for an entity with removeAllComponents', () => {
      const componentManager = makeTestComponentManger();
      const vec:Vec2 = [1, 2];
      componentManager.setComponent(ENTITY_1, "position", vec);
      componentManager.addFlag(ENTITY_1, "flagged");
      componentManager.addFlag(ENTITY_2, "flagged");
      
      expect(componentManager.removeAllComponents(ENTITY_1)).toEqual({
        position: vec,
        flagged: true,
      });

      expect(componentManager.getComponents(ENTITY_1)).toEqual({});
      expect(componentManager.removeAllComponents(ENTITY_1)).toEqual({});

      expect(componentManager.getComponents(ENTITY_2)).toEqual({flagged: true});
    });
  });

  describe('Cleanup', () => {
    it('runs cleanup command on removeComponent', () => {
      const cleanup = jest.fn<void, [number, any]>()
      const componentManager = makeComponentManager({cleanup: new Map<TestEntity, number>()}, {}, {cleanup});
      componentManager.addComponent(ENTITY_1, "cleanup", 343);
      expect(cleanup).not.toHaveBeenCalled();
      componentManager.removeComponent(ENTITY_1, 'cleanup');
      expect(cleanup).toHaveBeenCalledWith(343, ENTITY_1);
    });
    it('runs cleanup command on removeAllComponents', () => {
      const cleanupNumber = jest.fn<void, [number, any]>();
      const cleanupString = jest.fn<void, [string, any]>();

      const componentManager = makeComponentManager({
        cleanupNumber: new Map<TestEntity, number>(),
        cleanupString: new Map<TestEntity, string>()
      }, {}, {cleanupNumber, cleanupString});

      componentManager.addComponent(ENTITY_1, "cleanupNumber", 24);
      componentManager.addComponent(ENTITY_1, "cleanupString", "Hello");

      expect(cleanupNumber).not.toHaveBeenCalled();
      expect(cleanupString).not.toHaveBeenCalled();

      componentManager.removeAllComponents(ENTITY_1);

      expect(cleanupNumber).toHaveBeenCalledWith(24, ENTITY_1);
      expect(cleanupString).toHaveBeenCalledWith("Hello", ENTITY_1);
    });
  })

  describe('Updating', () => {
    it('updates a value with an atom', () => {
      const componentManager = makeTestComponentManger();
      const vec1:Vec2 = [1, 2];
      componentManager.setComponent(ENTITY_1, "position", vec1);
      
      const vec2:Vec2 = [2, 3];
      const update = jest.fn(([x, y]:Vec2):Vec2 => [x + 1, y + 1]);
      expect(componentManager.updateComponent(ENTITY_1, "position", update)).toEqual([true, vec1, vec2]);
      expect(update).toHaveBeenLastCalledWith(vec1);
      expect(componentManager.getComponent(ENTITY_1, 'position')).toEqual([true, vec2]);
    });

    it('does nothing if the component is not set.', () => {
      const componentManager = makeTestComponentManger();
      const vec1:Vec2 = [1, 2];
      const update = jest.fn(() => vec1);
      expect(componentManager.updateComponent(ENTITY_1, 'position', update)).toEqual([false]);
      expect(update).not.toHaveBeenCalled();
      expect(componentManager.getComponent(ENTITY_1, 'position')).toEqual([false]);
    });
  });

  describe('Mutating', () => {
    it('mutates a component', () => {
      const componentManager = makeTestComponentManger();
      const vec1:Vec2 = [1, 2];
      componentManager.setComponent(ENTITY_1, "position", vec1);

      const mutate = jest.fn((v:Vec2) => {
        v[0] += 1;
        v[1] += 1;
      });
      expect(componentManager.mutateComponent(ENTITY_1, 'position', mutate)).toEqual([true, vec1]);
      expect(vec1).toEqual([2, 3]);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, [2, 3]]);
    });

    it('does nothing if the component is not set', () => {
      const componentManager = makeTestComponentManger();
      const mutate = jest.fn((v:Vec2) => {
        v[0] += 1;
        v[1] += 1;
      });
      expect(componentManager.mutateComponent(ENTITY_1, "position", mutate)).toEqual([false]);
      expect(mutate).not.toHaveBeenCalled();
    });
  });

  describe('Querying', () => {
    it('returns entities with components in the required', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addComponent(ENTITY_1, 'position', [1, 2]);
      componentManager.addFlag(ENTITY_1, 'flagged');
      componentManager.addComponent(ENTITY_2, 'position', [2, 3]);
      componentManager.addFlag(ENTITY_3, 'flagged');

      const hasPositionQuery = {position: undefined} as const;
      expect(componentManager.query({required: hasPositionQuery})).toEqual(new Map([
        [ENTITY_1, {position: [1, 2]}],
        [ENTITY_2, {position: [2, 3]}],
      ]));

      const hasFlaggedQuery = {flagged: undefined} as const;      
      expect(componentManager.query({required: hasFlaggedQuery})).toEqual(new Map([
        [ENTITY_1, {flagged: true}],
        [ENTITY_3, {flagged: true}],
      ]));

      const hasFlaggedAndPositionQuery = {position: undefined, flagged: undefined};
      expect(componentManager.query({required: hasFlaggedAndPositionQuery})).toEqual(new Map([
        [ENTITY_1, {position: [1, 2], flagged: true}]
      ]));
    });
    it('returns entities with components that pass the tester functions', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addComponent(ENTITY_1, 'position', [1, 2]);
      componentManager.addFlag(ENTITY_1, 'flagged');
      componentManager.addComponent(ENTITY_2, 'position', [2, 3]);
      componentManager.addFlag(ENTITY_2, 'flagged');
      componentManager.addComponent(ENTITY_3, 'position', [3, 4]);

      const manhattanOver4 = {position:([x, y]:Vec2) => x + y >= 4}
      expect(componentManager.query({required: manhattanOver4})).toEqual(new Map([
        [ENTITY_2, {position: [2, 3]}],
        [ENTITY_3, {position: [3, 4]}]
      ]));

      expect(componentManager.query({
        required: {
          ...manhattanOver4,
          flagged: undefined
        },
      })).toEqual(new Map([
        [ENTITY_2, {position: [2, 3], flagged: true}]
      ]));
    });

    it('returns all entities if there is no query', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addComponent(ENTITY_1, 'position', [1, 2]);
      componentManager.addFlag(ENTITY_1, 'flagged');
      componentManager.addComponent(ENTITY_2, 'position', [2, 3]);
      componentManager.addFlag(ENTITY_2, 'flagged');
      componentManager.addComponent(ENTITY_3, 'position', [3, 4]);
      expect(componentManager.query({})).toEqual(new Map([
        [ENTITY_1, {}],
        [ENTITY_2, {}],
        [ENTITY_3, {}],
      ]));
      expect(componentManager.query()).toEqual(new Map([
        [ENTITY_1, {}],
        [ENTITY_2, {}],
        [ENTITY_3, {}],
      ]));
    });

    it('rejects entities with excluded components', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addComponent(ENTITY_1, 'position', [1, 2]);
      componentManager.addFlag(ENTITY_1, 'flagged');
      componentManager.addComponent(ENTITY_2, 'position', [2, 3]);
      componentManager.addComponent(ENTITY_3, 'velocity', [1, 2]);
      expect(componentManager.query({ excluded: ['flagged'] })).toEqual(new Map([
        [ENTITY_2, {}],
        [ENTITY_3, {}],
      ]));
      expect(componentManager.query({required:{position: undefined}, excluded: ['flagged']})).toEqual(new Map([
        [ENTITY_2, {position: [2, 3]}],
      ]));
    });

    it('gathers optional components', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addComponent(ENTITY_1, 'position', [1, 2]);
      componentManager.addFlag(ENTITY_1, 'flagged');
      componentManager.addComponent(ENTITY_2, 'position', [2, 3]);
      expect(componentManager.query({
        required: {position: undefined},
        optional: ['flagged', 'velocity']
      })).toEqual(new Map([
        [ENTITY_1, {position: [1, 2], flagged: true}],
        [ENTITY_2, {position: [2, 3], }]
      ]));
      expect(componentManager.query({
        optional: ['flagged', 'velocity']
      })).toEqual(new Map([
        [ENTITY_1, {flagged: true, velocity: undefined}],
        [ENTITY_2, {flagged: undefined, velocity: undefined}]
      ]));
    });
    it('returns empty if the required is empty', () => {
      const componentManager = makeTestComponentManger();
      componentManager.addComponent(ENTITY_1, 'position', [1, 2]);
      componentManager.addFlag(ENTITY_1, 'flagged');
      componentManager.addComponent(ENTITY_2, 'position', [2, 3]);
      componentManager.addFlag(ENTITY_2, 'flagged');
      expect(componentManager.query({required: {}})).toEqual(new Map())
    });
  });
});