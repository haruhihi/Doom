// 起卦算法 - 三枚铜钱法
import { findHexagram } from '../data/hexagrams'

// 掷一次三枚铜钱
// 正面(有字)=3，反面(无字)=2
// 三枚之和: 6=老阴(变爻), 7=少阳, 8=少阴, 9=老阳(变爻)
export function throwCoins(): number {
  const coins = [
    Math.random() < 0.5 ? 3 : 2,
    Math.random() < 0.5 ? 3 : 2,
    Math.random() < 0.5 ? 3 : 2,
  ]
  return coins[0] + coins[1] + coins[2]
}

// 获取单枚铜钱的正反面结果 (用于动画展示)
export function throwCoinsDetail(): { coins: boolean[]; value: number } {
  const coins = [
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
  ] // true=正面(字), false=反面(花)
  const value = coins.reduce((sum, c) => sum + (c ? 3 : 2), 0)
  return { coins, value }
}

// 判断爻的类型
export interface LineResult {
  value: number     // 6/7/8/9
  isYang: boolean   // 是否为阳爻
  isChanging: boolean // 是否为变爻
  label: string     // 显示名称
}

export function getLineResult(value: number): LineResult {
  switch (value) {
    case 6:
      return { value: 6, isYang: false, isChanging: true, label: '老阴 ⚋✕' }
    case 7:
      return { value: 7, isYang: true, isChanging: false, label: '少阳 ⚊' }
    case 8:
      return { value: 8, isYang: false, isChanging: false, label: '少阴 ⚋' }
    case 9:
      return { value: 9, isYang: true, isChanging: true, label: '老阳 ⚊✕' }
    default:
      return { value: 7, isYang: true, isChanging: false, label: '少阳 ⚊' }
  }
}

// 根据6次投掷结果构建卦象
export interface DivinationResult {
  throws: number[]           // 6次投掷值
  lines: number[]            // 本卦六爻 (0=阴, 1=阳)
  changingLines: number[]    // 变爻位置 (0-5)
  changedLines: number[]     // 变卦六爻
  hexagram: IHexagram | undefined
  changedHexagram: IHexagram | undefined
}

export function buildDivination(throws: number[]): DivinationResult {
  const lineResults = throws.map(getLineResult)

  // 本卦
  const lines = lineResults.map(r => r.isYang ? 1 : 0)

  // 变爻位置
  const changingLines: number[] = []
  lineResults.forEach((r, i) => {
    if (r.isChanging) changingLines.push(i)
  })

  // 变卦：变爻阴阳互换
  const changedLines = lines.map((line, i) => {
    if (changingLines.includes(i)) {
      return line === 1 ? 0 : 1
    }
    return line
  })

  const hexagram = findHexagram(lines)
  const changedHexagram = changingLines.length > 0 ? findHexagram(changedLines) : undefined

  return {
    throws,
    lines,
    changingLines,
    changedLines,
    hexagram,
    changedHexagram,
  }
}
