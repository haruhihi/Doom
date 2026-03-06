// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 登录
    wx.login({
      success: res => {
        console.log('login code:', res.code)
      },
    })
  },
})
