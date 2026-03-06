// 卦详情页
import { getHexagramByNumber } from '../../data/hexagrams'

Component({
  data: {
    hexagram: null as IHexagram | null,
  },

  methods: {
    onLoad(options: Record<string, string>) {
      const number = parseInt(options.number, 10)
      if (!number) return

      const hexagram = getHexagramByNumber(number)
      if (hexagram) {
        this.setData({ hexagram })
      }
    },
  }
})
