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
    // 变化前的lines数组（传入时触发morph动画：先显示morphFrom，延迟后变为lines）
    morphFrom: {
      type: Array,
      value: []
    },
    // 延迟多少ms开始变化
    morphDelay: {
      type: Number,
      value: 1500
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
      isMorphing: boolean
      morphDone: boolean
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
      var morphFrom = self.data.morphFrom as number[]
      var delay = self.data.morphDelay as number

      if (!targetLines || targetLines.length === 0) return

      // 判断是否需要morph动画
      var hasMorph = morphFrom && morphFrom.length === targetLines.length

      // 初始显示：有morphFrom用morphFrom，否则用target
      var sourceLines = hasMorph ? morphFrom : targetLines
      var displayLines = []
      for (var i = sourceLines.length - 1; i >= 0; i--) {
        var isYang = sourceLines[i] === 1
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
          isMorphing: false,
          morphDone: false,
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

      // 如果有morph，延迟后执行变化
      if (hasMorph) {
        setTimeout(function () {
          self._executeMorph(targetLines, changingLines)
        }, delay)
      }
    },

    _executeMorph: function (targetLines: number[], changingLines: number[]) {
      var self = this
      // 找出需要变化的行（displayLines是倒序的，index=0对应上爻）
      var updates: Record<string, any> = {}
      var totalLines = targetLines.length

      for (var i = totalLines - 1; i >= 0; i--) {
        var displayIdx = totalLines - 1 - i  // 倒序映射
        if (changingLines.indexOf(i) < 0) continue

        var prefix = 'displayLines[' + displayIdx + '].'
        updates[prefix + 'isMorphing'] = true
      }

      // 先标记morphing状态（触发闪烁）
      self.setData(updates, function () {
        // 200ms后执行实际变化
        setTimeout(function () {
          var morphUpdates: Record<string, any> = {}
          for (var i = totalLines - 1; i >= 0; i--) {
            var displayIdx = totalLines - 1 - i
            if (changingLines.indexOf(i) < 0) continue

            var targetIsYang = targetLines[i] === 1
            var prefix = 'displayLines[' + displayIdx + '].'
            morphUpdates[prefix + 'isYang'] = targetIsYang
            morphUpdates[prefix + 'gapWidth'] = self._getGapWidth(targetIsYang)
            morphUpdates[prefix + 'isMorphing'] = false
            morphUpdates[prefix + 'morphDone'] = true
            morphUpdates[prefix + 'isChanging'] = false
            morphUpdates[prefix + 'showMark'] = false
          }
          self.setData(morphUpdates)

          // morph完成后触发事件通知父组件
          setTimeout(function () {
            self.triggerEvent('morphdone')
          }, 700)
        }, 200)
      })
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
