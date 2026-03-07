/// <reference path="./types/index.d.ts" />

interface IHexagram {
  number: number
  name: string
  symbol: string
  upperTrigram: string
  lowerTrigram: string
  lines: number[]
  judgment: string
  judgmentTranslation?: string
  interpretation: string
  lineTexts: string[]
  lineInterpretations?: string[]
}

interface ITrigram {
  name: string
  nature: string
  lines: number[]
}

interface IDivinationRecord {
  id: string
  timestamp: number
  throws: number[]
  hexagram: IHexagram
  changingLines: number[]
  changedHexagram?: IHexagram
}

interface IScenarioContent {
  career: string      // 事业发展
  decision: string    // 重大抉择
  love: string        // 感情姻缘
  fertility: string   // 生育家庭
  wealth: string      // 财运理财
  health: string      // 健康平安
  study: string       // 学业考试
  general: string     // 综合指引
}

type ScenarioKey = keyof IScenarioContent

interface IScenarioMeta {
  key: ScenarioKey
  label: string
  emoji: string
}

interface IAppOption {
  globalData: {}
}
