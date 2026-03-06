// 六十四卦列表
import { hexagrams } from '../../data/hexagrams'

const TRIGRAM_NAMES = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑']

Component({
  data: {
    allList: hexagrams,
    filteredList: hexagrams,
    trigramNames: TRIGRAM_NAMES,
    filterTrigram: '',
  },

  methods: {
    onFilterAll() {
      this.setData({
        filterTrigram: '',
        filteredList: this.data.allList,
      })
    },

    onFilterTrigram(e: WechatMiniprogram.TouchEvent) {
      const name = e.currentTarget.dataset.name as string
      const filtered = this.data.allList.filter(
        h => h.upperTrigram === name || h.lowerTrigram === name
      )
      this.setData({
        filterTrigram: name,
        filteredList: filtered,
      })
    },

    onViewDetail(e: WechatMiniprogram.TouchEvent) {
      const number = e.currentTarget.dataset.number
      wx.navigateTo({
        url: `../hexagram-detail/hexagram-detail?number=${number}`
      })
    },
  }
})
