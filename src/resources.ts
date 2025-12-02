export type ResourcesMethods<Resources extends Record<string, any>> = {
  getResource<ResourceName extends keyof Resources>(name:ResourceName):Resources[ResourceName];
  setResource<ResourceName extends keyof Resources>(name:ResourceName, resource:Resources[ResourceName]):Resources[ResourceName];
  updateResource<ResourceName extends keyof Resources>(name:ResourceName, updater:(resource:Resources[ResourceName]) => Resources[ResourceName]):[old:Resources[ResourceName], new:Resources[ResourceName]];
  mutateResource<ResourceName extends keyof Resources>(name:ResourceName, mutator:(resource:Resources[ResourceName]) => void):Resources[ResourceName];
}

export function makeResourcesManager<Resources extends Record<string, any>>({...resources}:Resources):ResourcesMethods<Resources>{
  const getResource = <ResourceName extends keyof Resources>(name:ResourceName):Resources[ResourceName] => {
    return resources[name];
  }
  const setResource = <ResourceName extends keyof Resources>(name:ResourceName, resource:Resources[ResourceName]):Resources[ResourceName] => {
    const current = resources[name];
    resources[name] = resource;
    return current;
  };

  const updateResource = <ResourceName extends keyof Resources>(name:ResourceName, updater:(resource:Resources[ResourceName]) => Resources[ResourceName]): [last: Resources[ResourceName], current: Resources[ResourceName]] => {
    const last = resources[name];
    const current = updater(resources[name]);
    resources[name] = current;
    return [last, current];
  };

  const mutateResource = <ResourceName extends keyof Resources>(name:ResourceName, mutator:(resource:Resources[ResourceName]) => void):Resources[ResourceName] => {
    mutator(resources[name]);
    return resources[name];
  }

  return {
    getResource,
    setResource,
    updateResource,
    mutateResource,
  };
}