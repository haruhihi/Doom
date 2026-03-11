// 卦详情页
import { getHexagramByNumber } from '../../data/hexagrams'
import { splitInterp } from '../../utils/util'

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
          lineInterps.push(splitInterp(hexagram.lineInterpretations[i]))
        }
        this.setData({ hexagram: hexagram, lineInterps: lineInterps })
      }
    },
  }
})
