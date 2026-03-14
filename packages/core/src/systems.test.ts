import { makeStageHandlerSet, makeSystemManager } from "./systems";

type TestWorld = {
  running?: boolean
};

type Stages = "SETUP"|"UPDATE"|"RENDER"|"CLEANUP";

const systemManager =  makeSystemManager<TestWorld, Stages>(
  {
    CLEANUP: makeStageHandlerSet<TestWorld>(),
    SETUP: makeStageHandlerSet<TestWorld>(),
    UPDATE: makeStageHandlerSet<TestWorld>(),
    RENDER: makeStageHandlerSet<TestWorld>(),
  }
)

systemManager.post('SETUP', (world, schedule) => {
  schedule(() => systemManager.runStage('RENDER', world));
});
systemManager.post('UPDATE', (world, schedule) => {
  schedule(() => systemManager.runStage('RENDER', world));
});
systemManager.post('RENDER', (world, schedule) => {
  schedule(() => {
    if(world.running){
      process.nextTick(() => systemManager.runStage('UPDATE', world));
    } else {
      schedule(() => systemManager.runStage('CLEANUP', world));
    }
  })
})