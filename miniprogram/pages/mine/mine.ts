// 个人中心
const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
  data: {
    avatarUrl: defaultAvatar,
    nickname: '',
    totalCount: 0,
    uniqueHexagrams: 0,
    showAbout: false,
  },

  lifetimes: {
    attached() {
      this._loadUserInfo()
      this._loadStats()
    }
  },

  pageLifetimes: {
    show() {
      this._loadStats()
    }
  },

  methods: {
    _loadUserInfo() {
      const avatarUrl = wx.getStorageSync('user_avatar') || defaultAvatar
      const nickname = wx.getStorageSync('user_nickname') || ''
      this.setData({ avatarUrl, nickname })
    },

    _loadStats() {
      const history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      const uniqueNames = new Set(history.map(r => r.hexagram.name))
      this.setData({
        totalCount: history.length,
        uniqueHexagrams: uniqueNames.size,
      })
    },

    // 选择头像回调
    onChooseAvatar(e: any) {
      const { avatarUrl } = e.detail
      if (!avatarUrl) return

      // chooseAvatar 返回的是临时文件路径，可以直接使用
      this.setData({ avatarUrl })
      wx.setStorageSync('user_avatar', avatarUrl)

      wx.showToast({
        title: '头像已更新',
        icon: 'success'
      })
    },

    // 昵称输入中（实时更新）
    onNicknameInput(e: any) {
      // 不在这里保存，等 blur/confirm 时保存
    },

    // 昵称确认完成（blur 或 confirm）
    onNicknameDone(e: any) {
      const nickname = (e.detail.value || '').trim()
      if (!nickname) return

      this.setData({ nickname })
      wx.setStorageSync('user_nickname', nickname)

      wx.showToast({
        title: '昵称已保存',
        icon: 'success'
      })
    },

    onGoHistory() {
      wx.navigateTo({ url: '../history/history' })
    },

    onGoAbout() {
      this.setData({ showAbout: true })
    },

    onCloseAbout() {
      this.setData({ showAbout: false })
    },
  }
})
