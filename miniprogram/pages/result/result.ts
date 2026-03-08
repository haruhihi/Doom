// 卦象结果页
import { buildDivination } from '../../utils/divination'
import { formatTime } from '../../utils/util'
import { hexagramsPremium, scenarioMetas } from '../../data/hexagrams-premium'
import { hexagramInsights } from '../../data/hexagram-insights'

const LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// 态势阶段静态数组
const ATTITUDE_STAGES = [
  { label: '稳定期', color: 'green' },
  { label: '有变数', color: 'yellow' },
  { label: '转折期', color: 'orange' },
  { label: '大变动', color: 'red' },
  { label: '全面翻转', color: 'purple' },
]

interface ILineDetail {
  position: number
  positionName: string
  text: string
  interp: string
  isChanging: boolean
  changedText: string
  changedInterp: string
  focusTag: string  // '关键' | '次要' | ''
}

// 根据变爻数生成指引文案
function _buildGuidance(count: number, hex: IHexagram | null, changed: IHexagram | null): string {
  if (!hex) return ''
  switch (count) {
    case 0:
      return '本卦无变爻，以「' + hex.name + '」卦辞为整体指引，参考各爻辞了解不同阶段的启示。'
    case 1:
      return '一爻变动，重点看本卦变爻的爻辞，那是当前处境最关键的启示。'
    case 2:
      return '两爻变动，以上方变爻为主要参考，下方变爻为辅。'
    case 3:
      if (!changed) return ''
      return '三爻变动，本卦「' + hex.name + '」与变卦「' + changed.name + '」卦辞综合来看，以本卦为主。'
    case 4:
      if (!changed) return ''
      return '四爻变动，变卦「' + changed.name + '」中不变的两爻是关键所在，以下方不变爻为主。'
    case 5:
      if (!changed) return ''
      return '五爻变动，变卦「' + changed.name + '」中唯一不变的爻是核心启示。'
    case 6:
      if (!changed) return ''
      return '六爻皆变，局势完全翻转，以变卦「' + changed.name + '」卦辞为断。'
    default:
      return ''
  }
}

// 根据变爻数量生成态势标签
function _buildAttitudeTag(count: number): { label: string; color: string } {
  if (count === 0) return { label: '稳定期', color: 'green' }
  if (count <= 2) return { label: '有变数', color: 'yellow' }
  if (count === 3) return { label: '转折期', color: 'orange' }
  if (count <= 5) return { label: '大变动', color: 'red' }
  return { label: '全面翻转', color: 'purple' }
}

