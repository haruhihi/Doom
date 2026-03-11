// 历史记录页
import { formatTime } from '../../utils/util'
import { sceneMap } from '../../utils/scene-map'

// 触摸状态（模块级，避免 TypeScript 实例属性问题）
var _touchStartX = 0
var _touchStartY = 0
var _touchStartTime = 0
var _isSwiping = false

Component({
  data: {
    historyList: [] as Array<IDivinationRecord & { timeStr: string; sceneEmoji: string; sceneLabel: string }>,
    activeSwipeIndex: -1,
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
      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      var historyList = history.map(function (record) {
        var meta = record.scene ? sceneMap[record.scene] : null
        return {
          id: record.id,
          timestamp: record.timestamp,
          throws: record.throws,
          hexagram: record.hexagram,
          changingLines: record.changingLines,
          changedHexagram: record.changedHexagram,
          scene: record.scene,
          timeStr: formatTime(new Date(record.timestamp)),
          sceneEmoji: meta ? meta.emoji : '☯️',
          sceneLabel: meta ? meta.label : '综合指引',
        }
      })
      this.setData({ historyList: historyList, activeSwipeIndex: -1 })
    },

    // 触摸开始
    onRecordTouchStart(e: WechatMiniprogram.TouchEvent) {
      _touchStartX = e.touches[0].clientX
      _touchStartY = e.touches[0].clientY
      _touchStartTime = Date.now()
      _isSwiping = false
    },

    // 触摸移动 — 检测是否为水平滑动
    onRecordTouchMove(e: WechatMiniprogram.TouchEvent) {
      var dx = Math.abs(e.touches[0].clientX - _touchStartX)
      var dy = Math.abs(e.touches[0].clientY - _touchStartY)
      if (dx > dy && dx > 10) {
        _isSwiping = true
      }
    },

    // 触摸结束 — 区分点击和滑动
    onRecordTouchEnd(e: WechatMiniprogram.TouchEvent) {
      var dx = e.changedTouches[0].clientX - _touchStartX
      var index = e.currentTarget.dataset.index as number

      if (!_isSwiping) {
        // 点击操作
        if (this.data.activeSwipeIndex >= 0) {
          // 关闭已打开的滑动
          this.setData({ activeSwipeIndex: -1 })
        } else {
          // 跳转到结果页
          this._navigateToRecord(index)
        }
        return
      }

      // 滑动操作
      if (dx < -60) {
        // 左滑 → 显示删除
        this.setData({ activeSwipeIndex: index })
      } else {
        // 右滑或不足 → 关闭
        this.setData({ activeSwipeIndex: -1 })
      }
    },

    // 跳转到结果页
    _navigateToRecord(index: number) {
      var record = this.data.historyList[index]
      if (!record) return
      var url = '/pages/result/result?throws=' + record.throws.join(',')
      if (record.scene) {
        url += '&scene=' + record.scene
      }
      wx.navigateTo({ url: url })
    },

    // 删除单条记录
    onDeleteRecord(e: WechatMiniprogram.TouchEvent) {
      var index = e.currentTarget.dataset.index as number
      var self = this
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        confirmColor: '#b33939',
        success: function (res) {
          if (res.confirm) {
            var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
            history.splice(index, 1)
            wx.setStorageSync('divination_history', history)
            self.setData({ activeSwipeIndex: -1 })
            self._loadHistory()
            wx.showToast({ title: '已删除', icon: 'success' })
          }
        }
      })
    },

    // 清空所有记录
    onClearAll() {
      var self = this
      wx.showModal({
        title: '确认清空',
        content: '清空后无法恢复，确定要清空所有记录吗？',
        confirmColor: '#b33939',
        success: function (res) {
          if (res.confirm) {
            wx.removeStorageSync('divination_history')
            self.setData({ historyList: [], activeSwipeIndex: -1 })
            wx.showToast({ title: '已清空', icon: 'success' })
          }
        }
      })
    },
  }
})
