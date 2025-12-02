import { ComponentMethods, makeComponentManager } from "./components";
import { EntityMethods, makeEntityManager } from "./entities";
import { makeResourcesManager, type ResourcesMethods } from "./resources";

export type World<Entity, Components extends Record<string, any>, Resources extends Record<string, any>> =
  & Omit<EntityMethods<Entity>, 'removeEntity' | 'removeAllEntities'>
  & ComponentMethods<Entity, Components>
  & ResourcesMethods<Resources>
  & {
    createBundle(bundler:(entity:Entity, world:World<Entity, Components, Resources>) => void):Entity;
    createChildBundle(parent:Entity, bundler:(child:Entity, parent:Entity, world:World<Entity, Components, Resources>) => void):Entity|undefined;
    removeEntity(entity:Entity):Iterable<[Entity, Partial<Components>]>;
    removeAllEntities():Iterable<[Entity, Partial<Components>]>;
  };

export type WorldBuilder<Entity, Components extends Record<string, any>, Resources extends Record<string, any>> = {
  world():World<Entity, Components, Resources>;
  addComponent<ComponentName extends string, ComponentType>(name:ComponentName):
    WorldBuilder<
      Entity, 
      {[K in (keyof Components)|ComponentName]:
        K extends keyof Components ? Components[K] : ComponentType
      }, 
      Resources>;
  addResource<ResourceName extends string, ResourceType>(name:ResourceName, value:ResourceType):
    WorldBuilder<
      Entity, 
      Components, 
      {[K in (keyof Resources)|ResourceName]:
        K extends keyof Resources ? Resources[K] : ResourceType
      }>;
}

export function makeWorldBuilder<Entity>(makeEntity:() => Entity):WorldBuilder<Entity, {}, {}>{
  function makeWorld<
    Components extends Record<string, any>,
    Resources extends Record<string, any>>
    (
      components:{[K in keyof Components]:Map<Entity, Components[K]>},
      resources:Resources
    ):World<Entity, Components, Resources>{
  
    const entityManager = makeEntityManager(makeEntity);
    const componentManager = makeComponentManager(components);
    const resourcesManager = makeResourcesManager(resources);

    const removeEntity = function*(entity:Entity):Iterable<[Entity, Partial<Components>]>{
      for(const removedEntity of entityManager.removeEntity(entity)){
        const removedComponents = componentManager.removeAllComponents(removedEntity);
        yield [removedEntity, removedComponents];
      }
    }
    const removeAllEntities = function*():Iterable<[Entity, Partial<Components>]>{
      for(const entity of entityManager.allEntities()){
        yield *removeEntity(entity);
      }
    };

    const createBundle = (bundler:(entity:Entity, world:World<Entity, Components, Resources>) => void) => {
      const entity = entityManager.createEntity();
      bundler(entity, world);
      return entity;
    };

    const createChildBundle = (parent:Entity, bundler:(child:Entity, parent:Entity, world:World<Entity, Components, Resources>) => void) => {
      const child = entityManager.createChildEntity(parent);
      if(child){
        bundler(child, parent, world);
      }
      return child;
    };
    const world:World<Entity, Components, Resources> = {
      ...entityManager,
      ...componentManager,
      ...resourcesManager,
      removeEntity,
      removeAllEntities,
      createBundle,
      createChildBundle,
    }
    return world;
  }

  function makeWorldBuilderInner<Components extends Record<string, any>, Resources extends Record<string, any>>(componentMaps:{[K in keyof Components]:Map<Entity, Components[K]>}, resources:Resources):WorldBuilder<Entity, Components, Resources>{
    return {
      addResource<ResourceName extends string, ResourceType>(name:ResourceName, value:ResourceType) {
        type NewResources = Resources & Record<ResourceName, ResourceType>
        return makeWorldBuilderInner<Components, NewResources>(componentMaps, {...resources, [name]:value} as NewResources);
      },
      addComponent<ComponentName extends string, ComponentType>(name:ComponentName) {
        type NewComponents = Components & Record<ComponentName, ComponentType>;
        return makeWorldBuilderInner<NewComponents, Resources>({...componentMaps, [name]:new Map<Entity, ComponentType>()}, resources);
      },
      world: () => makeWorld<Components, Resources>(componentMaps, resources),
    }
  }

  return makeWorldBuilderInner<{}, {}>({}, {});
}