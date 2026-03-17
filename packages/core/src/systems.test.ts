import { makeSystemsBuilder } from "./systems"

describe('SystemsBuilder', () => {
  it('Creates System Methods', () => {
    const world = {};
    const handler = jest.fn();

    const systems = makeSystemsBuilder(world)
      .addStage('stage')
      .systems();
    
    systems.post('stage', (world) => handler('post', world));
    systems.on('stage', (world) => handler('on', world));
    systems.pre('stage', (world) => handler('pre', world));

    expect(handler).not.toHaveBeenCalled();
    systems.runStage('stage');

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler.mock.calls).toEqual([['pre', world], ['on', world], ['post', world]]);
  });

  it('allows scheduling for post', () => {
    const world = {};
    const calls:string[] = [];
    const makeHandler = (label:string) => (_:any, schedule:(fn:() => void) => void) => {
      calls.push(label);
      schedule(() => calls.push(`scheduled:${label}`));
    }

    const systems = makeSystemsBuilder(world)
      .addStage('stage')
      .systems();

    systems.post('stage', makeHandler('post'));
    systems.on('stage', makeHandler('on'));
    systems.pre('stage', makeHandler('pre'));

    expect(calls).toEqual([])
    systems.runStage('stage');
    expect(calls.join('|')).toEqual('pre|on|post|scheduled:pre|scheduled:on|scheduled:post');
  });
  describe('error handling', () => {

    it('crashes on error in pre', () => {
      const calls:string[] = [];
      const systems = makeSystemsBuilder(null)
      .addStage('stage')
      .systems();
      const error = new Error('!');
      systems.pre('stage', (_, schedule) => {
        calls.push('pre');
        schedule(() => calls.push('scheduled'));
        throw error;
      });
      systems.on('stage', () => calls.push('on'));
      systems.post('stage', () => calls.push('post'));

      expect(calls).toEqual([]);
      expect(() => { systems.runStage('stage'); }).toThrow(error);
      expect(calls).toEqual(['pre']);
    });
    it('crashes on error in "on"', () => {
      const calls:string[] = [];
      const systems = makeSystemsBuilder(null)
      .addStage('stage')
      .systems();
      const error = new Error('!');
      systems.pre('stage', (_, schedule) => {
        calls.push('pre');
        schedule(() => calls.push('scheduled:pre'));
      });
      systems.on('stage', (_, schedule) => {
        calls.push('on');
        schedule(() => calls.push('on'));
        throw error;
      });
      systems.post('stage', () => calls.push('post'));

      expect(calls).toEqual([]);
      expect(() => { systems.runStage('stage'); }).toThrow(error);
      expect(calls).toEqual(['pre', 'on']);
    });
    it('crashes on error in "post"', () => {
      const calls:string[] = [];
      const systems = makeSystemsBuilder(null)
      .addStage('stage')
      .systems();
      const error = new Error('!');
      systems.pre('stage', (_, schedule) => {
        calls.push('pre');
        schedule(() => calls.push('scheduled:pre'));
      });
      systems.on('stage', (_, schedule) => {
        calls.push('on');
        schedule(() => calls.push('scheduled:on'));
      });
      systems.post('stage', (_, schedule) => {
        calls.push('post');
        schedule(() => calls.push('scheduled:post'));
        throw error;
      });

      expect(calls).toEqual([]);
      expect(() => { systems.runStage('stage'); }).toThrow(error);
      expect(calls).toEqual(['pre', 'on', 'post']);
    });
  });
});
