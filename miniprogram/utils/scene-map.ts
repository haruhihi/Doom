// 场景查找表（共享模块，避免 index.ts 与 history.ts 重复构建）
import { scenarioMetas } from '../data/scenario-metas'

var sceneMap: Record<string, IScenarioMeta> = {}
for (var i = 0; i < scenarioMetas.length; i++) {
  sceneMap[scenarioMetas[i].key] = scenarioMetas[i]
}

export { sceneMap }
