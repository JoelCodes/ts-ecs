export type EntityMethods<Entity> = {
  /**
   * Creates an entity and registers it with the system.
   */
  createEntity():Entity;
  /**
   * Creates an entity as the child of another entity.
   * 
   * If the parent is removed, this child will be removed as well.
   * 
   * If the parent is not in the system, this child will not be created, and the function will return `undefined`.
   * 
   * @param parent Parent entity
   */
  createChildEntity(parent:Entity):Entity|undefined;
  /**
   * Returns true if the entity is in the system.
   * 
   * @param entity 
   */
  hasEntity(entity:Entity):boolean;
  /**
   * Returns an iterable of all the entities currently in this world.
   */
  allEntities():Iterable<Entity>;
  /**
   * Gets all the direct children of an entity.
   * 
   * If this entity is not in the system, or has no children, it will emit no entities.
   * 
   * > This only returns first-level children, not all the descendants in the tree.
   * 
   * @param entity Parent
   */
  getChildren(entity:Entity):Iterable<Entity>;
  /**
   * Gets the parent (if any) of an entity.
   * 
   * @param entity Child Entity
   */
  getParent(entity:Entity):Entity|undefined;
  /**
   * Removes an entity from the system, as well all its descendants.
   * 
   * @param entity Entity to remove
   */
  removeEntity(entity:Entity):Iterable<Entity>;
  /**
   * Removes all the entities from a system.
   */
  removeAllEntities():Iterable<Entity>;
}