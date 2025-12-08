import { ComponentMethods } from './components.types';

export function makeComponentManager<Entity, Components extends Record<string, any>>(components:{[K in keyof Components]:Map<Entity, Components[K]>}):ComponentMethods<Entity, Components>{
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

  const getComponents = (entity:Entity):Partial<Components> => {
    const output:Partial<Components> = {};
    for(const [name, componentMap] of Object.entries(components) as Iterable<[keyof Components, Map<Entity, Components[keyof Components]>]>){
      if(componentMap.has(entity)){
        output[name] = componentMap.get(entity);
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
    return [true, component];
  };

  const removeAllComponents = (entity:Entity):Partial<Components> => {
    const output:Partial<Components> = {};

    for(const [name, componentMap] of Object.entries(components) as Iterable<[keyof Components, Map<Entity, Components[keyof Components]>]>){
      if(componentMap.has(entity)){
        output[name] = componentMap.get(entity);
        componentMap.delete(entity);
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

  const _queryWithRequired = <
    RequiredKeys extends keyof Components,
    OptionalKeys extends keyof Components,
    ExcludedKeys extends keyof Components
  >(required:  {
      [RK in RequiredKeys]:
        | undefined
        | null
        | ((component:Components[RK]) => boolean)
    }, 
    optional:OptionalKeys[] = [],
    excluded:ExcludedKeys[] = [],
  ):Map<Entity, any> => {
    const output = new Map<Entity, any>();
    let first = true;
    for(const [componentName, componentQuery] of Object.entries(required) as Iterable<[RequiredKeys, undefined |((component:Components[RequiredKeys]) => boolean)]>){
      const componentMap = components[componentName];
      if(first){
        for(const [entity, component] of componentMap.entries()){
          if(typeof componentQuery !== 'function' || componentQuery(component))
          output.set(entity, {[componentName as keyof Components]: component} as any as Partial<Components>);
        }
        first = false;
      } else {
        for(const [entity, queryResult] of output.entries()){
          if(componentMap.has(entity)){
            const component = componentMap.get(entity)!;
            if(typeof componentQuery !== 'function' || componentQuery(component)){
              (queryResult as any)[componentName] = component;
              continue;
            }
          }
          output.delete(entity)
        }
      }
    }
    if(output.size === 0) return output;

    for(const excludedKey of excluded ?? []){
      const componentMap = components[excludedKey];
      for(const entity of output.keys()){
        if(componentMap.has(entity)){
          output.delete(entity);
        }
      }
    }

    for(const optionalKey of optional ?? []){
      const componentMap = components[optionalKey];
      for(const [entity, queryResult] of output.entries()){
        (queryResult as any)[optionalKey] = componentMap.get(entity);
      }
    }

    return output;
  }

  const _queryWithoutRequired = <
    OptionalKeys extends keyof Components, 
    ExcludedKeys extends keyof Components,
  >(
    optional:OptionalKeys[] = [],
    excluded:ExcludedKeys[] = []
  ):Map<Entity, any> => {
    const output = new Map<Entity, any>();
    for(const [componentName, componentMap] of Object.entries(components) as Iterable<[keyof Components, Map<Entity, any>]>){
      if((optional as (keyof Components)[]).includes(componentName)){
        for(const [entity, component] of componentMap.entries()){
          if(output.has(entity)){
            output.get(entity)![componentName] = component;
          } else {
            output.set(entity, {[componentName]: component});
          }
        }
      } else {
        for(const entity of componentMap.keys()){
          if(!output.has(entity)){
            output.set(entity, {});
          }
        }
      }
    }

    for(const excludedKey of excluded){
      for(const entity of components[excludedKey].keys()){
        output.delete(entity);
      }
    }

    return output;
  }

  function query<
    RequiredKeys extends keyof Components,
    OptionalKeys extends keyof Components,
    ExcludedKeys extends keyof Components
  >({
    required,
    optional,
    excluded
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
      return _queryWithRequired<RequiredKeys, OptionalKeys, ExcludedKeys>(required, optional, excluded);
    }
    return _queryWithoutRequired<OptionalKeys, ExcludedKeys>(optional, excluded);
  }
  
  const componentMethods:ComponentMethods<Entity, Components> = {
    addComponent,
    getComponent,
    getComponents,
    removeComponent,
    setComponent,
    updateComponent,
    mutateComponent,
    removeAllComponents,
    query,
  };

  return componentMethods;
}
