import { makeEntityManager } from "./entities";

const ENTITY_1 = "ENTITY_1";
const ENTITY_2 = "ENTITY_2";
const ENTITY_3 = "ENTITY_3";
const ENTITY_4 = "ENTITY_4";

describe('Entities', () => {
  describe('Basic Entity Management', () => {
    describe('Creation', () => {
      it('creates an entity', () => {
        const makeEntity = jest.fn(() => ENTITY_1);
        const entityMethods = makeEntityManager(makeEntity);
        expect(makeEntity).not.toHaveBeenCalled();
        expect(entityMethods.hasEntity(ENTITY_1)).toBe(false);

        const createdEntity = entityMethods.createEntity();
        expect(createdEntity).toBe(ENTITY_1);
        expect(entityMethods.hasEntity(createdEntity)).toBe(true);
      });
    });

    describe('Removal', () => {
      it('removes an entity', () => {
        const makeEntity = jest.fn(() => ENTITY_1);
        const entityMethods = makeEntityManager(makeEntity);
        const createdEntity = entityMethods.createEntity();

        const results = [...entityMethods.removeEntity(createdEntity)];

        expect(results).toEqual([createdEntity]);
        expect(entityMethods.hasEntity(createdEntity)).toBe(false);
      });

      it('returns nothing if the entity is not present', () => {
        const entityMethods = makeEntityManager(() => ENTITY_1);

        const results = [...entityMethods.removeEntity(ENTITY_1)];
        expect(results).toEqual([]);
      });
    });
  });

  describe('Child Entities', () => {
    describe('Creating', () => {
      it("doesn't allow creating children of a missing parent", () => {
        const entityMethods = makeEntityManager(() => ENTITY_1);
        const createdChild = entityMethods.createChildEntity(ENTITY_1);
        expect(createdChild).toBe(undefined);
        expect([...entityMethods.allEntities()]).toEqual([]);
      });

      it('creates a child entity', () => {
        const makeEntity = jest.fn(() => ENTITY_2).mockReturnValueOnce(ENTITY_1);
        const entityMethods = makeEntityManager(makeEntity);
        const parent = entityMethods.createEntity();
        
        expect([...entityMethods.getChildren(ENTITY_1)]).toEqual([]);
        expect(entityMethods.getParent(ENTITY_1)).toBe(undefined);

        expect([...entityMethods.getChildren(ENTITY_2)]).toEqual([]);
        expect(entityMethods.getParent(ENTITY_2)).toBe(undefined);

        const child = entityMethods.createChildEntity(parent);
        expect(child).toBe(ENTITY_2);
        expect(entityMethods.hasEntity(child as string)).toBe(true);

        expect(entityMethods.hasEntity(ENTITY_1));
        expect(entityMethods.hasEntity(ENTITY_2));

        expect([...entityMethods.getChildren(ENTITY_1)]).toEqual([ENTITY_2]);
        expect(entityMethods.getParent(ENTITY_2)).toBe(ENTITY_1);
      });
    });
  });

  describe('Removal', () => {
    it('removes child entities recursively', () => {
      const makeEntity = jest.fn(() => ENTITY_1);
      const entityMethods = makeEntityManager(makeEntity);
      entityMethods.createEntity();
      makeEntity.mockReturnValue(ENTITY_2);
      entityMethods.createChildEntity(ENTITY_1);
      makeEntity.mockReturnValue(ENTITY_3);
      entityMethods.createChildEntity(ENTITY_2);

      const results = [...entityMethods.removeEntity(ENTITY_1)];
      expect(results).toEqual([ENTITY_3, ENTITY_2, ENTITY_1]);
      expect([...entityMethods.allEntities()]).toEqual([]);

      for(const e of [ENTITY_1, ENTITY_2, ENTITY_3]){
        expect([...entityMethods.getChildren(e)]).toEqual([]);
        expect(entityMethods.getParent(e)).toBeUndefined();
      }
    });
    
    it('removes child-parent relationship of removed children', () => {
      const makeEntity = jest.fn(() => ENTITY_1);
      const entityMethods = makeEntityManager(makeEntity);
      entityMethods.createEntity();
      makeEntity.mockReturnValue(ENTITY_2);
      entityMethods.createChildEntity(ENTITY_1);
      makeEntity.mockReturnValue(ENTITY_3);
      entityMethods.createChildEntity(ENTITY_1);
      makeEntity.mockReturnValue(ENTITY_4);
      entityMethods.createChildEntity(ENTITY_2);

      const results = [...entityMethods.removeEntity(ENTITY_2)];
      expect(results).toEqual([ENTITY_4, ENTITY_2]);

      expect([...entityMethods.getChildren(ENTITY_1)]).toEqual([ENTITY_3]);
      expect(entityMethods.getParent(ENTITY_3)).toBe(ENTITY_1);

      expect(entityMethods.getParent(ENTITY_2)).toBeUndefined();
      expect([...entityMethods.getChildren(ENTITY_4)]).toEqual([]);
    });
  });
});