// 不同尺寸下阴爻的gap宽度(rpx)
var GAP_WIDTHS: Record<string, number> = {
  large: 28,
  medium: 20,
  small: 14,
  default: 20
}

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
      value: [],
      observer: '_updateDisplay'
    },
    // 需高亮的爻位置数组（金色圈出，用于4-5变爻标记静爻）
    highlightLines: {
      type: Array,
      value: [],
      observer: '_updateDisplay'
    },
    // 每爻的标签信息：Record<number, {text: string, type: 'changing'|'static'}>
    // key = originalIndex, text = 显示文字, type = 颜色类型
    lineLabels: {
      type: Object,
      value: {},
      observer: '_updateDisplay'
    },
    // 尺寸: large / small
    size: {
      type: String,
      value: 'large'
    }
  },
  data: {
    displayLines: [] as Array<{
      isYang: boolean
      isChanging: boolean
      isHighlighted: boolean
      originalIndex: number
      gapWidth: number
      showMark: boolean
      markText: string
      markType: string
    }>
  },
  lifetimes: {
    attached: function () {
      this._updateDisplay()
    },
    detached: function () {
      if ((this as any)._blinkTimer) {
        clearTimeout((this as any)._blinkTimer)
        ;(this as any)._blinkTimer = null
      }
    }
  },
  methods: {
    _getGapWidth: function (isYang: boolean): number {
      if (isYang) return 0
      var sizeKey = this.data.size || 'default'
      return GAP_WIDTHS[sizeKey] || GAP_WIDTHS['default']
    },

    _updateDisplay: function () {
      var self = this
      var targetLines = self.data.lines as number[]
      var changingLines = self.data.changingLines as number[]
      var highlightLines = self.data.highlightLines as number[]
      var lineLabels = (self.data.lineLabels || {}) as Record<number, { text: string; type: string }>

      if (!targetLines || targetLines.length === 0) return

      var displayLines = []
      for (var i = targetLines.length - 1; i >= 0; i--) {
        var isYang = targetLines[i] === 1
        var isChanging = changingLines.indexOf(i) >= 0
        var label = lineLabels[i]
        var showMark = false
        var markText = ''
        var markType = 'changing'
        if (label && label.text) {
          showMark = true
          markText = label.text
          markType = label.type || 'changing'
        }
        displayLines.push({
          isYang: isYang,
          isChanging: isChanging,
          isHighlighted: highlightLines.indexOf(i) >= 0,
          originalIndex: i,
          gapWidth: self._getGapWidth(isYang),
          showMark: showMark,
          markText: markText,
          markType: markType
        })
      }
      self.setData({ displayLines: displayLines })

      // Stop changing-blink animation after 5 seconds
      if ((self as any)._blinkTimer) {
        clearTimeout((self as any)._blinkTimer)
        ;(self as any)._blinkTimer = null
      }
      var hasChanging = false
      for (var ci = 0; ci < displayLines.length; ci++) {
        if (displayLines[ci].isChanging) {
          hasChanging = true
          break
        }
      }
      if (hasChanging) {
        (self as any)._blinkTimer = setTimeout(function () {
          var stopUpdates: Record<string, any> = {}
          var currentLines = self.data.displayLines
          for (var si = 0; si < currentLines.length; si++) {
            if (currentLines[si].isChanging) {
              stopUpdates['displayLines[' + si + '].isChanging'] = false
            }
          }
          self.setData(stopUpdates)
          ;(self as any)._blinkTimer = null
        }, 5000)
      }
    },

    // 爻线点击 → 触发 linetap 事件，传递原始爻位索引
    onLineTap: function (e: any) {
      var dataset = e.currentTarget.dataset
      var idx = dataset.idx
      if (idx === undefined || idx === null) return
      this.triggerEvent('linetap', { position: idx })
    }
  }
})
