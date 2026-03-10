// Barrel export for all premium scenario content (64 hexagrams x 8 scenarios)

import { premium01 } from './premium/premium-01-16'
import { premium17 } from './premium/premium-17-32'
import { premium33 } from './premium/premium-33-48'
import { premium49 } from './premium/premium-49-64'
import { getLineContent } from './premium-lines/index'

export const hexagramsPremium: Record<number, IScenarioContent> = {
  ...premium01,
  ...premium17,
  ...premium33,
  ...premium49,
}

// 逐爻情境内容
// positionKey: 'judgment' | 0 | 1 | 2 | 3 | 4 | 5
export function getLineScenario(hexNumber: number, positionKey: string | number, scenarioKey: ScenarioKey): string {
  // 卦辞级别直接用 hexagramsPremium
  if (positionKey === 'judgment') {
    var hexData = hexagramsPremium[hexNumber]
    if (hexData) { return hexData[scenarioKey] || '' }
    return ''
  }

  // 爻级别从 premium-lines 数据获取
  var lineIndex = Number(positionKey)
  var content = getLineContent(hexNumber, lineIndex, scenarioKey)
  if (content) { return content }

  // fallback: 占位提示
  var posLabel = '第' + (lineIndex + 1) + '爻'
  var scenarioLabel = ''
  for (var i = 0; i < _scenarioLabels.length; i++) {
    if (_scenarioLabels[i][0] === scenarioKey) {
      scenarioLabel = _scenarioLabels[i][1]
      break
    }
  }
  return '第' + hexNumber + '卦 · ' + posLabel + ' · ' + scenarioLabel + '\n\n此爻位的情境解读内容正在撰写中，敬请期待。'
}

var _scenarioLabels: Array<[string, string]> = [
  ['general', '综合指引'],
  ['career', '事业学业'],
  ['decision', '重大抉择'],
  ['love', '感情婚姻'],
  ['family', '居家生活'],
  ['wealth', '财运理财'],
  ['wellness', '心情调节'],
  ['social', '人际往来'],
]

export const scenarioMetas: IScenarioMeta[] = [
  { key: 'general', label: '综合指引', emoji: '☯️' },
  { key: 'career', label: '事业学业', emoji: '💼' },
  { key: 'decision', label: '重大抉择', emoji: '⚖️' },
  { key: 'love', label: '感情婚姻', emoji: '❤️' },
  { key: 'family', label: '居家生活', emoji: '🏠' },
  { key: 'wealth', label: '财运理财', emoji: '💰' },
  { key: 'wellness', label: '心情调节', emoji: '🧘' },
  { key: 'social', label: '人际往来', emoji: '🤝' },
]
