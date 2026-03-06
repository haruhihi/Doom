// 八卦数据
// lines: 从下到上，1=阳爻，0=阴爻
export const trigrams: Record<string, ITrigram> = {
  '111': { name: '乾', nature: '天', lines: [1, 1, 1] },
  '000': { name: '坤', nature: '地', lines: [0, 0, 0] },
  '100': { name: '震', nature: '雷', lines: [1, 0, 0] },
  '011': { name: '巽', nature: '风', lines: [0, 1, 1] },
  '010': { name: '坎', nature: '水', lines: [0, 1, 0] },
  '101': { name: '离', nature: '火', lines: [1, 0, 1] },
  '001': { name: '艮', nature: '山', lines: [0, 0, 1] },
  '110': { name: '兑', nature: '泽', lines: [1, 1, 0] },
}

// 根据三爻组合查找八卦名
export function getTrigramName(lines: number[]): string {
  const key = lines.join('')
  return trigrams[key]?.name || '未知'
}

// 根据八卦名查找三爻
export function getTrigramLines(name: string): number[] {
  for (const key in trigrams) {
    if (trigrams[key].name === name) {
      return trigrams[key].lines
    }
  }
  return [0, 0, 0]
}
