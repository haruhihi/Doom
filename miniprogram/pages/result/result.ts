// 卦象结果页
import { buildDivination } from '../../utils/divination'
import { formatTime } from '../../utils/util'
import { hexagramsPremium, scenarioMetas } from '../../data/hexagrams-premium'

const LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// 朱熹规则项
interface IZhuxiRule {
  count: number
  focus: string
  reason: string
}

// 朱熹断卦法完整规则表
const ZHUXI_RULES: IZhuxiRule[] = [
  { count: 0, focus: '看本卦卦辞', reason: '无变爻，以整体卦象为指引' },
  { count: 1, focus: '看本卦变爻爻辞', reason: '唯一变爻即解卦关键' },
  { count: 2, focus: '看本卦上方变爻', reason: '两变爻中，上爻为主' },
  { count: 3, focus: '看本卦卦辞，参考变卦卦辞', reason: '变爻过半，看整体转变' },
  { count: 4, focus: '看变卦中不变的两爻', reason: '多数已变，少数不变者为要' },
  { count: 5, focus: '看变卦中唯一不变爻', reason: '几乎全变，唯一不变即焦点' },
  { count: 6, focus: '看变卦卦辞', reason: '六爻皆变，完全翻转看变卦' },
]

interface IChangingLineDetail {
  position: number
  positionName: string
  originalText: string
  originalInterp: string
  changedText: string
  changedInterp: string
  isFocus: boolean
}

interface ILineDetail {
  position: number
  positionName: string
  text: string
  interp: string
  isChanging: boolean
}

// 断卦结论
interface IConclusionItem {
  label: string
  classical: string
  interp: string
  isPrimary: boolean
}

interface IConclusion {
  summary: string
  items: IConclusionItem[]
}

