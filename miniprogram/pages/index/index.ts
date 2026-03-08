// 首页
import { formatTime } from '../../utils/util'
import { scenarioMetas } from '../../data/hexagrams-premium'

// 构建场景查找表
var sceneMap: Record<string, IScenarioMeta> = {}
for (var i = 0; i < scenarioMetas.length; i++) {
  sceneMap[scenarioMetas[i].key] = scenarioMetas[i]
}

Component({
  data: {
    lastRecord: null as (IDivinationRecord & { timeStr: string; sceneEmoji: string; sceneLabel: string }) | null,
    scenarioMetas: scenarioMetas,
    selectedScene: 'general' as ScenarioKey,
    showSceneSheet: false,
  },

  lifetimes: {
    attached() {
      this._loadLastRecord()
    }
  },

  pageLifetimes: {
    show() {
      this._loadLastRecord()
    }
  },

  methods: {
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
  }
})
