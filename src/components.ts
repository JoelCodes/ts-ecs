export type ComponentMethods<Entity, Components extends Record<string, any>> = {
  addComponent<ComponentName extends keyof Components>(entity:Entity, name:ComponentName, component:Components[ComponentName]):boolean;
  setComponent<ComponentName extends keyof Components>(entity:Entity, name:ComponentName, component:Components[ComponentName]):[false]|[true, Components[ComponentName]];
  removeComponent<ComponentName extends keyof Components>(entity:Entity, name:ComponentName):[false]|[true, Components[ComponentName]];
  removeAllComponents(entity:Entity):Partial<Components>;
  getComponent<ComponentName extends keyof Components>(entity:Entity, name:ComponentName):[false]|[true, Components[ComponentName]];
  getComponents(entity:Entity):Partial<Components>;
  updateComponent<ComponentName extends keyof Components>(entity:Entity, name:ComponentName, update:(component:Components[ComponentName]) => Components[ComponentName]):[false]|[true, Components[ComponentName], Components[ComponentName]];
  mutateComponent<ComponentName extends keyof Components>(entity:Entity, name:ComponentName, mutator:(component:Components[ComponentName]) => void):[false]|[true, Components[ComponentName]];
  
  query<QuerySet extends Partial<Components>>(
    q:{
      [K in keyof QuerySet]:
        | undefined
        | ((component:Exclude<QuerySet[K], undefined>) => boolean);
    }, 
    exclude?:(keyof Components)[]
  ):Map<Entity, QuerySet>;
};

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

  const mutateComponent = <ComponentName extends keyof Components>(entity:Entity, name:ComponentName, mutator:(component:Components[ComponentName]) => void):[false]|[true, Components[ComponentName]] => {
    const componentMap = components[name];
    if(!componentMap.has(entity)) return [false];
    const component = componentMap.get(entity)!;
    mutator(component);
    return [true, component];
  };

  const query = <QuerySet extends Partial<Components>>(
    q:{
      [K in keyof QuerySet]:
        | undefined
        | ((component:Exclude<QuerySet[K], undefined>) => boolean);
    }, 
    excludedNames:(keyof Components)[] = []
  ):Map<Entity, QuerySet> => {
    const output = new Map<Entity, QuerySet>();
    let first = true;
    for(const [name, componentQuery] of Object.entries(q) as Iterable<[keyof QuerySet, ((component:QuerySet[keyof QuerySet]) => boolean)|undefined]>){
      const componentMap = components[name as keyof Components];
      if(first){
        for(const [entity, component] of componentMap.entries()){
          if(typeof componentQuery !== 'function' || componentQuery(component as any as QuerySet[keyof QuerySet])){
            output.set(entity, {[name]:component} as QuerySet);
          }
        }
        first = false;
      } else {
        for(const [entity, querySet] of [...output.entries()]){
          if(componentMap.has(entity) && (typeof componentQuery !== 'function' || componentQuery(componentMap.get(entity) as any as QuerySet[keyof QuerySet]))){
            (querySet as any)[name] = componentMap.get(entity)!
          } else {
            output.delete(entity);
          }
        }
      }
    }
    for(const excludedName of excludedNames){
      const componentMap = components[excludedName];
      for(const entity of output.keys()){
        if(componentMap.has(entity)){
          output.delete(entity);
        }
      }
    }
    return output;
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