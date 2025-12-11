import { ComponentMethods } from './components.types';

export function makeComponentManager<
  Entity,
  Components extends Record<string, any>,
  Flags extends string
>(
  components:{[K in keyof Components]:Map<Entity, Components[K]>},
  flags:{[K in Flags]:Set<Entity>},
  componentCleanups:{[K in keyof Components]?:(component:Components[K], entity:Entity) => void} = {}
):ComponentMethods<Entity, Components, Flags>{
  const addComponent = <ComponentName extends keyof Components>(entity:Entity, name:ComponentName, component:Components[ComponentName]): boolean => {
    const componentMap = components[name];
    if(componentMap.has(entity)) return false;
    componentMap.set(entity, component);
    return true;
  };

  const getComponent = <ComponentName extends keyof Components>(entity:Entity, name:ComponentName):[false]|[true, Components[ComponentName]] => {
    const componentMap = components[name];
    if(!componentMap.has(entity)) return [false];
    return [true, componentMap.get(entity)!];
  };

  const getComponents = (entity:Entity):Partial<Components & Record<Flags, true>> => {
    const output:Partial<Components & Record<Flags, true>> = {};
    for(const [name, componentMap] of Object.entries(components) as Iterable<[keyof Components, Map<Entity, Components[keyof Components]>]>){
      if(componentMap.has(entity)){
        output[name] = componentMap.get(entity);
      }
    }
    
    for(const [name, flagSet] of Object.entries(flags) as Iterable<[Flags, Set<Entity>]>){
      if(flagSet.has(entity)){
        (output as Partial<Record<Flags, true>>)[name] = true;
      }
    }

    return output;
  };

  const removeComponent = <ComponentName extends keyof Components>(entity:Entity, name:ComponentName):[false]|[true, Components[ComponentName]] => {
    const componentMap = components[name];
    if(!componentMap.has(entity)){
      return [false];
    }
    const component = componentMap.get(entity)!;
    componentMap.delete(entity);
    componentCleanups[name]?.(component, entity);
    return [true, component];
  };

  const removeAllComponents = (entity:Entity):Partial<Components & Record<Flags, true>> => {
    const output:Partial<Components & Record<Flags, true>> = {};

    for(const [name, componentMap] of Object.entries(components) as Iterable<[keyof Components, Map<Entity, Components[keyof Components]>]>){
      if(componentMap.has(entity)){
        const component = componentMap.get(entity)!;
        output[name] = component;
        componentMap.delete(entity);
        componentCleanups[name]?.(component, entity);
      }
    }

    for(const [name, flagSet] of Object.entries(flags) as Iterable<[Flags, Set<Entity>]>){
      if(flagSet.has(entity)){
        (output as Partial<Record<Flags, true>>)[name] = true;
        flagSet.delete(entity);
      }
    }
    return output;
  }

  const setComponent = <ComponentName extends keyof Components>(entity:Entity, name:ComponentName, component:Components[ComponentName]):[false]|[true, Components[ComponentName]] => {
    const componentMap = components[name];
    const result:[false]|[true, Components[ComponentName]] = componentMap.has(entity) ? [true, componentMap.get(entity)!] : [false];
    componentMap.set(entity, component);
    return result;
  };

  const updateComponent = <ComponentName extends keyof Components>(entity:Entity, name:ComponentName, update:(component:Components[ComponentName]) => Components[ComponentName]):[false]|[true, Components[ComponentName], Components[ComponentName]] => {
    const componentMap = components[name];
    if(!componentMap.has(entity)) return [false];
    const oldComponent = componentMap.get(entity)!;
    const newComponent = update(oldComponent);
    componentMap.set(entity, newComponent);
    return [true, oldComponent, newComponent];
  };

  const mutateComponent = <
    ComponentName extends keyof Components
  >(
    entity:Entity, 
    name:ComponentName, 
    mutator:(component:Components[ComponentName]) => void
  ):[false]|[true, Components[ComponentName]] => {
    const componentMap = components[name];
    if(!componentMap.has(entity)) return [false];
    const component = componentMap.get(entity)!;
    mutator(component);
    return [true, component];
  };

  const _isFlag = (key:(keyof Components)|Flags):key is Flags => key in flags;
  function query<
    RequiredKeys extends (keyof Components)|Flags,
    OptionalKeys extends (keyof Components)|Flags,
    ExcludedKeys extends (keyof Components)|Flags
  >({
    required,
    optional = [],
    excluded = []
  }:{
    required?: {
      [RK in RequiredKeys]:
        | undefined
        | null
        | ((component: Components[RK]) => boolean)
    },
    optional?: OptionalKeys[],
    excluded?: ExcludedKeys[],
  } = {}):Map<Entity, any>{
    if(required){
      const queryResults = new Map<Entity, any>();
      const requiredEntries = Object.entries(required);
      if(requiredEntries.length === 0) return queryResults;
      const [[firstKey, firstQuery], ...otherEntries] = requiredEntries;
      if(_isFlag(firstKey)){
        const flagSet = flags[firstKey];
        for(const entity of flagSet){
          queryResults.set(entity, {[firstKey]: true});
        }
      } else {
        const componentMap = components[firstKey];
        for(const [entity, component] of componentMap.entries()){
          if(typeof firstQuery !== 'function' || firstQuery(component)){
            queryResults.set(entity, {[firstKey]: component});
          }
        }
      }
      for(const [key, query] of otherEntries){
        if(_isFlag(key)){
          const flagSet = flags[key];
          for(const [entity, queryResult] of [...queryResults.entries()]){
            if(flagSet.has(entity)){
              queryResult[key] = true;
            } else {
              queryResults.delete(entity);
            }
          }
        } else {
          const componentMap = components[key];
          for(const [entity, queryResult] of [...queryResults.entries()]){
            if(!componentMap.has(entity)){
              queryResults.delete(entity);
            } else {
              const component = componentMap.get(entity);
              if(typeof query !== 'function' || query(component)){
                queryResult[key] = component
              } else {
                queryResults.delete(entity);
              }
            }
          }
        }
      }

      for(const excludedKey of excluded){
        const excludedHasser:{has(entity:Entity):boolean} = _isFlag(excludedKey) ? flags[excludedKey] : components[excludedKey];
        for(const entity of [...queryResults.keys()]){
          if(excludedHasser.has(entity)){
            queryResults.delete(entity);
          }
        }
      }

      for(const optionalKey of optional){
        if(_isFlag(optionalKey)){
          const flagSet = flags[optionalKey];
          for(const [entity, queryResult] of queryResults.entries()){
            if(flagSet.has(entity)){
              queryResult[optionalKey] = true;
            }
          }
        } else {
          const componentMap = components[optionalKey];
          for(const [entity, queryResult] of queryResults.entries()){
            if(componentMap.has(entity)){
              queryResult[optionalKey] = componentMap.get(entity);
            }
          }
        }
      }
      return queryResults;
    }
    const queryResults = new Map<Entity, any>();
    for(const [componentName, componentMap] of Object.entries(components)){
      if((excluded as string[]).includes(componentName)) continue;
      const isOptional = (optional as string[]).includes(componentName);
      for(const [entity, component] of (componentMap as Map<Entity, Components[keyof Components]>).entries()){
        if(queryResults.has(entity)){
          if(isOptional){
            queryResults.get(entity)![componentName] = component
          }
        } else {
          queryResults.set(entity, isOptional ? {[componentName]:component} : {});
        }
      }
    }
    for(const [flagName, flagSet] of Object.entries(flags)){
      if((excluded as string[]).includes(flagName)) continue;
      const isOptional = (optional as string[]).includes(flagName);
      for(const entity of (flagSet as Set<Entity>).keys()){
        if(queryResults.has(entity)){
          if(isOptional){
            queryResults.get(entity)![flagName] = true;
          }
        } else {
          queryResults.set(entity, isOptional ? {[flagName]: true} : {})
        }
      }
    }
    for(const excludedKey of excluded){
      const excludedEntities:Iterable<Entity> = _isFlag(excludedKey) ? flags[excludedKey] : components[excludedKey].keys();
      for(const excludedEntity of excludedEntities){
        queryResults.delete(excludedEntity);
      }
    }
    return queryResults
  }
  
  const getComponentNames = ():Iterable<keyof Components> => Object.keys(components);

  const hasFlag = <FlagName extends Flags>(entity:Entity, name:FlagName):boolean => flags[name].has(entity);
  const addFlag = <FlagName extends Flags>(entity:Entity, name:FlagName):boolean => {
    const flagSet = flags[name];
    if(flagSet.has(entity)) return false;
    flagSet.add(entity);
    return true;
  };

  const removeFlag = <FlagName extends Flags>(entity:Entity, name:FlagName):boolean => {
    const flagSet = flags[name];
    if(!flagSet.has(entity)) return false;
    flagSet.delete(entity);
    return true;
  }
  const getFlagNames = () => Object.keys(flags) as Flags[];

  const componentMethods:ComponentMethods<Entity, Components, Flags> = {
    addComponent,
    getComponent,
    getComponentNames,
    getComponents,
    removeComponent,
    setComponent,
    updateComponent,
    mutateComponent,
    removeAllComponents,
    query,
    addFlag,
    removeFlag,
    hasFlag,
    getFlagNames,
  };

  return componentMethods;
}
