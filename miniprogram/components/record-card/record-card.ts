// 记录卡片组件 — 首页「上次体验」与历史记录页共用
Component({
  externalClasses: ['custom-class'],

  properties: {
    record: {
      type: Object,
      value: null,
    },
  },

  data: {
    showChanged: false,
    changedDominant: false,
    specialLabel: '',
  },

  observers: {
    'record.changingLines, record.hexagram.number'(changingLines: number[], hexNumber: number) {
      var count = changingLines ? changingLines.length : 0
      var show = count >= 3
      // 用九/用六 特殊情况应显示本卦，而非变卦
      var isEasterEgg = count === 6 && (hexNumber === 1 || hexNumber === 2)
      var dominant = count >= 4 && !isEasterEgg
      var label = ''
      if (isEasterEgg) {
        label = hexNumber === 1 ? '用九' : '用六'
      }
      this.setData({ showChanged: show, changedDominant: dominant, specialLabel: label })
    },
  },
})
