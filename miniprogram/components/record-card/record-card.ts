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
      var dominant = count >= 4
      var label = ''
      if (count === 6) {
        if (hexNumber === 1) {
          label = '用九'
        } else if (hexNumber === 2) {
          label = '用六'
        }
      }
      this.setData({ showChanged: show, changedDominant: dominant, specialLabel: label })
    },
  },
})
