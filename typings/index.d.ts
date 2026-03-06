/// <reference path="./types/index.d.ts" />

interface IHexagram {
  number: number
  name: string
  symbol: string
  upperTrigram: string
  lowerTrigram: string
  lines: number[]
  judgment: string
  interpretation: string
  lineTexts: string[]
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

interface IAppOption {
  globalData: {}
}
