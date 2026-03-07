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
}

interface ILineDetail {
  position: number
  positionName: string
  text: string
  interp: string
  isChanging: boolean
}

Component({
  data: {
    hexagram: null as IHexagram | null,
    changedHexagram: null as IHexagram | null,
    changingLines: [] as number[],
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
    // 场景解读
    scenarioMetas: scenarioMetas,
    activeScene: '' as ScenarioKey | '',
    scenarioContent: '',
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

      if (hex && changed && changingLines.length > 0) {
        changingLineDetails = changingLines.map(pos => ({
          position: pos,
          positionName: LINE_NAMES[pos] || `第${pos + 1}爻`,
          originalText: hex.lineTexts[pos] || '',
          originalInterp: (hex.lineInterpretations && hex.lineInterpretations[pos]) || '',
          changedText: changed.lineTexts[pos] || '',
          changedInterp: (changed.lineInterpretations && changed.lineInterpretations[pos]) || '',
        }))
      }

      // 朱熹规则
      const currentZhuxiRule = ZHUXI_RULES[changingLines.length] || ZHUXI_RULES[0]

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
        throws: result.throws,
        changingLineDetails,
        currentZhuxiRule,
        allLineTexts,
      })
    },

    // 返回首页
    onBack() {
      wx.switchTab({
        url: '/pages/index/index'
      })
    },

    // 打开了解变卦sheet
    onShowChangeTipSheet() {
      this.setData({ showChangeTipSheet: true })
    },

    // 关闭了解变卦sheet
    onCloseChangeTipSheet() {
      this.setData({ showChangeTipSheet: false })
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
