import { makeComponentManager } from "./components.ts";
import { makeEntityManager } from "./entities.ts";
import { makeResourcesManager } from "./resources.ts";
import type { World, WorldBuilder } from "./world.types.ts";
export type { World, WorldBuilder };

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

    const createBundle = <ExtraArgs extends any[] = []>(bundler:(entity:Entity, world:World<Entity, Components, Resources>, ...extraArgs:ExtraArgs) => void, ...extraArgs:ExtraArgs) => {
      const entity = entityManager.createEntity();
      bundler(entity, world, ...extraArgs);
      return entity;
    };

    const createChildBundle = <ExtraArgs extends any[] = []>(parent:Entity, bundler:(child:Entity, parent:Entity, world:World<Entity, Components, Resources>, ...extraArgs:ExtraArgs) => void, ...extraArgs:ExtraArgs) => {
      const child = entityManager.createChildEntity(parent);
      if(child){
        bundler(child, parent, world, ...extraArgs);
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