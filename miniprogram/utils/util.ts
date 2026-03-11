export const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year, month, day].map(formatNumber).join('/')
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

// 六爻名称（初爻 → 上爻）
export const LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// 将爻辞解读拆分为"翻译"+"启示"两部分
export function splitInterp(raw: string): { interp: string; insight: string } {
  if (!raw) return { interp: '', insight: '' }
  var idx = raw.indexOf('启示：')
  if (idx < 0) idx = raw.indexOf('启示:')
  if (idx < 0) return { interp: raw, insight: '' }
  var before = raw.substring(0, idx).replace(/[。，\s]+$/, '')
  var after = raw.substring(idx + 3)
  return { interp: before, insight: after }
}
