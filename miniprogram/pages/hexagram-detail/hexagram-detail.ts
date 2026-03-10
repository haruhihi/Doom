// 卦详情页
import { getHexagramByNumber } from '../../data/hexagrams'

Component({
  data: {
    hexagram: null as IHexagram | null,
    lineInterps: [] as Array<{ interp: string; insight: string }>,
  },

  methods: {
    onLoad(options: Record<string, string>) {
      var number = parseInt(options.number, 10)
      if (!number) return

      var hexagram = getHexagramByNumber(number)
      if (hexagram) {
        var lineInterps: Array<{ interp: string; insight: string }> = []
        for (var i = 0; i < hexagram.lineInterpretations.length; i++) {
          var raw = hexagram.lineInterpretations[i]
          var splitIdx = raw.indexOf('启示：')
          if (splitIdx >= 0) {
            lineInterps.push({
              interp: raw.substring(0, splitIdx).replace(/[。\s]+$/, ''),
              insight: raw.substring(splitIdx + 3)
            })
          } else {
            lineInterps.push({ interp: raw, insight: '' })
          }
        }
        this.setData({ hexagram: hexagram, lineInterps: lineInterps })
      }
    },
  }
})
