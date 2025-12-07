import { ComponentMethods } from "./components.types";
import { EntityMethods } from "./entities.types";
import { ResourcesMethods } from "./resources.types";

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
