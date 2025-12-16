import { makeResourcesManager } from "./resources"

describe('ResourcesMethods', () => {
  it('gets a resource', () => {
    const resourceManager = makeResourcesManager({time: 30}, {});
    expect(resourceManager.getResource('time')).toBe(30);
  });
  it('sets a resource', () => {
    const onTimeChange = jest.fn<void, [number, number?]>()
    const resourceManager = makeResourcesManager({time: 30}, { time: onTimeChange });
    expect(onTimeChange).not.toHaveBeenCalled();
    expect(resourceManager.setResource('time', 60)).toBe(30);
    expect(onTimeChange).toHaveBeenCalledWith(60, 30)
    expect(resourceManager.getResource('time')).toBe(60);
  });
  it('updates a resource', () => {
    const onTimeChanged = jest.fn<void, [number, number?]>()
    const resourceManager = makeResourcesManager({time: 30}, { time: onTimeChanged });

    expect(onTimeChanged).not.toHaveBeenCalled();

    expect(resourceManager.updateResource('time', (n) => n + 30)).toEqual([30, 60]);
    expect(onTimeChanged).toHaveBeenCalledWith(60, 30)
    expect(resourceManager.getResource('time')).toBe(60);
  });
  it('mutates a resource', () => {
    const onTimeChange = jest.fn<void, [{last:number, delta:number}]>();
    const time = {last: 40, delta:0};
    const newTime = 70;
    const resourceManager = makeResourcesManager({time}, {time: onTimeChange});
    const mutator = (time:{last:number, delta:number}) => {
      time.delta = newTime - time.last;
      time.last = newTime;
    };
    expect(onTimeChange).not.toHaveBeenCalled();
    expect(resourceManager.mutateResource('time', mutator)).toBe(time);
    expect(onTimeChange).toHaveBeenCalledWith({
      last: 70, delta: 30
    });
    expect(time).toEqual({last: 70, delta: 30});
  });
});
