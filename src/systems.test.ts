import { wrapSystems } from "./systems";

describe("wrapSystems", () => {
  it('allows adding and removing systems', () => {
    const onRender = jest.fn<void, [number]>();
    const onUpdate1 = jest.fn<void, [number]>();
    const onUpdate2 = jest.fn<void, [number]>();

    const systems = wrapSystems(4);
    const onRenderUnSub = systems.addSystem('render', onRender);
    const onUpdate1UnSub = systems.addSystem('update', onUpdate1);
    systems.addSystem('update', onUpdate2);

    expect(onRender).not.toHaveBeenCalled();
    systems.runStage('render');
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledWith(4);

    onRender.mockClear();
    onRenderUnSub();
    systems.runStage('render');
    expect(onRender).not.toHaveBeenCalled();


    expect(onUpdate1).not.toHaveBeenCalled();
    expect(onUpdate2).not.toHaveBeenCalled();

    systems.runStage('update');
    expect(onUpdate1).toHaveBeenCalledTimes(1);
    expect(onUpdate1).toHaveBeenCalledWith(4);

    expect(onUpdate2).toHaveBeenCalledTimes(1);
    expect(onUpdate2).toHaveBeenCalledWith(4);

    onUpdate1UnSub();
    systems.runStage('update');
    expect(onUpdate2).toHaveBeenCalledTimes(2);
    expect(onUpdate2).toHaveBeenLastCalledWith(4);
    expect(onUpdate1).toHaveBeenCalledTimes(1);
  })
})