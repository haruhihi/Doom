// 铜钱体验页面
import { throwCoinsDetail, getLineResult, type LineResult } from '../../utils/divination'
import { LINE_NAMES } from '../../utils/util'

Component({
  data: {
    currentThrow: 0,          // 当前第几次投掷 (0-5)
    isAnimating: false,        // 是否正在播放动画
    isComplete: false,         // 是否完成6次投掷
    isQuickMode: false,        // 是否快速起卦模式
    coinResults: undefined as boolean[] | undefined,  // 当前铜钱正反面
    throwResults: [] as Array<LineResult & { label: string }>,  // 所有投掷结果
    throws: [] as number[],    // 原始投掷值
    scene: 'general' as string, // 情境参数（从首页传入）
    hasChangingLine: false,    // 是否存在变爻
    headerHint: '每次掷出三枚铜钱，共六次',
  },

  methods: {
    // 读取情境参数
    onLoad(options: Record<string, string>) {
      if (options.scene) {
        this.setData({ scene: options.scene })
      }
    },

    // 点击按钮掷铜钱
    onThrowCoins() {
      this._doThrow()
    },

    // 执行一次投掷
    _doThrow() {
      if (this.data.isAnimating || this.data.isComplete) return

      const { coins, value } = throwCoinsDetail()

      // 开始动画
      this.setData({
        isAnimating: true,
        coinResults: undefined,  // 先清空，让铜钱回到初始态
        headerHint: '铜钱落定中...',
      })

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
            hasChangingLine: this.data.hasChangingLine || lineResult.isChanging,
            headerHint: isComplete ? '结果已出，点击「查看解读」' : '点击继续',
          })
        }, 400)
      }, 1000)
    },

    // 查看结果 — redirectTo 使 divine 页出栈，result 返回时直接到首页
    onViewResult() {
      const throws = this.data.throws
      const scene = this.data.scene
      wx.redirectTo({
        url: '/pages/result/result?throws=' + throws.join(',') + '&scene=' + scene,
      })
    },

    // 快速起卦 — 一次性生成6爻，快速连续动画
    onQuickDivine() {
      if (this.data.isAnimating || this.data.isComplete || this.data.currentThrow > 0) return
      this.setData({ isQuickMode: true })
      this._doQuickStep(0)
    },

    // 快速起卦中的单步（递归调用，每步间隔更短）
    _doQuickStep(step: number) {
      if (step >= 6) return

      var self = this
      var detail = throwCoinsDetail()
      var coins = detail.coins
      var value = detail.value

      // 先重置动画状态，让 CSS class 被移除
        self.setData({
          isAnimating: false,
          coinResults: undefined,
          headerHint: '铜钱落定中...',
        })

      // 短暂延迟后重新添加动画 class，触发新一轮翻转
      setTimeout(function () {
        self.setData({ isAnimating: true })

        // 快速模式下缩短动画等待
        setTimeout(function () {
          self.setData({ coinResults: coins })

          setTimeout(function () {
            var lineResult = getLineResult(value)
            var throwResults = self.data.throwResults.slice()
            var throws = self.data.throws.slice()

            throwResults.push({
              value: lineResult.value,
              isYang: lineResult.isYang,
              isChanging: lineResult.isChanging,
              label: LINE_NAMES[step] + '  ' + lineResult.label
            })
            throws.push(value)

            var nextStep = step + 1
            var isComplete = nextStep >= 6

            self.setData({
              throwResults: throwResults,
              throws: throws,
              currentThrow: nextStep,
              isAnimating: false,
              isComplete: isComplete,
              hasChangingLine: self.data.hasChangingLine || lineResult.isChanging,
              headerHint: isComplete ? '结果已出，点击「查看解读」' : '铜钱落定中...',
            })

            if (!isComplete) {
              // 短暂间隔后进入下一步
              setTimeout(function () {
                self._doQuickStep(nextStep)
              }, 100)
            }
          }, 200)
        }, 500)
      }, 50)
    },
  }
})
