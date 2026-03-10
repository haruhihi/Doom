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
  scene?: ScenarioKey
}

interface IScenarioContent {
  general: string     // 综合指引
  career: string      // 事业学业
  decision: string    // 重大抉择
  love: string        // 感情婚姻
  family: string      // 居家生活
  wealth: string      // 财运理财
  wellness: string    // 心情调节
  social: string      // 人际往来
}

type ScenarioKey = keyof IScenarioContent

// 爻级场景数据：hexNumber → lineIndex(0-5) → 8场景文本
type ILineScenarioMap = Record<number, Record<number, IScenarioContent>>

interface IScenarioMeta {
  key: ScenarioKey
  label: string
  emoji: string
}

interface ILineInsight {
  situation: string
  advice: string
}

interface ICoreLineItem {
  positionIndex: number   // 爻位 0-5
  positionName: string    // '初爻' | '二爻' | ... | '上爻'
  text: string            // 爻辞原文
  interp: string          // 白话解读（启示前的部分）
  interpInsight: string   // 启示部分（"启示：..."）
  isPrimary: boolean      // 是否为主要（多爻时区分主次）
  lineSituation?: string  // 爻级态势（来自 line-insights）
  lineAdvice?: string     // 爻级建议（来自 line-insights）
}

interface IAppOption {
  globalData: {}
}