Component({
  data: {
    hexagram: null as IHexagram | null,
    changedHexagram: null as IHexagram | null,
    changingLines: [] as number[],
    changingCount: 0,
    throws: [] as number[],
    // 了解变卦sheet
    showChangeTipSheet: false,
    // 场景解读
    activeScene: '' as ScenarioKey | '',
    scenarioContent: '',
    sceneTag: '',
    // 指引文案
    guidanceText: '',
    // 态势标签
    attitudeLabel: '',
    attitudeColor: '',
    // 态势阶段（横条）
    attitudeStages: ATTITUDE_STAGES,
    // 核心态势与行动建议
    insightSituation: '',
    insightAdvice: '',
    // 卦辞解读详情sheet
    showDetailSheet: false,
    // 完整爻辞列表（用于detail sheet）
    allLineTexts: [] as ILineDetail[],
    // 本卦是否为次要（4+变爻时变淡）
    hexIsDimmed: false,
    // 是否已保存
    isSaved: false,
    // 卦辞标签（关键/次要/参考）
    hexFocusTag: '',
    changedFocusTag: '',
    // 朱熹断卦法sheet
    showZhuxiSheet: false,
    // 首次引导横幅
    showGuide: false,
  },

  methods: {
    onLoad(options: Record<string, string>) {
      var self = this

      // 启用分享菜单
      wx.showShareMenu({
        menus: ['shareAppMessage', 'shareTimeline']
      })

      if (!options.throws) return

      var throws = options.throws.split(',').map(Number)
      var result = buildDivination(throws)

      var hex = result.hexagram || null
      var changed = result.changedHexagram || null
      var changingLines = result.changingLines

      // 态势标签
      var attitude = _buildAttitudeTag(changingLines.length)

      // 本卦是否变淡（4+变爻时，变卦为主，本卦为辅）
      var hexIsDimmed = changingLines.length >= 4

      // 核心态势与行动建议（0-3变爻看本卦，4-6变爻看变卦）
      var insightHex: IHexagram | null = null
      if (changingLines.length >= 4 && changed) {
        insightHex = changed
      } else {
        insightHex = hex
      }
      var insight = insightHex ? hexagramInsights[insightHex.number] : null

      // 构建完整爻辞列表（用于detail sheet，变爻行附带变卦爻辞，上爻在前）
      // 朱熹断卦法：
      //   1变爻 → 该变爻为关键
      //   2变爻 → 上方变爻为关键、下方变爻为次要
      //   4变爻 → 变卦中下方不变爻为关键、上方不变爻为次要
      //   5变爻 → 变卦中唯一不变爻为关键
      var changingCount = changingLines.length
      var keyPosition = -1
      var secondaryPosition = -1

      if (changingCount === 1) {
        keyPosition = changingLines[0]
      } else if (changingCount === 2) {
        // 上方变爻为关键（higher index = upper position）
        keyPosition = changingLines[changingLines.length - 1]
        secondaryPosition = changingLines[0]
      } else if (changingCount === 4 || changingCount === 5) {
        // 找不变的爻位置
        var unchangedPositions: number[] = []
        for (var ui = 0; ui < 6; ui++) {
          if (changingLines.indexOf(ui) < 0) {
            unchangedPositions.push(ui)
          }
        }
        if (changingCount === 5 && unchangedPositions.length === 1) {
          keyPosition = unchangedPositions[0]
        } else if (changingCount === 4 && unchangedPositions.length === 2) {
          // 下方不变爻为关键（lower index = lower position）
          keyPosition = unchangedPositions[0]
          secondaryPosition = unchangedPositions[1]
        }
      }

      var allLineTexts: ILineDetail[] = []
      if (hex) {
        allLineTexts = hex.lineTexts.map(function (text, i) {
          var isChanging = changingLines.indexOf(i) >= 0
          var focusTag = ''
          if (i === keyPosition) {
            focusTag = '关键'
          } else if (i === secondaryPosition) {
            focusTag = '次要'
          }

          // 变卦爻辞：变爻始终展示；4-5变爻时，不变的focus爻也展示变卦爻辞
          var showChangedText = false
          if (isChanging && changed) {
            showChangedText = true
          } else if (!isChanging && focusTag && changingCount >= 4 && changed) {
            showChangedText = true
          }

          return {
            position: i,
            positionName: LINE_NAMES[i] || ('第' + (i + 1) + '爻'),
            text: text,
            interp: (hex.lineInterpretations && hex.lineInterpretations[i]) || '',
            isChanging: isChanging,
            changedText: showChangedText ? (changed.lineTexts[i] || '') : '',
            changedInterp: (showChangedText && changed.lineInterpretations) ? (changed.lineInterpretations[i] || '') : '',
            focusTag: focusTag,
          }
        }).reverse()
      }

      // 卦辞标签：关键/次要/参考
      var hexFocusTag = ''
      var changedFocusTag = ''
      if (changingCount === 0) {
        hexFocusTag = '关键'
      } else if (changingCount <= 2) {
        hexFocusTag = '关键'
        if (changed) { changedFocusTag = '参考' }
      } else if (changingCount === 3) {
        hexFocusTag = '关键'
        changedFocusTag = '次要'
      } else {
        // 4-6变爻：变卦为主
        hexFocusTag = '次要'
        changedFocusTag = '关键'
      }

      self.setData({
        hexagram: hex,
        changedHexagram: changed,
        changingLines: changingLines,
        changingCount: changingCount,
        throws: result.throws,
        allLineTexts: allLineTexts,
        guidanceText: _buildGuidance(changingCount, hex, changed),
        attitudeLabel: attitude.label,
        attitudeColor: attitude.color,
        hexIsDimmed: hexIsDimmed,
        insightSituation: insight ? insight.situation : '',
        insightAdvice: insight ? insight.advice : '',
        hexFocusTag: hexFocusTag,
        changedFocusTag: changedFocusTag,
      })

      // 检测是否已保存过（throws 完全匹配即视为同一次）
      var throwsStr = result.throws.join(',')
      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      for (var hi = 0; hi < history.length; hi++) {
        if (history[hi].throws && history[hi].throws.join(',') === throwsStr) {
          self.setData({ isSaved: true })
          break
        }
      }

      // 自动加载从首页传入的情境（4-6变爻用变卦的情境内容）
      var sceneParam = options.scene as ScenarioKey
      if (sceneParam && hex) {
        var scenarioHex = (changingCount >= 4 && changed) ? changed : hex
        var premium = hexagramsPremium[scenarioHex.number]
        if (premium && premium[sceneParam]) {
          self.setData({
            activeScene: sceneParam,
            scenarioContent: premium[sceneParam],
          })
        }
        // 显示情境标签
        for (var si = 0; si < scenarioMetas.length; si++) {
          if (scenarioMetas[si].key === sceneParam) {
            self.setData({ sceneTag: scenarioMetas[si].emoji + ' ' + scenarioMetas[si].label })
            break
          }
        }
      }

      // 首次引导横幅
      var guideSeen = wx.getStorageSync('guide_seen')
      if (!guideSeen) {
        self.setData({ showGuide: true })
      }
    },

    // 返回上一页（支持从历史记录或起卦页进入）
    onBack() {
      var pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
    },

    // 关闭首次引导横幅
    onDismissGuide() {
      wx.setStorageSync('guide_seen', true)
      this.setData({ showGuide: false })
    },

    // 打开卦辞解读详情sheet
    onShowDetailSheet() {
      this.setData({ showDetailSheet: true })
    },

    // 关闭卦辞解读详情sheet
    onCloseDetailSheet() {
      this.setData({ showDetailSheet: false })
    },

    // 打开了解变卦sheet
    onShowChangeTipSheet() {
      this.setData({ showChangeTipSheet: true })
    },

    // 关闭了解变卦sheet
    onCloseChangeTipSheet() {
      this.setData({ showChangeTipSheet: false })
    },

    // 打开朱熹断卦法sheet
    onShowZhuxiSheet() {
      this.setData({ showZhuxiSheet: true })
    },

    // 关闭朱熹断卦法sheet
    onCloseZhuxiSheet() {
      this.setData({ showZhuxiSheet: false })
    },

    // 阻止事件冒泡（sheet内容区点击不关闭）
    onStopPropagation() {
      // 空方法，仅用于 catchtap 阻止冒泡
    },

    // 保存记录
    onSave() {
      if (!this.data.hexagram) return

      var scene = this.data.activeScene || undefined

      var record: IDivinationRecord = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        timestamp: Date.now(),
        throws: this.data.throws,
        hexagram: this.data.hexagram,
        changingLines: this.data.changingLines,
        changedHexagram: this.data.changedHexagram || undefined,
        scene: scene,
      }

      // 读取已有记录
      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      history.unshift(record)

      // 最多保留100条
      if (history.length > 100) history.length = 100

      wx.setStorageSync('divination_history', history)

      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
    },

    // 分享到聊天
    onShareAppMessage() {
      var hex = this.data.hexagram
      var situation = this.data.insightSituation || ''
      if (!hex) {
        return {
          title: '易简研习 - 卦象解读',
          path: '/pages/index/index',
        }
      }

      var titleText = situation.length > 20 ? situation.substring(0, 20) + '...' : situation
      var title = hex.symbol + ' ' + hex.name + ' — ' + titleText

      var path = '/pages/result/result?throws=' + this.data.throws.join(',')
      if (this.data.activeScene) {
        path = path + '&scene=' + this.data.activeScene
      }

      return {
        title: title,
        path: path,
      }
    },

    // 分享到朋友圈
    onShareTimeline() {
      var hex = this.data.hexagram
      var situation = this.data.insightSituation || ''
      if (!hex) {
        return {
          title: '易简研习 - 卦象解读',
          query: '',
        }
      }

      var titleText = situation.length > 20 ? situation.substring(0, 20) + '...' : situation
      var title = hex.symbol + ' ' + hex.name + ' — ' + titleText

      var query = 'throws=' + this.data.throws.join(',')
      if (this.data.activeScene) {
        query = query + '&scene=' + this.data.activeScene
      }

      return {
        title: title,
        query: query,
      }
    },
  }
})
