import { makeComponentManager } from "./components.ts";

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
describe("Components", () => {
  const makeComponents = () => ({
    position:new Map<TestEntity, Vec2>(), 
    flagged:new Map<TestEntity, boolean>(),
  });
  describe('Adding', () => {
    it('adds a component', () => {
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      const vec:Vec2 = [1, 2];
      expect(componentManager.addComponent(ENTITY_1, "position", vec)).toBe(true);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, vec]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({position: vec});
    });
    it('does not add when a component exists', () => {
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      const vec:Vec2 = [1, 2];
      expect(componentManager.addComponent(ENTITY_1, "position", vec)).toBe(true);

      expect(componentManager.addComponent(ENTITY_1, "position", [2, 3])).toBe(false);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([true, vec]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({position: vec});
    });
  });
  describe('Setting', () => {
    it('sets or replaces a value', () => {
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
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
      const components = makeComponents();
      const vec:Vec2 = [1, 2];
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      componentManager.setComponent(ENTITY_1, "position", vec);
      expect(componentManager.getComponent(ENTITY_1, 'position')).toEqual([true, vec]);

      expect(componentManager.removeComponent(ENTITY_1, "position")).toEqual([true, vec]);
      expect(componentManager.getComponent(ENTITY_1, "position")).toEqual([false]);
      expect(componentManager.getComponents(ENTITY_1)).toEqual({});

      expect(componentManager.removeComponent(ENTITY_1, "position")).toEqual([false]);
    });
    it('deletes all components for an entity with removeAllComponents', () => {
      const components = makeComponents();
      const vec:Vec2 = [1, 2];
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      componentManager.setComponent(ENTITY_1, "position", vec);
      componentManager.setComponent(ENTITY_1, "flagged", true);
      componentManager.setComponent(ENTITY_2, "flagged", false);
      
      expect(componentManager.removeAllComponents(ENTITY_1)).toEqual({
        position: vec,
        flagged: true,
      });

      expect(componentManager.getComponents(ENTITY_1)).toEqual({});
      expect(componentManager.removeAllComponents(ENTITY_1)).toEqual({});

      expect(componentManager.getComponents(ENTITY_2)).toEqual({flagged: false});
    });
  });
  describe('Updating', () => {
    it('updates a value with an atom', () => {
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      const vec1:Vec2 = [1, 2];
      componentManager.setComponent(ENTITY_1, "position", vec1);
      
      const vec2:Vec2 = [2, 3];
      const update = jest.fn(([x, y]:Vec2):Vec2 => [x + 1, y + 1]);
      expect(componentManager.updateComponent(ENTITY_1, "position", update)).toEqual([true, vec1, vec2]);
      expect(update).toHaveBeenLastCalledWith(vec1);
      expect(componentManager.getComponent(ENTITY_1, 'position')).toEqual([true, vec2]);

    });
    it('does nothing if the component is not set.', () => {
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      const vec1:Vec2 = [1, 2];
      const update = jest.fn(() => vec1);
      expect(componentManager.updateComponent(ENTITY_1, 'position', update)).toEqual([false]);
      expect(update).not.toHaveBeenCalled();
      expect(componentManager.getComponent(ENTITY_1, 'position')).toEqual([false]);
    });
  });
  describe('Mutating', () => {
    it('mutates a component', () => {
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
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
      const components = makeComponents();
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(components);
      const mutate = jest.fn((v:Vec2) => {
        v[0] += 1;
        v[1] += 1;
      });
      expect(componentManager.mutateComponent(ENTITY_1, "position", mutate)).toEqual([false]);
      expect(mutate).not.toHaveBeenCalled();
    });
  });
  describe('Querying', () => {
    it('allows querying for entities based on presence of components', () => {
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(makeComponents());
      const vec1:Vec2 = [1, 2];
      const vec2:Vec2 = [2, 3];
      componentManager.addComponent(ENTITY_1, "position", vec1);
      componentManager.addComponent(ENTITY_2, "position", vec2);
      componentManager.addComponent(ENTITY_2, "flagged", true)
      const results = componentManager.query({"position":undefined});
      
      expect(Object.fromEntries(results.entries())).toEqual({
        [ENTITY_1]: { position: vec1 },
        [ENTITY_2]: { position: vec2 }
      });
      
      const secondResults = componentManager.query({"position": undefined, flagged: undefined});
      expect(Object.fromEntries(secondResults.entries())).toEqual({
        [ENTITY_2]: {position: vec2, flagged: true}
      });
    });
    it('allows querying for entities based on predicate functions', () => {
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(makeComponents());
      const vec1:Vec2 = [1, 2];
      const vec2:Vec2 = [2, 3];
      componentManager.addComponent(ENTITY_1, "position", vec1);
      componentManager.addComponent(ENTITY_2, "position", vec2);
      componentManager.addComponent(ENTITY_2, "flagged", true)
      const vecAlwaysTrue = componentManager.query({"position":() => true});
      
      expect(Object.fromEntries(vecAlwaysTrue.entries())).toEqual({
        [ENTITY_1]: { position: vec1 },
        [ENTITY_2]: { position: vec2 }
      });

      const vecXIs2 = componentManager.query({"position":([x]) => x === 2});
      expect(Object.fromEntries(vecXIs2.entries())).toEqual({
        [ENTITY_2]: { position: vec2 }
      });
      const vecXIs2AndHasFlagged = componentManager.query({"position":([x]) => x === 2, "flagged": undefined});
      expect(Object.fromEntries(vecXIs2AndHasFlagged.entries())).toEqual({
        [ENTITY_2]:{
          "position": vec2,
          "flagged": true
        }
      });
    });
    it('allows querying with negative list', () => {
      const componentManager = makeComponentManager<TestEntity, {position:Vec2, flagged:boolean}>(makeComponents());
      const vec1:Vec2 = [1, 2];
      const vec2:Vec2 = [2, 3];
      componentManager.addComponent(ENTITY_1, "position", vec1);
      componentManager.addComponent(ENTITY_2, "position", vec2);
      componentManager.addComponent(ENTITY_2, "flagged", true);

      const results = componentManager.query({"position": undefined}, ["flagged"])
      expect(Object.fromEntries(results.entries())).toEqual({
        [ENTITY_1]:{"position": vec1}
      });
    });
  });
});