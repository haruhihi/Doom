// Barrel export for all premium scenario content (64 hexagrams x 8 scenarios)

import { premium01 } from './premium/premium-01-16'
import { premium17 } from './premium/premium-17-32'
import { premium33 } from './premium/premium-33-48'
import { premium49 } from './premium/premium-49-64'
import { getLineContent } from './premium-lines/index'
import { scenarioMetas } from './scenario-metas'

var hexagramsPremium: Record<number, IScenarioContent> = {}

function _merge(src: Record<number, IScenarioContent>): void {
  var keys = Object.keys(src)
  for (var i = 0; i < keys.length; i++) {
    hexagramsPremium[Number(keys[i])] = src[Number(keys[i])]
  }
}

_merge(premium01)
_merge(premium17)
_merge(premium33)
_merge(premium49)

export { hexagramsPremium }

// 逐爻情境内容
// positionKey: 'judgment' | 0 | 1 | 2 | 3 | 4 | 5
// 卦辞级别同步返回 string；爻级别异步返回 Promise<string>
export function getLineScenario(hexNumber: number, positionKey: string | number, scenarioKey: ScenarioKey): string | Promise<string> {
  // 卦辞级别直接用 hexagramsPremium（同步）
  if (positionKey === 'judgment') {
    var hexData = hexagramsPremium[hexNumber]
    if (hexData) { return hexData[scenarioKey] || '' }
    return ''
  }

  // 爻级别从 premium-lines 数据异步获取
  var lineIndex = Number(positionKey)

  // fallback 占位提示
  var posLabel = '第' + (lineIndex + 1) + '爻'
  var scenarioLabel = ''
  for (var i = 0; i < scenarioMetas.length; i++) {
    if (scenarioMetas[i].key === scenarioKey) {
      scenarioLabel = scenarioMetas[i].label
      break
    }
  }
  var fallback = '第' + hexNumber + '卦 · ' + posLabel + ' · ' + scenarioLabel + '\n\n此爻位的情境解读内容正在撰写中，敬请期待。'

  return getLineContent(hexNumber, lineIndex, scenarioKey).then(function (content) {
    return content || fallback
  })
}

// scenarioMetas 已提取至 scenario-metas.ts，此处重导出以保持兼容
export { scenarioMetas }
