import { Debug } from "@type-challenges/utils";

export type ComponentMethods<Entity, Components extends Record<string, any>, Flags extends string> = {
  addComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, componentData:Components[ComponentName]):boolean;
  setComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, componentData:Components[ComponentName]):[false]|[true, Components[ComponentName]];
  removeComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName):[false]|[true, Components[ComponentName]];
  updateComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, update:(component:Components[ComponentName]) => Components[ComponentName]):[false]|[true, Components[ComponentName], Components[ComponentName]];
  mutateComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, mutator:(component:Components[ComponentName]) => void):[false]|[true, Components[ComponentName]];
  getComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName):[false]|[true, Components[ComponentName]];
  getComponentNames():Iterable<keyof Components>;
  
  addFlag<FlagName extends Flags>(entity:Entity, flagName:FlagName):boolean;
  removeFlag<FlagName extends Flags>(entity:Entity, flagName:FlagName):boolean;
  hasFlag<FlagName extends Flags>(entity:Entity, flagName:FlagName):boolean;
  getFlagNames():Iterable<Flags>;

  removeAllComponents(entity:Entity):Partial<Components & Record<Flags, true>>;
  getComponents(entity:Entity):Partial<Components & Record<Flags, true>>;

  query<
    RequiredKeys extends (keyof Components) | Flags = never,
    OptionalKeys extends Exclude<(keyof Components) | Flags, RequiredKeys> = never,
    ExcludedKeys extends Exclude<(keyof Components) | Flags, RequiredKeys | OptionalKeys> = never
  >(q?: {
    required?: {
      [RK in RequiredKeys]: RK extends keyof Components ? ((component:Components[RK]) => boolean) | null | undefined : null | undefined
    },
    optional?: OptionalKeys[],
    excluded?:ExcludedKeys[],
  }):Map<Entity,
    Debug<
      & {[RK in RequiredKeys]: RK extends keyof Components ? Components[RK] : true}
      & {[OK in OptionalKeys]?: OK extends keyof Components ? Components[OK] : true}
    >
  >;
};
