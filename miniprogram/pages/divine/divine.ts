// 起卦页面
import { throwCoinsDetail, getLineResult, type LineResult } from '../../utils/divination'
import { startShakeDetection, stopShakeDetection, pauseShakeDetection, resumeShakeDetection } from '../../utils/shake'

const LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

Component({
  data: {
    currentThrow: 0,          // 当前第几次投掷 (0-5)
    isAnimating: false,        // 是否正在播放动画
    isComplete: false,         // 是否完成6次投掷
    coinResults: undefined as boolean[] | undefined,  // 当前铜钱正反面
    throwResults: [] as Array<LineResult & { label: string }>,  // 所有投掷结果
    throws: [] as number[],    // 原始投掷值
  },

  lifetimes: {
    attached() {
      // 开启摇一摇检测
      startShakeDetection(() => {
        this._doThrow()
      }, {
        threshold: 15,
        cooldown: 2000,
        interval: 'game'
      })
    },
    detached() {
      stopShakeDetection()
    }
  },

  pageLifetimes: {
    hide() {
      pauseShakeDetection()
    },
    show() {
      if (!this.data.isComplete && !this.data.isAnimating) {
        resumeShakeDetection(() => {
          this._doThrow()
        })
      }
    }
  },

  methods: {
    // 点击按钮掷铜钱
    onThrowCoins() {
      this._doThrow()
    },

    // 执行一次投掷
    _doThrow() {
      if (this.data.isAnimating || this.data.isComplete) return

      const { coins, value } = throwCoinsDetail()

      // 暂停摇一摇
      pauseShakeDetection()

      // 开始动画
      this.setData({
        isAnimating: true,
        coinResults: undefined,  // 先清空，让铜钱回到初始态
      })

      // 震动反馈
      wx.vibrateShort({ type: 'heavy' })

      // 动画结束后显示结果
      setTimeout(() => {
        this.setData({ coinResults: coins })

        // 短暂延迟后记录结果
        setTimeout(() => {
          const lineResult = getLineResult(value)
          const throwResults = [...this.data.throwResults]
          const throws = [...this.data.throws]

          throwResults.push({
            ...lineResult,
            label: `${LINE_NAMES[this.data.currentThrow]}  ${lineResult.label}`
          })
          throws.push(value)

          const nextThrow = this.data.currentThrow + 1
          const isComplete = nextThrow >= 6

          this.setData({
            throwResults,
            throws,
            currentThrow: nextThrow,
            isAnimating: false,
            isComplete,
          })

          // 完成后震动提示
          if (isComplete) {
            wx.vibrateLong()
            stopShakeDetection()
          } else {
            // 恢复摇一摇
            resumeShakeDetection(() => {
              this._doThrow()
            })
          }
        }, 400)
      }, 1000)
    },

    // 查看结果
    onViewResult() {
      const throws = this.data.throws
      wx.navigateTo({
        url: `../result/result?throws=${throws.join(',')}`,
      })
    },
  }
})
