import { makeComponentManager } from "./components.ts";
import { makeEntityManager } from "./entities.ts";
import { makeResourcesManager } from "./resources.ts";
import type { World, WorldBuilder } from "./world.types.ts";
export type { World, WorldBuilder };

export function makeWorldBuilder<Entity>(makeEntity:() => Entity):WorldBuilder<Entity, {}, {}, never>{
  function makeWorld<
    Components extends Record<string, any>,
    Resources extends Record<string, any>,
    Flags extends string>
    (
      components:{[K in keyof Components]:Map<Entity, Components[K]>},
      resources:Resources,
      flags:{[K in Flags]:Set<Entity>},
      componentCleanups:{[K in keyof Components]?:(component:Components[K]) => void}
    ):World<Entity, Components, Resources, Flags>{
  
    const entityManager = makeEntityManager(makeEntity);
    const componentManager = makeComponentManager(components, flags, componentCleanups);
    const resourcesManager = makeResourcesManager(resources);

    function *removeEntity(entity:Entity):Iterable<[Entity, Partial<Components>]>{
      for(const removedEntity of entityManager.removeEntity(entity)){
        const removedComponents = componentManager.removeAllComponents(removedEntity);
        yield [removedEntity, removedComponents];
      }
    }

    function *removeAllEntities():Iterable<[Entity, Partial<Components>]>{
      for(const removedEntity of entityManager.removeAllEntities()){
        const removedComponents = componentManager.removeAllComponents(removedEntity);
        yield [removedEntity, removedComponents];
      }
    }

    const createBundle = <ExtraArgs extends any[] = []>(bundler:(entity:Entity, world:World<Entity, Components, Resources, Flags>, ...extraArgs:ExtraArgs) => void, ...extraArgs:ExtraArgs) => {
      const entity = entityManager.createEntity();
      bundler(entity, world, ...extraArgs);
      return entity;
    };

    const createChildBundle = <ExtraArgs extends any[] = []>(parent:Entity, bundler:(child:Entity, parent:Entity, world:World<Entity, Components, Resources, Flags>, ...extraArgs:ExtraArgs) => void, ...extraArgs:ExtraArgs) => {
      const child = entityManager.createChildEntity(parent);
      if(child){
        bundler(child, parent, world, ...extraArgs);
      }
      return child;
    };

    const world:World<Entity, Components, Resources, Flags> = {
      ...entityManager,
      ...componentManager,
      ...resourcesManager,
      removeEntity:(entity) => [...removeEntity(entity)],
      removeAllEntities:() => [...removeAllEntities()],
      createBundle,
      createChildBundle,
    };
    return world;
  }

  function makeWorldBuilderInner<
    Components extends Record<string, any>, 
    Resources extends Record<string, any>, 
    Flags extends string
    >(
      componentMaps:{[K in keyof Components]:Map<Entity, Components[K]>}, 
      resources:Resources,
      flagSets:{[K in Flags]:Set<Entity>},
      componentCleanups: {[K in keyof Components]?: (component:Components[K]) => void}
    ):WorldBuilder<Entity, Components, Resources, Flags>{
    return {
      addResource<ResourceName extends string, ResourceType>(name:ResourceName, value:ResourceType) {
        type NewResources = Resources & Record<ResourceName, ResourceType>
        return makeWorldBuilderInner<Components, NewResources, Flags>(componentMaps, {...resources, [name]:value} as NewResources, flagSets, componentCleanups);
      },
      addComponent<ComponentName extends string, ComponentType>(name:ComponentName, cleanup?:(component:ComponentType, entity:Entity) => void) {
        type NewComponents = Components & Record<ComponentName, ComponentType>;
        if(name in componentMaps || name in flagSets) throw new Error('Name Taken');

        const newCleanups = typeof cleanup === 'function' ? {...componentCleanups, [name]:cleanup} : componentCleanups;
        return makeWorldBuilderInner<NewComponents, Resources, Flags>({...componentMaps, [name]:new Map<Entity, ComponentType>()}, resources, flagSets, newCleanups) as ComponentName extends Flags | keyof Components ? never :
        WorldBuilder<
          Entity, 
          {[K in (keyof Components)|ComponentName]:
            K extends keyof Components ? Components[K] : ComponentType
          },
          Resources,
          Flags
          >;
      },
      addFlag<FlagName extends string>(name:FlagName){
        if(name in componentMaps || name in flagSets) throw new Error('Name Taken');
        type NewFlags = Flags | FlagName;
        return makeWorldBuilderInner<Components, Resources, NewFlags>(componentMaps, resources, {
          ...flagSets,
          [name]: new Set<Entity>()
        } as {[K in NewFlags]:Set<Entity>}, componentCleanups) as FlagName extends Flags | keyof Components ? never :
          WorldBuilder<
            Entity,
            Components,
            Resources,
            Flags | FlagName
          >
      },
      world: () => makeWorld<Components, Resources, Flags>(componentMaps, resources, flagSets, componentCleanups),
    }
  }

  return makeWorldBuilderInner({}, {}, {}, {});
}