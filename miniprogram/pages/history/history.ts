// 历史记录页
import { formatTime } from '../../utils/util'

Component({
  data: {
    historyList: [] as Array<IDivinationRecord & { timeStr: string }>,
  },

  lifetimes: {
    attached() {
      this._loadHistory()
    }
  },

  pageLifetimes: {
    show() {
      this._loadHistory()
    }
  },

  methods: {
    _loadHistory() {
      const history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      const historyList = history.map(record => ({
        ...record,
        timeStr: formatTime(new Date(record.timestamp))
      }))
      this.setData({ historyList })
    },

    onViewRecord(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index
      const record = this.data.historyList[index]
      if (!record) return
      wx.navigateTo({
        url: `../result/result?throws=${record.throws.join(',')}`
      })
    },

    onClearAll() {
      wx.showModal({
        title: '确认清空',
        content: '清空后无法恢复，确定要清空所有记录吗？',
        confirmColor: '#b33939',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('divination_history')
            this.setData({ historyList: [] })
            wx.showToast({ title: '已清空', icon: 'success' })
          }
        }
      })
    },
  }
})
