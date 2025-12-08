import { Debug } from "@type-challenges/utils";

export type ComponentMethods<Entity, Components extends Record<string, any>> = {
  addComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, componentData:Components[ComponentName]):boolean;
  setComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, componentData:Components[ComponentName]):[false]|[true, Components[ComponentName]];
  removeComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName):[false]|[true, Components[ComponentName]];
  removeAllComponents(entity:Entity):Partial<Components>;
  getComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName):[false]|[true, Components[ComponentName]];
  getComponents(entity:Entity):Partial<Components>;
  updateComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, update:(component:Components[ComponentName]) => Components[ComponentName]):[false]|[true, Components[ComponentName], Components[ComponentName]];
  mutateComponent<ComponentName extends keyof Components>(entity:Entity, componentName:ComponentName, mutator:(component:Components[ComponentName]) => void):[false]|[true, Components[ComponentName]];
  query<ExcludedKeys extends keyof Components>(query?: {
    excluded?:ExcludedKeys[];
  }):Map<Entity, {}>;
  query<OptionalKeys extends keyof Components>(
    query: {
      optional: OptionalKeys[];
    }
  ):Map<Entity, { [OK in OptionalKeys]?: Components[OK] }>;
  query<
    OptionalKeys extends keyof Components,
    ExcludedKeys extends Exclude<keyof Components, OptionalKeys>
  >(
    query: {
      optional: OptionalKeys[];
      excluded: ExcludedKeys[];
    }
  ):Map<Entity, { [OK in OptionalKeys]?: Components[OK] }>;
  query<RequiredKeys extends keyof Components>(query: {
    required: {
      [RK in RequiredKeys]:
        | undefined
        | null
        | ((component:Components[RK]) => boolean)
    }
  }):Map<Entity, { [RK in RequiredKeys]: Components[RK] }>;
  query<
    RequiredKeys extends keyof Components, 
    ExcludedKeys extends Exclude<keyof Components, RequiredKeys>
  >(query: {
    required: {
      [RK in RequiredKeys]:
        | undefined
        | null
        | ((component:Components[RK]) => boolean)
    },
    excluded:ExcludedKeys[],
  }):Map<Entity, { [RK in RequiredKeys]: Components[RK] }>;
  query<
    RequiredKeys extends keyof Components,
    OptionalKeys extends Exclude<keyof Components, RequiredKeys>
  >(query: {
    required: {
      [RK in RequiredKeys]:
        | undefined
        | null
        | ((component:Components[RK]) => boolean);
    },
    optional:OptionalKeys[]
  }):Map<Entity, Debug<
    & { [RK in RequiredKeys]: Components[RK] }
    & { [OK in OptionalKeys]?: Components[OK] }
  >>;
  query<
    RequiredKeys extends keyof Components,
    OptionalKeys extends Exclude<keyof Components, RequiredKeys>,
    ExcludedKeys extends Exclude<keyof Components, RequiredKeys | OptionalKeys>
  >(query: {
    required: {
      [RK in RequiredKeys]:
        | undefined
        | null
        | ((component:Components[RK]) => boolean)
    },
    optional:OptionalKeys[],
    excluded:ExcludedKeys[],
  }):Map<Entity, Debug<
    & { [RK in RequiredKeys]: Components[RK] }
    & { [OK in OptionalKeys]?: Components[OK] }
  >>;
};
