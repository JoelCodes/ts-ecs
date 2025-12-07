export type ResourcesMethods<Resources extends Record<string, any>> = {
  getResource<ResourceName extends keyof Resources>(name:ResourceName):Resources[ResourceName];
  setResource<ResourceName extends keyof Resources>(name:ResourceName, resource:Resources[ResourceName]):Resources[ResourceName];
  updateResource<ResourceName extends keyof Resources>(name:ResourceName, updater:(resource:Resources[ResourceName]) => Resources[ResourceName]):[old:Resources[ResourceName], new:Resources[ResourceName]];
  mutateResource<ResourceName extends keyof Resources>(name:ResourceName, mutator:(resource:Resources[ResourceName]) => void):Resources[ResourceName];
}
