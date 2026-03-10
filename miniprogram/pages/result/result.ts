// 卦象结果页
import { buildDivination } from '../../utils/divination'
import { hexagramsPremium, scenarioMetas, getLineScenario } from '../../data/hexagrams-premium'
import { hexagramInsights } from '../../data/hexagram-insights'
import { lineInsights } from '../../data/line-insights'
import { easterEggScenarios } from '../../data/premium/easter-egg-scenarios'

var LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// 3变爻过渡引导词库（按变动模式分类，随机取一条）
var TRANSITION_LOWER = [
  '根基已动，外局指向——',
  '内在全面翻新，接下来的方向是——',
  '底层逻辑在变，新的走势是——',
]
var TRANSITION_UPPER = [
  '外部环境在洗牌，你的立足点是——',
  '外在格局全面刷新，落脚之处是——',
  '周围都在变，你内在的锚点是——',
]
var TRANSITION_MIXED = [
  '内外都在动，整体正在走向——',
  '新旧交替之际，趋势逐渐明朗——',
  '变化已经铺开，接下来的局面是——',
]

function _pickTransition(changingLines: number[]): string {
  var pool: string[]
  if (changingLines[0] === 0 && changingLines[1] === 1 && changingLines[2] === 2) {
    pool = TRANSITION_LOWER
  } else if (changingLines[0] === 3 && changingLines[1] === 4 && changingLines[2] === 5) {
    pool = TRANSITION_UPPER
  } else {
    pool = TRANSITION_MIXED
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

interface ILineDetail {
  position: number
  positionName: string
  text: string
  interp: string
  insight: string
  isChanging: boolean
  changedText: string
  changedInterp: string
  changedInsight: string
  focusTag: string
}

// 乾用九 / 坤用六 彩蛋
var EASTER_EGGS: Record<number, { text: string; interp: string; situation: string; advice: string; quoteLine1: string; quoteLine2: string }> = {
  1: {
    text: '用九：见群龙无首，吉。',
    interp: '当所有的阳爻都在变化，就像天空中群龙飞舞却没有谁称王称霸——这反而是最好的状态。不必争当领头的那一个，顺其自然，各安其位，吉祥自然降临。',
    situation: '所有力量都已充分释放，到了不需要谁来主导的阶段——此时"不争先"反而是最好的状态。',
    advice: '放下掌控欲，别急着当那个带头的人。让事情自然运转，各归其位，结果会比强行主导更好。',
    quoteLine1: '大势已成，无须牵引',
    quoteLine2: '众智成城，无为而治',
  },
  2: {
    text: '用六：利永贞。',
    interp: '当所有的阴爻都在变化，大地的柔顺之力达到极致。此时最重要的是坚守正道、保持恒心。不急于求成，以柔克刚，长久坚持下去就会迎来好的结果。',
    situation: '柔顺之力已发挥到极致，所有的积累和等待正在酝酿质变。',
    advice: '此刻最忌半途而废。坚定地走下去，不必改弦易辙，持久的坚守本身就是最大的力量。',
    quoteLine1: '万象更迭，定力为根',
    quoteLine2: '厚德载物，守正即利',
  },
}

// 引导语：在switch中根据实际爻位动态生成（已移除静态数组）

// 根据变爻数量生成态势标签
function _buildAttitudeTag(count: number): { label: string; color: string } {
  if (count === 0) return { label: '稳定期', color: 'green' }
  if (count <= 2) return { label: '有变数', color: 'yellow' }
  if (count === 3) return { label: '转折期', color: 'orange' }
  if (count <= 5) return { label: '大变动', color: 'red' }
  return { label: '全面翻转', color: 'purple' }
}

// 将爻辞解读拆分为"翻译"+"启示"两部分
function _splitInterp(raw: string): { interp: string; insight: string } {
  if (!raw) return { interp: '', insight: '' }
  var idx = raw.indexOf('启示：')
  if (idx < 0) idx = raw.indexOf('启示:')
  if (idx < 0) return { interp: raw, insight: '' }
  var before = raw.substring(0, idx).replace(/[。，\s]+$/, '')
  var after = raw.substring(idx + 3)
  return { interp: before, insight: after }
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
    sceneLabel: '',
    scenarioRevealed: false,
    scenarioHeight: 0,
    // 态势标签
    attitudeLabel: '',
    attitudeColor: '',
    // 核心态势与行动建议
    insightSituation: '',
    insightAdvice: '',
    // 卦辞解读详情sheet
    showDetailSheet: false,
    // 完整爻辞列表（用于detail sheet）
    allLineTexts: [] as ILineDetail[],
    // 是否已保存
    isSaved: false,
    // 朱熹断卦法sheet
    showZhuxiSheet: false,
    // 首次引导横幅
    showGuide: false,
    // 4-6变爻：双纵排本卦折叠 + 入场动画
    hexCollapsed: false,
    collapseBarVisible: false,
    dualArrowVisible: false,
    dualChangedVisible: false,

    // ====== 新分层展示数据 ======
    // 核心内容类型: judgment=卦辞, lines=爻辞, dual-judgment=左右并排, easter-egg=乾用九/坤用六
    coreType: '' as '' | 'judgment' | 'lines' | 'dual-judgment' | 'easter-egg',
    // 核心内容使用的是变卦(true)还是本卦(false)
    coreIsChanged: false,
    // 核心爻辞列表（1-2条或5变时1条）
    coreLines: [] as ICoreLineItem[],
    // 彩蛋
    easterEggText: '',
    easterEggInterp: '',
    // 彩蛋降临仪式阶段: '' | 'enter' | 'reveal' | 'exit'
    eggCeremonyPhase: '' as '' | 'enter' | 'reveal' | 'exit',
    // 彩蛋金句（分两行）
    easterEggQuoteLine1: '',
    easterEggQuoteLine2: '',
    // 引导语（每次都显示）
    guideText: '',
    // 高亮爻位（传给 hexagram-figure）
    highlightLines: [] as number[],
    // 每爻标签（传给 hexagram-figure）
    lineLabels: {} as Record<number, { text: string; type: string }>,
    // 场景定位 key: 'judgment' | 0 | 1 | 2 | 3 | 4 | 5
    scenarioPositionKey: 'judgment' as string | number,
    // 爻级基础信息（1-2变爻在卦象区展示）
    coreLinePositionName: '',
    coreLineText: '',
    coreLineInterp: '',
    coreLineInsight: '',
    // scroll-into-view 锚点
    scrollToView: '',
    // 卦辞标签（用于 detail sheet）
    hexFocusTag: '',
    changedFocusTag: '',
    // 旧版指引（detail sheet内使用）
    guidanceText: '',
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
      var changingCount = changingLines.length

      if (!hex) return

      // 态势标签
      var attitude = _buildAttitudeTag(changingCount)

      // 核心态势与行动建议（0-3变爻看本卦，4-6变爻看变卦）
      var insightHex: IHexagram | null = null
      if (changingCount >= 4 && changed) {
        insightHex = changed
      } else {
        insightHex = hex
      }
      var insight = insightHex ? hexagramInsights[insightHex.number] : null

      // ====== 构建分层展示数据（7-case switch）======
      var coreType = ''
      var coreIsChanged = false
      var coreLines: ICoreLineItem[] = []
      var easterEggText = ''
      var easterEggInterp = ''
          var easterEggQuoteLine1 = ''
          var easterEggQuoteLine2 = ''
      var guideText = ''
      var highlightLines: number[] = []
      var lineLabels: Record<number, { text: string; type: string }> = {}
      var scenarioPositionKey: string | number = 'judgment'
      var coreLinePositionName = ''
      var coreLineText = ''
      var coreLineInterp = ''
      var coreLineInsight = ''

      var overrideSituation = ''
      var overrideAdvice = ''

      switch (changingCount) {
        case 0:
          // 本卦卦辞为核心
          coreType = 'judgment'
          coreIsChanged = false
          scenarioPositionKey = 'judgment'
          guideText = '六条爻都没有变化，整个卦很稳定。直接看本卦的卦辞即可。'
          break

        case 1: {
          // 本卦变爻爻辞为核心（展示方式同0变爻：卦象区展示爻基础信息，核心区展示态势+建议）
          coreType = 'judgment'
          coreIsChanged = false
          var pos1 = changingLines[0]
          var split1 = _splitInterp((hex.lineInterpretations && hex.lineInterpretations[pos1]) || '')
          var li1 = lineInsights[hex.number]
          var liItem1 = li1 && li1[pos1]
          // 卦象区展示爻基础信息
          coreLinePositionName = LINE_NAMES[pos1] || ('第' + (pos1 + 1) + '爻')
          coreLineText = hex.lineTexts[pos1] || ''
          coreLineInterp = split1.interp
          coreLineInsight = split1.insight
          // 核心态势+建议使用爻级数据
          overrideSituation = liItem1 ? liItem1.situation : ''
          overrideAdvice = liItem1 ? liItem1.advice : ''
          highlightLines = [pos1]
          lineLabels[pos1] = { text: '关键', type: 'changing' }
          scenarioPositionKey = pos1
          guideText = '只有' + LINE_NAMES[pos1] + '在变，其余五条不动。重点看这条变爻的爻辞即可。'
          break
        }

        case 2: {
          // 本卦两变爻，上位为主（展示方式同0变爻）
          coreType = 'judgment'
          coreIsChanged = false
          // changingLines 已排序（从小到大），上位 = 最后一个
          var sorted2 = changingLines.slice().sort(function (a: number, b: number) { return a - b })
          var upper2 = sorted2[sorted2.length - 1]
          var lower2 = sorted2[0]
          var splitU2 = _splitInterp((hex.lineInterpretations && hex.lineInterpretations[upper2]) || '')
          var li2 = lineInsights[hex.number]
          var liU2 = li2 && li2[upper2]
          // 卦象区展示主爻基础信息
          coreLinePositionName = LINE_NAMES[upper2] || ('第' + (upper2 + 1) + '爻')
          coreLineText = hex.lineTexts[upper2] || ''
          coreLineInterp = splitU2.interp
          coreLineInsight = splitU2.insight
          // 核心态势+建议使用主爻数据
          overrideSituation = liU2 ? liU2.situation : ''
          overrideAdvice = liU2 ? liU2.advice : ''
          highlightLines = [upper2, lower2]
          lineLabels[upper2] = { text: '关键', type: 'changing' }
          scenarioPositionKey = upper2
          guideText = '有两条爻在变：' + LINE_NAMES[upper2] + '和' + LINE_NAMES[lower2] + '。靠上的' + LINE_NAMES[upper2] + '为解读的「关键」。'
          break
        }

        case 3: {
          // 本卦 + 变卦纵向展示，卦辞已嵌入卦象区
          coreType = 'judgment'
          coreIsChanged = false
          scenarioPositionKey = 'judgment'
          guideText = '旧局已动，新象初成。于本卦洞察当下之「态势」，于变卦求索未来之「行动」。'
          // 行动建议取变卦的 insight
          if (changed) {
            var changedInsight3 = hexagramInsights[changed.number]
            if (changedInsight3) {
              overrideAdvice = changedInsight3.advice
            }
          }
          break
        }

        case 4: {
          // 变卦两静爻：下位为核心（同1-2模式展示在core-insight）
          coreType = 'judgment'
          coreIsChanged = false
          var unchanged4: number[] = []
          for (var u4 = 0; u4 < 6; u4++) {
            if (changingLines.indexOf(u4) < 0) {
              unchanged4.push(u4)
            }
          }
          unchanged4.sort(function (a: number, b: number) { return a - b })
          var lower4 = unchanged4[0]
          var upper4 = unchanged4.length > 1 ? unchanged4[1] : unchanged4[0]
          if (changed) {
            var split4 = _splitInterp((changed.lineInterpretations && changed.lineInterpretations[lower4]) || '')
            coreLinePositionName = LINE_NAMES[lower4] || ('第' + (lower4 + 1) + '爻')
            coreLineText = changed.lineTexts[lower4] || ''
            coreLineInterp = split4.interp
            coreLineInsight = split4.insight
            var li4 = lineInsights[changed.number]
            var liL4 = li4 && li4[lower4]
            overrideSituation = liL4 ? liL4.situation : ''
            overrideAdvice = liL4 ? liL4.advice : ''
          }
          highlightLines = unchanged4.slice()
          lineLabels[lower4] = { text: '关键', type: 'static' }
          scenarioPositionKey = lower4
          guideText = '六条里有四条在变，变化很大。重点看变卦中没变的' + LINE_NAMES[lower4] + '和' + LINE_NAMES[upper4] + '——这是你在变局中该坚守的方向。'
          break
        }

        case 5: {
          // 变卦唯一静爻：同1-2模式展示在core-insight
          coreType = 'judgment'
          coreIsChanged = false
          var unchanged5: number[] = []
          for (var u5 = 0; u5 < 6; u5++) {
            if (changingLines.indexOf(u5) < 0) {
              unchanged5.push(u5)
            }
          }
          var only5 = unchanged5[0]
          if (changed) {
            var split5 = _splitInterp((changed.lineInterpretations && changed.lineInterpretations[only5]) || '')
            coreLinePositionName = LINE_NAMES[only5] || ('第' + (only5 + 1) + '爻')
            coreLineText = changed.lineTexts[only5] || ''
            coreLineInterp = split5.interp
            coreLineInsight = split5.insight
            var li5 = lineInsights[changed.number]
            var liItem5 = li5 && li5[only5]
            overrideSituation = liItem5 ? liItem5.situation : ''
            overrideAdvice = liItem5 ? liItem5.advice : ''
          }
          highlightLines = [only5]
          lineLabels[only5] = { text: '关键', type: 'static' }
          scenarioPositionKey = only5
          guideText = '六条里五条都变了，只剩' + LINE_NAMES[only5] + '没动。重点就看变卦里这条不动的爻——这是你在变局中该坚守的方向。'
          break
        }

        case 6: {
          // 检查彩蛋（乾用九 / 坤用六）
          var egg = EASTER_EGGS[hex.number]
          if (egg) {
            coreType = 'easter-egg'
            easterEggText = egg.text
            easterEggInterp = egg.interp
            easterEggQuoteLine1 = egg.quoteLine1
            easterEggQuoteLine2 = egg.quoteLine2
            overrideSituation = egg.situation
            overrideAdvice = egg.advice
            attitude = { label: '终极启示', color: 'gold' }
            guideText = '六爻皆变，触发了' + hex.name + '卦独有的「' + (hex.number === 1 ? '用九' : '用六') + '」——这是超越六爻之上的终极启示。'
          } else {
            // 普通六爻全变：变卦信息在双纵排展示，核心区用0-style态势
            coreType = 'judgment'
            coreIsChanged = false
            guideText = '六条爻全部都变了，本卦彻底变成了变卦。直接看变卦的卦辞。'
          }
          scenarioPositionKey = 'judgment'
          break
        }
      }

      // ====== 构建 detail sheet 的完整爻辞列表 ======
      var keyPosition = -1
      var secondaryPosition = -1

      if (changingCount === 1) {
        keyPosition = changingLines[0]
      } else if (changingCount === 2) {
        keyPosition = changingLines[changingLines.length - 1]
        secondaryPosition = changingLines[0]
      } else if (changingCount === 4 || changingCount === 5) {
        var unchangedPositions: number[] = []
        for (var ui = 0; ui < 6; ui++) {
          if (changingLines.indexOf(ui) < 0) {
            unchangedPositions.push(ui)
          }
        }
        if (changingCount === 5 && unchangedPositions.length === 1) {
          keyPosition = unchangedPositions[0]
        } else if (changingCount === 4 && unchangedPositions.length === 2) {
          keyPosition = unchangedPositions[0]
          secondaryPosition = unchangedPositions[1]
        }
      }

      var allLineTexts: ILineDetail[] = hex.lineTexts.map(function (text: string, i: number) {
        var isChanging = changingLines.indexOf(i) >= 0
        var focusTag = ''
        if (i === keyPosition) {
          focusTag = '关键'
        } else if (i === secondaryPosition) {
          focusTag = '次要'
        }

        var showChangedText = false
        if (isChanging && changed) {
          showChangedText = true
        } else if (!isChanging && focusTag && changingCount >= 4 && changed) {
          showChangedText = true
        }

        var rawInterp = (hex.lineInterpretations && hex.lineInterpretations[i]) || ''
        var splitResult = _splitInterp(rawInterp)

        var changedRaw = (showChangedText && changed && changed.lineInterpretations) ? (changed.lineInterpretations[i] || '') : ''
        var changedSplit = _splitInterp(changedRaw)

        return {
          position: i,
          positionName: LINE_NAMES[i] || ('第' + (i + 1) + '爻'),
          text: text,
          interp: splitResult.interp,
          insight: splitResult.insight,
          isChanging: isChanging,
          changedText: showChangedText ? ((changed && changed.lineTexts[i]) || '') : '',
          changedInterp: changedSplit.interp,
          changedInsight: changedSplit.insight,
          focusTag: focusTag,
        }
      }).reverse()

      // detail sheet 卦辞标签
      var hexFocusTag = ''
      var changedFocusTag = ''
      if (changingCount === 0) {
        hexFocusTag = '关键'
      } else if (changingCount <= 2) {
        hexFocusTag = '关键'
        if (changed) { changedFocusTag = '参考' }
      } else if (changingCount === 3) {
        hexFocusTag = '当前'
        changedFocusTag = '趋势'
      } else {
        hexFocusTag = '次要'
        changedFocusTag = '关键'
      }

      // detail sheet 旧版指引文案
      var guidanceText = ''
      if (changingCount === 0) {
        guidanceText = '本卦无变爻，以「' + hex.name + '」卦辞为整体指引，参考各爻辞了解不同阶段的启示。'
      } else if (changingCount === 1) {
        guidanceText = '一爻变动，重点看本卦变爻的爻辞，那是当前处境最关键的启示。'
      } else if (changingCount === 2) {
        guidanceText = '两爻变动，以上方变爻为主要参考，下方变爻为辅。'
      } else if (changingCount === 3 && changed) {
        guidanceText = '三爻变动，本卦「' + hex.name + '」与变卦「' + changed.name + '」卦辞综合来看，本卦看当前处境，变卦看发展趋势。'
      } else if (changingCount === 4 && changed) {
        guidanceText = '四爻变动，变卦「' + changed.name + '」中不变的两爻是关键所在，以下方不变爻为主。'
      } else if (changingCount === 5 && changed) {
        guidanceText = '五爻变动，变卦「' + changed.name + '」中唯一不变的爻是核心启示。'
      } else if (changingCount === 6 && changed) {
        if (EASTER_EGGS[hex.number]) {
          guidanceText = '六爻皆变，' + hex.name + '卦「' + (hex.number === 1 ? '用九' : '用六') + '」启动。以本卦「' + hex.name + '」的视角来看各爻。'
        } else {
          guidanceText = '六爻皆变，局势完全翻转，以变卦「' + changed.name + '」卦辞为断。'
        }
      }

      self.setData({
        hexagram: hex,
        changedHexagram: changed,
        changingLines: changingLines,
        changingCount: changingCount,
        throws: result.throws,
        allLineTexts: allLineTexts,
        attitudeLabel: attitude.label,
        attitudeColor: attitude.color,
        insightSituation: overrideSituation || (insight ? insight.situation : ''),
        insightAdvice: overrideAdvice || (insight ? insight.advice : ''),
        hexFocusTag: hexFocusTag,
        changedFocusTag: changedFocusTag,
        guidanceText: guidanceText,
        // 新分层数据
        coreType: coreType,
        coreIsChanged: coreIsChanged,
        coreLines: coreLines,
        easterEggText: easterEggText,
        easterEggInterp: easterEggInterp,
        easterEggQuoteLine1: easterEggQuoteLine1,
        easterEggQuoteLine2: easterEggQuoteLine2,
        guideText: guideText,
        highlightLines: highlightLines,
        lineLabels: lineLabels,
        scenarioPositionKey: scenarioPositionKey,
        coreLinePositionName: coreLinePositionName,
        coreLineText: coreLineText,
        coreLineInterp: coreLineInterp,
        coreLineInsight: coreLineInsight,
        hexCollapsed: false,
        collapseBarVisible: false,
        dualArrowVisible: false,
        dualChangedVisible: false,
      })

      // 彩蛋降临蒙层
      if (coreType === 'easter-egg') {
        self.setData({ eggCeremonyPhase: 'enter' })
      }

      // 检测是否已保存过
      var throwsStr = result.throws.join(',')
      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      for (var hi = 0; hi < history.length; hi++) {
        if (history[hi].throws && history[hi].throws.join(',') === throwsStr) {
          self.setData({ isSaved: true })
          break
        }
      }

      // 自动加载从首页传入的情境
      var sceneParam = options.scene as ScenarioKey
      if (sceneParam && hex) {
        self._loadScenario(sceneParam)
      }

      // 首次引导横幅
      var guideSeen = wx.getStorageSync('guide_seen')
      if (!guideSeen) {
        self.setData({ showGuide: true })
      }
    },

    // 加载场景内容（根据 scenarioPositionKey 决定用卦级还是爻级数据）
    _loadScenario: function (sceneKey: ScenarioKey) {
      var self = this
      var changingCount = self.data.changingCount
      var hex = self.data.hexagram
      var changed = self.data.changedHexagram
      var posKey = self.data.scenarioPositionKey

      if (!hex) return

      var content = ''
      if (posKey === 'judgment') {
        if (self.data.coreType === 'easter-egg') {
          // 彩蛋：优先使用专属用九/用六情境内容，fallback到普通卦级
          var eggContent = easterEggScenarios[hex.number]
          if (eggContent && eggContent[sceneKey]) {
            content = eggContent[sceneKey]
          } else {
            var fallback = hexagramsPremium[hex.number]
            if (fallback && fallback[sceneKey]) {
              content = fallback[sceneKey]
            }
          }
        } else if (changingCount === 3 && changed) {
          // 3变爻：拼接本卦 + 过渡引导语 + 变卦
          var pHex = hexagramsPremium[hex.number]
          var pChanged = hexagramsPremium[changed.number]
          var hexContent = (pHex && pHex[sceneKey]) || ''
          var changedContent = (pChanged && pChanged[sceneKey]) || ''
          if (hexContent && changedContent) {
            var transition = _pickTransition(self.data.changingLines)
            content = hexContent + '\n\n' + transition + '\n\n' + changedContent
          } else {
            content = hexContent || changedContent
          }
        } else {
          // 其他卦级情境（easter-egg用本卦）
          var scenarioHex = (changingCount >= 4 && changed && self.data.coreType !== 'easter-egg') ? changed : hex
          var premium = hexagramsPremium[scenarioHex.number]
          if (premium && premium[sceneKey]) {
            content = premium[sceneKey]
          }
        }
      } else {
        // 爻级情境：使用占位函数
        var scenarioHexNum = (changingCount >= 4 && changed) ? changed.number : hex.number
        content = getLineScenario(scenarioHexNum, posKey, sceneKey)
      }

      if (!content) return

      // 查找标签
      var tag = ''
      var label = ''
      for (var si = 0; si < scenarioMetas.length; si++) {
        if (scenarioMetas[si].key === sceneKey) {
          tag = scenarioMetas[si].emoji + ' ' + scenarioMetas[si].label
          label = scenarioMetas[si].label
          break
        }
      }

      self.setData({
        activeScene: sceneKey,
        scenarioContent: content,
        sceneTag: tag,
        sceneLabel: label,
        scenarioRevealed: false,
        scenarioHeight: 0,
      })
    },

    // 返回上一页（支持从历史记录或起卦页进入）
    onBack: function () {
      var pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
    },

    // 关闭首次引导横幅
    onDismissGuide: function () {
      wx.setStorageSync('guide_seen', true)
      this.setData({ showGuide: false })
    },

    onDismissEggOverlay: function () {
      var self = this
      // 先播放云朵散开动画
      self.setData({ eggCeremonyPhase: 'reveal' })
      // 云朵散开后，整体淡出
      setTimeout(function () {
        self.setData({ eggCeremonyPhase: 'exit' })
        setTimeout(function () {
          self.setData({
            eggCeremonyPhase: '',
            scenarioRevealed: true,
            scenarioHeight: 0,
          })
        }, 500)
      }, 600)
    },

    // 打开卦辞解读详情sheet
    onShowDetailSheet: function () {
      this.setData({ showDetailSheet: true })
    },

    // 关闭卦辞解读详情sheet
    onCloseDetailSheet: function () {
      this.setData({ showDetailSheet: false })
    },

    // 打开了解变卦sheet
    onShowChangeTipSheet: function () {
      this.setData({ showChangeTipSheet: true })
    },

    // 关闭了解变卦sheet
    onCloseChangeTipSheet: function () {
      this.setData({ showChangeTipSheet: false })
    },

    // 打开朱熹断卦法sheet
    onShowZhuxiSheet: function () {
      this.setData({ showZhuxiSheet: true })
    },

    // 关闭朱熹断卦法sheet
    onCloseZhuxiSheet: function () {
      this.setData({ showZhuxiSheet: false })
    },

    // 阻止事件冒泡（sheet内容区点击不关闭）
    onStopPropagation: function () {
      // 空方法，仅用于 catchtap 阻止冒泡
    },

    // 揭晓情境解读（带高度动画）
    onRevealScenario: function () {
      var self = this
      var query = self.createSelectorQuery()
      query.select('.scenario-inline-inner').boundingClientRect(function (rect: any) {
        if (!rect) {
          self.setData({ scenarioRevealed: true, scenarioHeight: 0 })
          return
        }
        var targetH = Math.ceil(rect.height) + 56 * (wx.getWindowInfo().screenWidth / 750)
        self.setData({ scenarioRevealed: true, scenarioHeight: targetH })
        setTimeout(function () {
          self.setData({ scenarioHeight: 0 })
        }, 650)
      }).exec()
    },

    // hexagram-figure 爻线点击 → scroll 到对应爻辞
    onLineTap: function (e: any) {
      var detail = e.detail
      if (!detail) return
      var pos = detail.position
      if (pos === undefined || pos === null) return
      this.setData({ scrollToView: 'core-line-' + pos })
    },

    // 4+变爻：切换本卦折叠/展开
    onToggleHexCollapse: function () {
      this.setData({ hexCollapsed: !this.data.hexCollapsed })
    },

    // 保存记录
    onSave: function () {
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

      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      history.unshift(record)

      if (history.length > 100) history.length = 100

      wx.setStorageSync('divination_history', history)

      this.setData({ isSaved: true })

      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
    },

    // 分享到聊天
    onShareAppMessage: function () {
      var hex = this.data.hexagram
      var situation = this.data.insightSituation || ''
      if (!hex) {
        return {
          title: '易简研习 - 卦象解读',
          path: '/pages/index/index',
        }
      }

      var title = ''
      if (this.data.coreType === 'easter-egg') {
        var eggName = hex.number === 1 ? '用九' : '用六'
        title = '✦ 极稀有「' + eggName + '」触发 —— ' + hex.name + '卦终极启示'
      } else {
        var titleText = situation.length > 20 ? situation.substring(0, 20) + '...' : situation
        title = hex.symbol + ' ' + hex.name + ' — ' + titleText
      }

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
    onShareTimeline: function () {
      var hex = this.data.hexagram
      var situation = this.data.insightSituation || ''
      if (!hex) {
        return {
          title: '易简研习 - 卦象解读',
          query: '',
        }
      }

      var title = ''
      if (this.data.coreType === 'easter-egg') {
        var eggName = hex.number === 1 ? '用九' : '用六'
        title = '✦ 极稀有「' + eggName + '」触发 —— ' + hex.name + '卦终极启示'
      } else {
        var titleText = situation.length > 20 ? situation.substring(0, 20) + '...' : situation
        title = hex.symbol + ' ' + hex.name + ' — ' + titleText
      }

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
