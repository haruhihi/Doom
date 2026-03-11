/// <reference path="./types/index.d.ts" />

// 微信小程序 require.async 异步分包加载
declare namespace require {
  function async(modulePath: string): Promise<any>
}

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

interface IScenarioMeta {
  key: ScenarioKey
  label: string
  emoji: string
}

interface ILineInsight {
  situation: string
  advice: string
}

interface IHexagramInsight {
  situation: string
  advice: string
}

interface IQuote {
  text: string
  source: string
}

interface IAppOption {
  globalData: {}
}
