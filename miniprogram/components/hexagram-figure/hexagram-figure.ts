Component({
  properties: {
    // 六爻数组 [初爻, 二爻, ..., 上爻]，1=阳，0=阴
    lines: {
      type: Array,
      value: [],
      observer: '_updateDisplay'
    },
    // 变爻位置数组
    changingLines: {
      type: Array,
      value: []
    },
    // 尺寸: large / small
    size: {
      type: String,
      value: 'large'
    }
  },
  data: {
    displayLines: [] as Array<{ isYang: boolean; isChanging: boolean }>
  },
  lifetimes: {
    attached() {
      this._updateDisplay()
    }
  },
  methods: {
    _updateDisplay() {
      const lines = this.data.lines as number[]
      const changingLines = this.data.changingLines as number[]
      if (!lines || lines.length === 0) return

      // 从上爻到初爻（倒序显示）
      const displayLines = []
      for (let i = lines.length - 1; i >= 0; i--) {
        displayLines.push({
          isYang: lines[i] === 1,
          isChanging: changingLines.includes(i)
        })
      }
      this.setData({ displayLines })
    }
  }
})
