// Barrel export for all premium scenario content (64 hexagrams x 8 scenarios)

import { premium01 } from './premium/premium-01-16'
import { premium17 } from './premium/premium-17-32'
import { premium33 } from './premium/premium-33-48'
import { premium49 } from './premium/premium-49-64'

export const hexagramsPremium: Record<number, IScenarioContent> = {
  ...premium01,
  ...premium17,
  ...premium33,
  ...premium49,
}

export const scenarioMetas: IScenarioMeta[] = [
  { key: 'general', label: '综合指引', emoji: '☯️' },
  { key: 'career', label: '事业发展', emoji: '💼' },
  { key: 'decision', label: '重大抉择', emoji: '⚖️' },
  { key: 'love', label: '感情姻缘', emoji: '❤️' },
  { key: 'fertility', label: '生育家庭', emoji: '👶' },
  { key: 'wealth', label: '财运理财', emoji: '💰' },
  { key: 'health', label: '健康平安', emoji: '🏥' },
  { key: 'study', label: '学业考试', emoji: '📖' },
]
