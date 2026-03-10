// 爻级场景数据入口（分包加载）
// 合并4个数据分片为完整的 64卦 x 6爻 x 8场景 映射

import { lines01 } from './lines-01-16'
import { lines17 } from './lines-17-32'
import { lines33 } from './lines-33-48'
import { lines49 } from './lines-49-64'

var _allLines: ILineScenarioMap = {}

function _merge(src: ILineScenarioMap): void {
  var keys = Object.keys(src)
  for (var i = 0; i < keys.length; i++) {
    _allLines[Number(keys[i])] = src[Number(keys[i])]
  }
}

_merge(lines01)
_merge(lines17)
_merge(lines33)
_merge(lines49)

export function getLineContent(hexNumber: number, lineIndex: number, scenarioKey: ScenarioKey): string {
  var hexData = _allLines[hexNumber]
  if (!hexData) { return '' }
  var lineData = hexData[lineIndex]
  if (!lineData) { return '' }
  return lineData[scenarioKey] || ''
}
