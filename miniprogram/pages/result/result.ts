// 卦象结果页
import { buildDivination } from '../../utils/divination'
import { formatTime } from '../../utils/util'

Component({
  data: {
    hexagram: null as IHexagram | null,
    changedHexagram: null as IHexagram | null,
    changingLines: [] as number[],
    throws: [] as number[],
    showChangeTip: false,
  },

  methods: {
    onLoad(options: Record<string, string>) {
      if (!options.throws) return

      const throws = options.throws.split(',').map(Number)
      const result = buildDivination(throws)

      this.setData({
        hexagram: result.hexagram || null,
        changedHexagram: result.changedHexagram || null,
        changingLines: result.changingLines,
        throws: result.throws,
      })
    },

    // 返回首页
    onBack() {
      wx.switchTab({
        url: '/pages/index/index'
      })
    },

    // 展开/收起变卦说明
    onToggleChangeTip() {
      this.setData({
        showChangeTip: !this.data.showChangeTip,
      })
    },

    // 保存记录
    onSave() {
      if (!this.data.hexagram) return

      const record: IDivinationRecord = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        throws: this.data.throws,
        hexagram: this.data.hexagram,
        changingLines: this.data.changingLines,
        changedHexagram: this.data.changedHexagram || undefined,
      }

      // 读取已有记录
      const history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      history.unshift(record)

      // 最多保留100条
      if (history.length > 100) history.length = 100

      wx.setStorageSync('divination_history', history)

      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
    },

    // 重新起卦
    onDivineAgain() {
      wx.redirectTo({
        url: '../divine/divine'
      })
    },
  }
})
