import { EntityMethods } from "./entities.types";

export function makeEntityManager<Entity>(makeEntity:() => Entity):EntityMethods<Entity>{
  const entities = new Set<Entity>();
  const childToParentMap = new Map<Entity, Entity>();
  const hasEntity = (entity:Entity) => entities.has(entity);

  const createEntity = () => {
    const entity = makeEntity();
    entities.add(entity);
    return entity;
  };

  const getChildren = function*(entity:Entity){
    if(!hasEntity(entity)) return;
    for(const [child, parent] of childToParentMap.entries()){
      if(parent === entity){
        yield child;
      }
    }
  }

  const removeEntity = function*(entity:Entity):Iterable<Entity>{
    if(!hasEntity(entity)) return;
    for(const child of getChildren(entity)){
      yield *removeEntity(child);
    }
    entities.delete(entity);
    childToParentMap.delete(entity);
    yield entity
  };

  return {
    createEntity,
    hasEntity,
    createChildEntity(parent) {
      if(!hasEntity(parent)) return undefined;
      const child = createEntity();
      childToParentMap.set(child, parent);
      return child;
    },
    getChildren,
    getParent(entity) {
      if(!hasEntity(entity)) return;
      return childToParentMap.get(entity);
    },
    removeEntity,
    *allEntities() {
      yield *entities.values();
    },
    *removeAllEntities(){
      for(const entity of entities.values()){
        yield *removeEntity(entity);
      }
    }
  };
}