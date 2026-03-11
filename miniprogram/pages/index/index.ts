// 首页
import { formatTime } from '../../utils/util'
import { scenarioMetas } from '../../data/scenario-metas'
import { sceneMap } from '../../utils/scene-map'
import { quotes } from '../../data/quotes'

// 随机取一条（不连续重复）
function pickRandom<T>(arr: T[], lastIndex: number): { value: T; index: number } {
  if (arr.length <= 1) return { value: arr[0], index: 0 }
  var idx = lastIndex
  while (idx === lastIndex) {
    idx = Math.floor(Math.random() * arr.length)
  }
  return { value: arr[idx], index: idx }
}

Component({
  data: {
    lastRecord: null as (IDivinationRecord & { timeStr: string; sceneEmoji: string; sceneLabel: string }) | null,
    scenarioMetas: scenarioMetas,
    selectedScene: 'general' as ScenarioKey,
    showSceneSheet: false,
    isDev: false,
    showTestSheet: false,
    footerQuote: '',
    footerSource: '',
    testCases: [
      { changingCount: 0, throws: '', scene: 'general', desc: '0变爻（随机）' },
      { changingCount: 1, throws: '', scene: 'career', desc: '1变爻（随机）' },
      { changingCount: 2, throws: '', scene: 'love', desc: '2变爻（随机）' },
      { changingCount: 3, throws: '', scene: 'decision', desc: '3变爻（随机）' },
      { changingCount: 4, throws: '', scene: 'wealth', desc: '4变爻（随机）' },
      { changingCount: 5, throws: '', scene: 'career', desc: '5变爻（随机）' },
      { changingCount: 6, throws: '', scene: 'wellness', desc: '6变爻（随机）' },
      { changingCount: -1, throws: '9,9,9,9,9,9', scene: 'general', desc: '🥚 乾·用九' },
      { changingCount: -1, throws: '6,6,6,6,6,6', scene: 'general', desc: '🥚 坤·用六' },
    ],
    _lastQuoteIdx: -1,
  },

  lifetimes: {
    attached() {
      var self = this
      var info = wx.getAccountInfoSync()
      var env = info && info.miniProgram ? info.miniProgram.envVersion : 'release'
      self.setData({ isDev: env !== 'release' })
      self._loadLastRecord()
      self._refreshQuotes()
    }
  },

  pageLifetimes: {
    show() {
      this._loadLastRecord()
      this._refreshQuotes()
    }
  },

  methods: {
    _refreshQuotes() {
      var self = this
      var q = pickRandom(quotes, self.data._lastQuoteIdx)
      self.setData({
        footerQuote: q.value.text,
        footerSource: q.value.source,
        _lastQuoteIdx: q.index,
      })
    },
    _loadLastRecord() {
      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      if (history.length > 0) {
        var last = history[0]
        var meta = last.scene ? sceneMap[last.scene] : null
        this.setData({
          lastRecord: {
            id: last.id,
            timestamp: last.timestamp,
            throws: last.throws,
            hexagram: last.hexagram,
            changingLines: last.changingLines,
            changedHexagram: last.changedHexagram,
            scene: last.scene,
            timeStr: formatTime(new Date(last.timestamp)),
            sceneEmoji: meta ? meta.emoji : '',
            sceneLabel: meta ? meta.label : '',
          }
        })
      } else {
        this.setData({ lastRecord: null })
      }
    },

    // 选择情境
    onSelectScene(e: WechatMiniprogram.TouchEvent) {
      var key = e.currentTarget.dataset.key as ScenarioKey
      this.setData({ selectedScene: key })
    },

    // 点击体验按钮 → 打开情境选择弹窗
    onStartDivine() {
      this.setData({ showSceneSheet: true, selectedScene: 'general' })
    },

    // 确认情境 → 跳转起卦页
    onConfirmScene() {
      this.setData({ showSceneSheet: false })
      wx.navigateTo({
        url: '../divine/divine?scene=' + this.data.selectedScene
      })
    },

    // 关闭情境弹窗
    onCloseSceneSheet() {
      this.setData({ showSceneSheet: false })
    },

    // 阻止事件冒泡
    onStopPropagation() {
      // 空方法，仅用于 catchtap
    },

    // 查看上次记录 — 使用记录中存储的情境
    onViewLastRecord() {
      if (!this.data.lastRecord) return
      var record = this.data.lastRecord
      var url = '/pages/result/result?throws=' + record.throws.join(',')
      if (record.scene) {
        url += '&scene=' + record.scene
      }
      wx.navigateTo({ url: url })
    },

    // ===== 测试按钮：打开测试场景选择 =====
    onTestDivine() {
      this.setData({ showTestSheet: true })
    },

    onCloseTestSheet() {
      this.setData({ showTestSheet: false })
    },

    // 根据变爻数生成随机投掷结果
    _generateRandomThrows(changingCount: number): string {
      // 随机选 changingCount 个位置作为变爻（Fisher-Yates 洗牌）
      var positions = [0, 1, 2, 3, 4, 5]
      for (var i = positions.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1))
        var temp = positions[i]
        positions[i] = positions[j]
        positions[j] = temp
      }
      var changingSet: Record<number, boolean> = {}
      for (var k = 0; k < changingCount; k++) {
        changingSet[positions[k]] = true
      }
      // 生成6个投掷值
      var throws: number[] = []
      for (var m = 0; m < 6; m++) {
        if (changingSet[m]) {
          // 变爻：6（老阴）或 9（老阳）
          throws.push(Math.random() < 0.5 ? 6 : 9)
        } else {
          // 不变：7（少阳）或 8（少阴）
          throws.push(Math.random() < 0.5 ? 7 : 8)
        }
      }
      return throws.join(',')
    },

    onSelectTestCase(e: WechatMiniprogram.TouchEvent) {
      var idx = e.currentTarget.dataset.idx
      var tc = this.data.testCases[idx]
      if (!tc) return
      this.setData({ showTestSheet: false })
      // 彩蛋用固定 throws，其余随机生成
      var throws = tc.throws || this._generateRandomThrows(tc.changingCount)
      var url = '/pages/result/result?throws=' + throws + '&scene=' + tc.scene
      wx.navigateTo({ url: url })
    },
  }
})
