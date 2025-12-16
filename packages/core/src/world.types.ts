import { ComponentMethods } from "./components.types";
import { EntityMethods } from "./entities.types";
import { ResourcesMethods } from "./resources.types";

export type World<Entity, Components extends Record<string, any>, Resources extends Record<string, any>, Flags extends string> =
  & Omit<EntityMethods<Entity>, 'removeEntity' | 'removeAllEntities'>
  & ComponentMethods<Entity, Components, Flags>
  & ResourcesMethods<Resources>
  & {
    createBundle<ExtraArgs extends any[] = []>(bundler:(entity:Entity, world:World<Entity, Components, Resources, Flags>, ...extraArgs:ExtraArgs) => void, ...extraArgs:ExtraArgs):Entity;
    createChildBundle<ExtraArgs extends any[] = []>(parent:Entity, bundler:(child:Entity, parent:Entity, world:World<Entity, Components, Resources, Flags>, ...extraArgs:ExtraArgs) => void, ...args:ExtraArgs):Entity|undefined;
    removeEntity(entity:Entity):Iterable<[Entity, Partial<Components>]>;
    removeAllEntities():Iterable<[Entity, Partial<Components>]>;
  };

export type WorldBuilder<Entity, Components extends Record<string, any>, Resources extends Record<string, any>, Flags extends string> = {
  world():World<Entity, Components, Resources, Flags>;
  addComponent<ComponentName extends string, ComponentType>(name:ComponentName, cleanup?:(component:ComponentType, entity:Entity) => void):ComponentName extends Flags | keyof Components ? never :
    WorldBuilder<
      Entity, 
      {[K in (keyof Components)|ComponentName]:
        K extends keyof Components ? Components[K] : ComponentType
      }, 
      Resources,
      Flags
      >;
  addResource<ResourceName extends string, ResourceType>(name:ResourceName, value:ResourceType, onChange?:(currentValue:ResourceType, oldValue?:ResourceType) => void):
    WorldBuilder<
      Entity, 
      Components, 
      {[K in (keyof Resources)|ResourceName]:
        K extends keyof Resources ? Resources[K] : ResourceType
      },
      Flags>;
  addFlag<FlagName extends string>(name:FlagName): FlagName extends Flags | keyof Components ? never :
    WorldBuilder<
      Entity,
      Components,
      Resources,
      Flags | FlagName
    >;
}
