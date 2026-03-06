// 首页
import { formatTime } from '../../utils/util'

Component({
  data: {
    lastRecord: null as (IDivinationRecord & { timeStr: string }) | null,
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
      const history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      if (history.length > 0) {
        const last = history[0]
        this.setData({
          lastRecord: {
            ...last,
            timeStr: formatTime(new Date(last.timestamp))
          }
        })
      }
    },

    // 开始起卦
    onStartDivine() {
      wx.navigateTo({
        url: '../divine/divine'
      })
    },

    // 查看上次记录
    onViewLastRecord() {
      if (!this.data.lastRecord) return
      wx.navigateTo({
        url: `../result/result?throws=${this.data.lastRecord.throws.join(',')}`
      })
    },
  }
})
