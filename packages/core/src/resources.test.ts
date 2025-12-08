import { makeResourcesManager } from "./resources"

describe('ResourcesMethods', () => {
  it('gets a resource', () => {
    const resourceManager = makeResourcesManager({time: 30});
    expect(resourceManager.getResource('time')).toBe(30);
  });
  it('sets a resource', () => {
    const resourceManager = makeResourcesManager({time: 30});
    expect(resourceManager.setResource('time', 60)).toBe(30);
    expect(resourceManager.getResource('time')).toBe(60);
  });
  it('updates a resource', () => {
    const resourceManager = makeResourcesManager({time: 30});
    expect(resourceManager.updateResource('time', (n) => n + 30)).toEqual([30, 60]);
    expect(resourceManager.getResource('time')).toBe(60);
  });
  it('mutates a resource', () => {
    const time = {last: 40, delta:0};
    const newTime = 70;
    const resourceManager = makeResourcesManager({time});
    const mutator = (time:{last:number, delta:number}) => {
      time.delta = newTime - time.last;
      time.last = newTime;
    };
    expect(resourceManager.mutateResource('time', mutator)).toBe(time);
    expect(time).toEqual({last: 70, delta: 30});
  });
});
