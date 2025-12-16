import { ResourcesMethods } from "./resources.types";

export function makeResourcesManager<Resources extends Record<string, any>>({...resources}:Resources, onChange:{[K in keyof Resources]?:(value:Resources[K], oldValue?:Resources[K]) => void}):ResourcesMethods<Resources>{
  const getResource = <ResourceName extends keyof Resources>(name:ResourceName):Resources[ResourceName] => {
    return resources[name];
  }
  const setResource = <ResourceName extends keyof Resources>(name:ResourceName, resource:Resources[ResourceName]):Resources[ResourceName] => {
    const current = resources[name];
    resources[name] = resource;
    onChange[name]?.(resource, current);
    return current;
  };

  const updateResource = <ResourceName extends keyof Resources>(name:ResourceName, updater:(resource:Resources[ResourceName]) => Resources[ResourceName]): [last: Resources[ResourceName], current: Resources[ResourceName]] => {
    const last = resources[name];
    const current = updater(resources[name]);
    resources[name] = current;
    onChange[name]?.(current, last);
    return [last, current];
  };

  const mutateResource = <ResourceName extends keyof Resources>(name:ResourceName, mutator:(resource:Resources[ResourceName]) => void):Resources[ResourceName] => {
    const result = resources[name];
    mutator(result);
    onChange[name]?.(result);
    return resources[name];
  }

  return {
    getResource,
    setResource,
    updateResource,
    mutateResource,
  };
}