function buildConclusion(
  hex: IHexagram,
  changed: IHexagram | null,
  changingLines: number[]
): IConclusion | null {
  const count = changingLines.length
  if (count === 0) return null

  const posName = (pos: number) => LINE_NAMES[pos] || `第${pos + 1}爻`

  const lineItem = (
    hexData: IHexagram,
    pos: number,
    isPrimary: boolean
  ): IConclusionItem => ({
    label: `${hexData.name} · ${posName(pos)}`,
    classical: hexData.lineTexts[pos] || '',
    interp: (hexData.lineInterpretations && hexData.lineInterpretations[pos]) || '',
    isPrimary,
  })

  const judgmentItem = (
    hexData: IHexagram,
    isPrimary: boolean
  ): IConclusionItem => ({
    label: `${hexData.name} · 卦辞`,
    classical: hexData.judgment,
    interp: hexData.judgmentTranslation
      ? `${hexData.judgmentTranslation}\n${hexData.interpretation}`
      : hexData.interpretation,
    isPrimary,
  })

  // 不变爻位置（用于 4、5 变爻规则）
  const allPositions = [0, 1, 2, 3, 4, 5]
  const unchangedPositions = allPositions.filter(i => changingLines.indexOf(i) < 0)

  switch (count) {
    case 1:
    case 2:
      // Cases 1-2: focus handled by card highlighting, no conclusion block
      return null
    case 3: {
      if (!changed) return null
      return {
        summary: '三爻变，本卦与变卦卦辞综合为断，以本卦为主',
        items: [
          judgmentItem(hex, true),
          judgmentItem(changed, false),
        ],
      }
    }
    case 4: {
      if (!changed) return null
      const lowerUnchanged = unchangedPositions[0]
      const upperUnchanged = unchangedPositions[unchangedPositions.length - 1]
      return {
        summary: `四爻变，以变卦不变之爻为断（${posName(lowerUnchanged)}、${posName(upperUnchanged)}），以下方为主`,
        items: [
          lineItem(changed, lowerUnchanged, true),
          lineItem(changed, upperUnchanged, false),
        ],
      }
    }
    case 5: {
      if (!changed) return null
      const onlyUnchanged = unchangedPositions[0]
      return {
        summary: `五爻变，以变卦唯一不变爻（${posName(onlyUnchanged)}）为断`,
        items: [lineItem(changed, onlyUnchanged, true)],
      }
    }
    case 6: {
      if (!changed) return null
      return {
        summary: '六爻皆变，以变卦卦辞为断',
        items: [judgmentItem(changed, true)],
      }
    }
    default:
      return null
  }
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

Component({
  data: {
    hexagram: null as IHexagram | null,
    changedHexagram: null as IHexagram | null,
    changingLines: [] as number[],
    changingCount: 0,
    throws: [] as number[],
    // 了解变卦sheet
    showChangeTipSheet: false,
    // 变爻解读
    changingLineDetails: [] as IChangingLineDetail[],
    // 朱熹规则
    zhuxiRules: ZHUXI_RULES,
    currentZhuxiRule: null as IZhuxiRule | null,
    // 爻辞底部sheet
    showLineSheet: false,
    allLineTexts: [] as ILineDetail[],
    // 朱熹规则模态
    showZhuxiModal: false,
    // 断卦结论
    conclusion: null as IConclusion | null,
    // 场景解读
    scenarioMetas: scenarioMetas,
    activeScene: '' as ScenarioKey | '',
    scenarioContent: '',
    sceneTag: '',
    // #8 变卦展开（1-2变爻时折叠变卦）
    showChangedExpanded: false,
    // #8 指引文案
    guidanceText: '',
  },

  methods: {
    onLoad(options: Record<string, string>) {
      if (!options.throws) return

      const throws = options.throws.split(',').map(Number)
      const result = buildDivination(throws)

      const hex = result.hexagram || null
      const changed = result.changedHexagram || null
      const changingLines = result.changingLines

      // 构建变爻解读详情
      let changingLineDetails: IChangingLineDetail[] = []

      // Cases 1-2: 确定高亮焦点爻位
      let focusPositions: number[] = []
      if (changingLines.length === 1) {
        focusPositions = [changingLines[0]]
      } else if (changingLines.length === 2) {
        focusPositions = [changingLines[changingLines.length - 1]] // 上方变爻
      }

      if (hex && changed && changingLines.length > 0) {
        changingLineDetails = changingLines.map(pos => ({
          position: pos,
          positionName: LINE_NAMES[pos] || `第${pos + 1}爻`,
          originalText: hex.lineTexts[pos] || '',
          originalInterp: (hex.lineInterpretations && hex.lineInterpretations[pos]) || '',
          changedText: changed.lineTexts[pos] || '',
          changedInterp: (changed.lineInterpretations && changed.lineInterpretations[pos]) || '',
          isFocus: focusPositions.indexOf(pos) >= 0,
        })).reverse() // 上爻在前，初爻在后
      }

      // 朱熹规则
      const currentZhuxiRule = ZHUXI_RULES[changingLines.length] || ZHUXI_RULES[0]

      // 断卦结论
      const conclusion = hex ? buildConclusion(hex, changed, changingLines) : null

      // 构建完整爻辞列表（用于底部sheet）
      let allLineTexts: ILineDetail[] = []
      if (hex) {
        allLineTexts = hex.lineTexts.map((text, i) => ({
          position: i,
          positionName: LINE_NAMES[i] || `第${i + 1}爻`,
          text: text,
          interp: (hex.lineInterpretations && hex.lineInterpretations[i]) || '',
          isChanging: changingLines.indexOf(i) >= 0,
        }))
      }

      this.setData({
        hexagram: hex,
        changedHexagram: changed,
        changingLines,
        changingCount: changingLines.length,
        throws: result.throws,
        changingLineDetails,
        currentZhuxiRule,
        conclusion,
        allLineTexts,
        guidanceText: _buildGuidance(changingLines.length, hex, changed),
      })

      // 自动加载从首页传入的情境
      var sceneParam = options.scene as ScenarioKey
      if (sceneParam && hex) {
        var premium = hexagramsPremium[hex.number]
        if (premium && premium[sceneParam]) {
          this.setData({
            activeScene: sceneParam,
            scenarioContent: premium[sceneParam],
          })
        }
        // 显示情境标签
        for (var si = 0; si < scenarioMetas.length; si++) {
          if (scenarioMetas[si].key === sceneParam) {
            this.setData({ sceneTag: scenarioMetas[si].emoji + ' ' + scenarioMetas[si].label })
            break
          }
        }
      }
    },

    // 返回上一页（支持从历史记录或起卦页进入）
    onBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
    },

    // 打开了解变卦sheet
    onShowChangeTipSheet() {
      this.setData({ showChangeTipSheet: true })
    },

    // 关闭了解变卦sheet
    onCloseChangeTipSheet() {
      this.setData({ showChangeTipSheet: false })
    },

    // 展开/折叠变卦区块（1-2变爻时使用）
    onToggleChanged() {
      this.setData({ showChangedExpanded: !this.data.showChangedExpanded })
    },

    // 打开爻辞底部sheet
    onShowLineSheet() {
      this.setData({ showLineSheet: true })
    },

    // 关闭爻辞底部sheet
    onCloseLineSheet() {
      this.setData({ showLineSheet: false })
    },

    // 阻止事件冒泡（sheet内容区点击不关闭）
    onStopPropagation() {
      // 空方法，仅用于 catchtap 阻止冒泡
    },

    // 打开朱熹规则模态
    onShowZhuxiModal() {
      this.setData({ showZhuxiModal: true })
    },

    // 关闭朱熹规则模态
    onCloseZhuxiModal() {
      this.setData({ showZhuxiModal: false })
    },

    // 保存记录
    onSave() {
      if (!this.data.hexagram) return

      var scene = this.data.activeScene || undefined

      const record: IDivinationRecord = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        throws: this.data.throws,
        hexagram: this.data.hexagram,
        changingLines: this.data.changingLines,
        changedHexagram: this.data.changedHexagram || undefined,
        scene: scene,
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

    // 选择场景解读
    onSelectScene(e: WechatMiniprogram.TouchEvent) {
      const key = e.currentTarget.dataset.key as ScenarioKey
      if (!this.data.hexagram) return

      // 点击已选中的场景 → 取消选中
      if (this.data.activeScene === key) {
        this.setData({ activeScene: '', scenarioContent: '' })
        return
      }

      const hexNum = this.data.hexagram.number
      const premium = hexagramsPremium[hexNum]
      if (!premium) return

      // TODO: 广告插入点 — 当用户量达到1000+后在此插入激励视频广告
      // wx.createRewardedVideoAd → onClose → 解锁内容
      // 当前阶段：直接展示内容

      this.setData({
        activeScene: key,
        scenarioContent: premium[key],
      })
    },

    // 重新体验
    onDivineAgain() {
      wx.redirectTo({
        url: '../divine/divine'
      })
    },
  }
})
