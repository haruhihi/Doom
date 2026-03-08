// 首页
import { formatTime } from '../../utils/util'
import { scenarioMetas } from '../../data/hexagrams-premium'
import { quotes } from '../../data/quotes'

// 构建场景查找表
var sceneMap: Record<string, IScenarioMeta> = {}
for (var i = 0; i < scenarioMetas.length; i++) {
  sceneMap[scenarioMetas[i].key] = scenarioMetas[i]
}

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
      { throws: '7,8,7,8,7,8', scene: 'general', desc: '0变爻' },
      { throws: '9,7,8,7,8,7', scene: 'career', desc: '1变爻' },
      { throws: '9,6,7,8,7,8', scene: 'love', desc: '2变爻' },
      { throws: '9,6,9,7,8,7', scene: 'decision', desc: '3变爻' },
      { throws: '9,6,9,6,7,8', scene: 'wealth', desc: '4变爻' },
      { throws: '9,6,9,6,9,7', scene: 'study', desc: '5变爻' },
      { throws: '9,6,9,6,9,6', scene: 'health', desc: '6变爻' },
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
      var url = '../result/result?throws=' + record.throws.join(',')
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

    onSelectTestCase(e: WechatMiniprogram.TouchEvent) {
      var idx = e.currentTarget.dataset.idx
      var tc = this.data.testCases[idx]
      if (!tc) return
      this.setData({ showTestSheet: false })
      var url = '../result/result?throws=' + tc.throws + '&scene=' + tc.scene
      wx.navigateTo({ url: url })
    },
  }
})
