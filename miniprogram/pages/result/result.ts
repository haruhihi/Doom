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

// 构建分享标题（聊天 + 朋友圈共用）
function _buildShareTitle(hex: IHexagram, coreType: string, situation: string): string {
  if (coreType === 'easter-egg') {
    var eggName = hex.number === 1 ? '用九' : '用六'
    return '✦ 极稀有「' + eggName + '」触发 —— ' + hex.name + '卦终极启示'
  }
  var titleText = situation.length > 20 ? situation.substring(0, 20) + '...' : situation
  return hex.symbol + ' ' + hex.name + ' — ' + titleText
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
    // ====== 新分层展示数据 ======
    // 核心内容类型: judgment=卦辞, easter-egg=乾用九/坤用六
    coreType: '' as '' | 'judgment' | 'easter-egg',
    // 核心内容使用的是变卦(true)还是本卦(false)
    coreIsChanged: false,
    // 彩蛋
    easterEggText: '',
    easterEggInterp: '',
    // 彩蛋降临仪式阶段: '' | 'enter' | 'reveal' | 'exit'
    eggCeremonyPhase: '' as '' | 'enter' | 'reveal' | 'exit',
    // 轻量六变仪式阶段（非乾坤）: '' | 'enter' | 'exit'
    lightCeremonyPhase: '' as '' | 'enter' | 'exit',
    // 轻量蒙层标题（三爻变动/四爻变动/五爻变动/六爻皆变）
    lightCeremonyTitle: '',
    // 变卦动画就绪（3+变爻蒙层dismiss后才播放）
    changingAnimReady: true,
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
    // 海报相关
    posterImagePath: '',
    showPosterPreview: false,
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
          guideText = '万象归寂，定数已现。当前局势稳如磐石，与其向外求索，不如静待本心的回响。\n请直接研读「本卦」卦辞，这是你此刻最真实的写照。'
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
          guideText = '一念起，万山动。这唯一的变数便是天机给你的特写，此刻，它是你破局的唯一抓手。\n请重点研读「本卦」中' + LINE_NAMES[pos1] + '的爻辞，那是唯一的出口。'
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
          guideText = '局势在两极间摇摆，落点虽众，唯有更高处的那颗星辰，才是指引你穿透迷雾的灯塔。\n请以「本卦」中位置靠上的' + LINE_NAMES[upper2] + '作为解读关键。'
          break
        }

        case 3: {
          // 本卦 + 变卦纵向展示，卦辞已嵌入卦象区
          coreType = 'judgment'
          coreIsChanged = false
          scenarioPositionKey = 'judgment'
          guideText = '旧梦未醒，新局已入。于本卦中洞悉此刻的挣扎，于变卦中采撷行动的孤勇。\n请参照「本卦」卦辞洞察现状，参考「变卦」卦辞决定去向。'
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
          guideText = '大局已倾，四海翻腾。在剧变的浪潮中，那两个岿然不动的点，便是你立身处世的最后防线。\n重点观察「变卦」中' + LINE_NAMES[lower4] + '和' + LINE_NAMES[upper4] + '两条不变的爻，那是你在动荡中该坚守的方向。'
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
          guideText = '五弦皆乱，唯有一音独清。当世界都在崩塌时，守住变卦中那抹残存的寂静，便是你翻盘的底牌。\n重点研读「变卦」中唯一没动的' + LINE_NAMES[only5] + '，那是你唯一的生机。'
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
            if (hex.number === 1) {
              guideText = '乾坤倒转，神龙潜入无名。这并非无序的混乱，而是你已强至化境，再无疆界可束缚。\n恭喜触发极稀有之局。请直接研读乾卦特有之「用九」，感悟终极天机。'
            } else {
              guideText = '地裂山崩，万物顺流。请像大地般沉默且深厚，因为唯有极度的包容，能承载住这天翻地覆的震荡。\n恭喜触发极稀有之局。请直接研读坤卦特有之「用六」，感悟终极天机。'
            }
          } else {
            // 普通六爻全变：变卦信息在双纵排展示，核心区用0-style态势
            coreType = 'judgment'
            coreIsChanged = false
            guideText = '旧局燃尽，余烬成灰。请彻底告别过往，因为你正站在一个从未被定义过的新纪元起点。\n请直接研读「变卦」的卦辞，这是你未来的全景图。'
          }
          scenarioPositionKey = 'judgment'
          break
        }
      }

      // 轻量蒙层标题 & 变卦动画就绪
      var lightCeremonyTitleMap: Record<number, string> = { 3: '三爻变动', 4: '四爻变动', 5: '五爻变动', 6: '六爻皆变' }
      var lightCeremonyTitle = lightCeremonyTitleMap[changingCount] || ''
      var changingAnimReady = changingCount < 3 || coreType === 'easter-egg'

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

      // 蒙层阶段（合入主 setData，避免两次渲染之间内容闪现）
      var eggCeremonyPhase = ''
      var lightCeremonyPhase = ''
      if (coreType === 'easter-egg') {
        eggCeremonyPhase = 'enter'
      } else if (changingCount >= 3) {
        lightCeremonyPhase = 'enter'
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
        lightCeremonyTitle: lightCeremonyTitle,
        changingAnimReady: changingAnimReady,
        // 蒙层（同批渲染，避免闪烁）
        eggCeremonyPhase: eggCeremonyPhase,
        lightCeremonyPhase: lightCeremonyPhase,
      })

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

    },

    // 将场景内容写入页面数据
    _applyScenario: function (sceneKey: ScenarioKey, content: string) {
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

      this.setData({
        activeScene: sceneKey,
        scenarioContent: content,
        sceneTag: tag,
        sceneLabel: label,
        scenarioRevealed: false,
        scenarioHeight: 0,
      })
    },

    // 加载场景内容（根据 scenarioPositionKey 决定用卦级还是爻级数据）
    _loadScenario: function (sceneKey: ScenarioKey) {
      var self = this
      var changingCount = self.data.changingCount
      var hex = self.data.hexagram
      var changed = self.data.changedHexagram
      var posKey = self.data.scenarioPositionKey

      if (!hex) return

      if (posKey === 'judgment') {
        // 卦辞级别：同步加载
        var content = ''
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
        self._applyScenario(sceneKey, content)
      } else {
        // 爻级情境：异步加载分包数据
        var scenarioHexNum = (changingCount >= 4 && changed) ? changed.number : hex.number
        var lineResult = getLineScenario(scenarioHexNum, posKey, sceneKey)
        // getLineScenario 爻级别返回 Promise<string>
        if (lineResult && typeof (lineResult as any).then === 'function') {
          (lineResult as Promise<string>).then(function (text) {
            self._applyScenario(sceneKey, text)
          })
        } else {
          // 安全 fallback（不应到达此分支）
          self._applyScenario(sceneKey, lineResult as string)
        }
      }
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

    onDismissLightOverlay: function () {
      var self = this
      self.setData({ lightCeremonyPhase: 'exit' })
      setTimeout(function () {
        self.setData({ lightCeremonyPhase: '', changingAnimReady: true })
      }, 400)
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

    // 取消保存
    onUnsave: function () {
      if (!this.data.hexagram) return
      var throwsStr = this.data.throws.join(',')
      var history: IDivinationRecord[] = wx.getStorageSync('divination_history') || []
      var filtered = history.filter(function (r) {
        return !(r.throws && r.throws.join(',') === throwsStr)
      })
      wx.setStorageSync('divination_history', filtered)
      this.setData({ isSaved: false })
      wx.showToast({
        title: '已取消',
        icon: 'none'
      })
    },

    // 生成海报（Canvas 绘制）
    onGeneratePoster: function () {
      var self = this
      var hex = self.data.hexagram
      if (!hex) return

      wx.showLoading({ title: '生成中...' })

      // 获取 canvas 节点
      self.createSelectorQuery()
        .select('#poster-canvas')
        .fields({ node: true, size: true })
        .exec(function (res: any) {
          if (!res || !res[0] || !res[0].node) {
            wx.hideLoading()
            wx.showToast({ title: '生成失败', icon: 'none' })
            return
          }

          var canvas = res[0].node
          var ctx = canvas.getContext('2d')

          // ========== 布局常量（逻辑像素） ==========
          var W = 375
          var dpr = 2
          var PAD = 28              // 左右边距
          var CONTENT_W = W - PAD * 2

          // 颜色（与页面 CSS 变量一致）
          var BG         = '#1a1a2e'
          var BG_CENTER  = '#222240'   // 径向渐变中心（稍亮）
          var GOLD       = '#c9a96e'
          var GOLD_DIM   = 'rgba(201, 169, 110, 0.35)'
          var TEXT_SEC    = '#a89070'

          // 两档字体
          var FONT_PRIMARY   = 'bold 16px sans-serif'
          var FONT_SECONDARY = '13px sans-serif'

          // 态势标签颜色映射
          var ATTITUDE_COLORS: Record<string, string> = {
            green:  '#4caf50',
            yellow: '#f0c040',
            orange: '#e07030',
            red:    '#d84040',
            purple: '#9c5ec0',
            gold:   '#c9a96e',
          }

          // ========== 先测量文字高度 ==========
          canvas.width = W * dpr
          canvas.height = 900 * dpr
          ctx.scale(dpr, dpr)

          // 场景启示文字（优先展示；无场景时 fallback 到卦辞翻译）
          var bodyText = self.data.scenarioContent || ''
          if (!bodyText && hex.judgmentTranslation) {
            bodyText = hex.judgmentTranslation
          }
          if (!bodyText && hex.interpretation) {
            bodyText = hex.interpretation
          }

          // 场景标签
          var sceneLabel = self.data.sceneTag || ''

          // 态势标签
          var attitudeLabel = self.data.attitudeLabel || ''
          var attitudeColor = self.data.attitudeColor || ''

          ctx.font = FONT_SECONDARY
          var bodyTextW = CONTENT_W
          var bodyTextH = bodyText ? self._measureWrappedTextHeight(ctx, bodyText, bodyTextW, 20) : 0

          // ========== 计算总高度 ==========
          var topPad = 36
          var titleH = 18                // 应用标题行高
          var gapAfterTitle = 16
          // 卦象区域（单行：symbol + 卦名 + 三才，下方卦辞）
          var hexNameH = 22             // symbol + 卦名行高
          var gapAfterName = 8
          // 测量卦辞换行高度
          ctx.font = FONT_SECONDARY
          var judgmentTextW = CONTENT_W
          var judgmentStr = hex.judgment
          var judgmentH = self._measureWrappedTextHeight(ctx, judgmentStr, judgmentTextW, 20)
          var hexRowH = hexNameH + gapAfterName + judgmentH
          var gapAfterHexRow = 16
          // 装饰分隔（— tag —）或（— ◆ —）
          var decoSepH = 14
          var gapAfterDecoSep = 18
          // 场景内容
          var sceneLabelH = sceneLabel ? 28 : 0
          var bodyBlockH = bodyTextH + sceneLabelH
          var gapAfterBody = bodyText ? 18 : 0
          // 底部装饰分隔 + 品牌区 + 免责声明
          var decoSep2H = 14
          var gapAfterDecoSep2 = 14
          var bottomH = 84
          var disclaimerH = 28
          var bottomPad = 20

          var totalH = topPad + titleH + gapAfterTitle
            + hexRowH + gapAfterHexRow
            + decoSepH + gapAfterDecoSep
            + bodyBlockH + gapAfterBody
            + decoSep2H + gapAfterDecoSep2
            + bottomH + disclaimerH + bottomPad
          if (totalH < 480) totalH = 480

          // ========== 正式设置画布尺寸 ==========
          canvas.width = W * dpr
          canvas.height = totalH * dpr
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.scale(dpr, dpr)

          // ========== 背景：径向渐变（中心稍亮，边缘深） ==========
          ctx.fillStyle = BG
          ctx.fillRect(0, 0, W, totalH)
          var grd = ctx.createRadialGradient(W / 2, totalH * 0.35, 0, W / 2, totalH * 0.35, W * 0.8)
          grd.addColorStop(0, BG_CENTER)
          grd.addColorStop(1, 'rgba(26, 26, 46, 0)')
          ctx.fillStyle = grd
          ctx.fillRect(0, 0, W, totalH)

          // 细金色边框
          var borderInset = 8
          ctx.strokeStyle = GOLD_DIM
          ctx.lineWidth = 0.5
          self._roundRect(ctx, borderInset, borderInset, W - borderInset * 2, totalH - borderInset * 2, 10)
          ctx.stroke()

          // 四角L形装饰
          var cLen = 16
          var cOff = 13
          ctx.strokeStyle = GOLD
          ctx.lineWidth = 1.2
          // 左上
          ctx.beginPath()
          ctx.moveTo(cOff, cOff + cLen)
          ctx.lineTo(cOff, cOff)
          ctx.lineTo(cOff + cLen, cOff)
          ctx.stroke()
          // 右上
          ctx.beginPath()
          ctx.moveTo(W - cOff - cLen, cOff)
          ctx.lineTo(W - cOff, cOff)
          ctx.lineTo(W - cOff, cOff + cLen)
          ctx.stroke()
          // 左下
          ctx.beginPath()
          ctx.moveTo(cOff, totalH - cOff - cLen)
          ctx.lineTo(cOff, totalH - cOff)
          ctx.lineTo(cOff + cLen, totalH - cOff)
          ctx.stroke()
          // 右下
          ctx.beginPath()
          ctx.moveTo(W - cOff - cLen, totalH - cOff)
          ctx.lineTo(W - cOff, totalH - cOff)
          ctx.lineTo(W - cOff, totalH - cOff - cLen)
          ctx.stroke()

          // ========== 辅助：绘制装饰分隔 — ◆ — 或 — label — ==========
          function drawDecoSep(cy: number, label?: string, labelColor?: string) {
            if (label) {
              // — label — 模式：文字替代菱形
              ctx.font = FONT_SECONDARY
              var tw = ctx.measureText(label).width
              var gap = 10          // 文字与横线间距
              var dashW = 36        // 横线长度
              var lineColor = labelColor || GOLD_DIM
              // 左横线
              ctx.strokeStyle = lineColor
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(W / 2 - tw / 2 - gap - dashW, cy)
              ctx.lineTo(W / 2 - tw / 2 - gap, cy)
              ctx.stroke()
              // 右横线
              ctx.beginPath()
              ctx.moveTo(W / 2 + tw / 2 + gap, cy)
              ctx.lineTo(W / 2 + tw / 2 + gap + dashW, cy)
              ctx.stroke()
              // 文字
              ctx.fillStyle = labelColor || GOLD
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(label, W / 2, cy)
            } else {
              // — ◆ — 模式
              var dW = 40
              var diamondSize = 4
              ctx.strokeStyle = GOLD_DIM
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(W / 2 - dW - diamondSize - 6, cy)
              ctx.lineTo(W / 2 - diamondSize - 6, cy)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(W / 2 + diamondSize + 6, cy)
              ctx.lineTo(W / 2 + dW + diamondSize + 6, cy)
              ctx.stroke()
              ctx.fillStyle = GOLD_DIM
              ctx.beginPath()
              ctx.moveTo(W / 2, cy - diamondSize)
              ctx.lineTo(W / 2 + diamondSize, cy)
              ctx.lineTo(W / 2, cy + diamondSize)
              ctx.lineTo(W / 2 - diamondSize, cy)
              ctx.closePath()
              ctx.fill()
            }
          }

          var y = topPad

          // ========== 应用标题 ==========
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = TEXT_SEC
          ctx.font = FONT_SECONDARY
          ctx.fillText('易简研习 · 卦象解读', W / 2, y)
          y += titleH + gapAfterTitle

          // ========== 卦象区域（symbol + 卦名 + 三才 → 卦辞） ==========
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'

          // 卦象符号 + 卦名
          ctx.fillStyle = GOLD
          ctx.font = FONT_PRIMARY
          var symbolStr = (hex.symbol || '') + ' ' + hex.name + '卦'
          ctx.fillText(symbolStr, PAD, y)

          // 上下卦（紧跟卦名右侧）
          var symbolNameW = ctx.measureText(symbolStr).width
          ctx.fillStyle = TEXT_SEC
          ctx.font = FONT_SECONDARY
          ctx.fillText(hex.upperTrigram + '上·' + hex.lowerTrigram + '下', PAD + symbolNameW + 8, y + 3)
          y += hexNameH + gapAfterName

          // 卦辞
          ctx.fillStyle = TEXT_SEC
          ctx.font = FONT_SECONDARY
          self._drawWrappedText(ctx, judgmentStr, PAD, y, judgmentTextW, 20, 'left')
          y += judgmentH + gapAfterHexRow

          // ========== 装饰分隔 — tag — 或 — ◆ — ==========
          if (attitudeLabel) {
            var pillColor = ATTITUDE_COLORS[attitudeColor] || GOLD
            drawDecoSep(y + decoSepH / 2, attitudeLabel, pillColor)
          } else {
            drawDecoSep(y + decoSepH / 2)
          }
          y += decoSepH + gapAfterDecoSep

          // ========== 场景启示 ==========
          if (sceneLabel) {
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillStyle = GOLD
            ctx.font = FONT_PRIMARY
            ctx.fillText(sceneLabel, PAD, y)
            y += sceneLabelH
          }

          if (bodyText) {
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillStyle = TEXT_SEC
            ctx.font = FONT_SECONDARY
            self._drawWrappedText(ctx, bodyText, PAD, y, bodyTextW, 20, 'left')
            y += bodyTextH + gapAfterBody
          }

          // ========== 装饰分隔符 2 ==========
          drawDecoSep(y + decoSep2H / 2)
          y += decoSep2H + gapAfterDecoSep2

          // ========== 底部品牌区域 ==========
          var bottomY = totalH - bottomH - disclaimerH - bottomPad

          var qrSize = 64
          var qrX = PAD
          var qrY = bottomY + (bottomH - qrSize) / 2 + 2

          // 加载 QR 码图片
          var qrImage = canvas.createImage()
          qrImage.onload = function () {
            // 白底圆角
            ctx.fillStyle = '#ffffff'
            self._roundRect(ctx, qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 6)
            ctx.fill()
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

            // 品牌文字
            var tX = qrX + qrSize + 14
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillStyle = GOLD
            ctx.font = FONT_PRIMARY
            ctx.fillText('易简研习', tX, qrY + 8)

            ctx.fillStyle = TEXT_SEC
            ctx.font = FONT_SECONDARY
            ctx.fillText('长按识别小程序码', tX, qrY + 30)
            ctx.fillText('体验经典智慧', tX, qrY + 46)

            // 免责声明
            ctx.fillStyle = TEXT_SEC
            ctx.font = FONT_SECONDARY
            ctx.textAlign = 'center'
            ctx.fillText('本内容仅供传统文化学习参考，不构成任何现实决策依据。', W / 2, bottomY + bottomH + disclaimerH / 2 - 6)

            // 导出图片
            wx.canvasToTempFilePath({
              canvas: canvas,
              fileType: 'png',
              quality: 1,
              success: function (exportRes) {
                wx.hideLoading()
                self.setData({
                  posterImagePath: exportRes.tempFilePath,
                  showPosterPreview: true
                })
              },
              fail: function (err) {
                wx.hideLoading()
                console.error('canvasToTempFilePath failed:', err)
                wx.showToast({ title: '生成失败', icon: 'none' })
              }
            })
          }
          qrImage.onerror = function () {
            wx.hideLoading()
            wx.showToast({ title: 'QR码加载失败', icon: 'none' })
          }
          qrImage.src = '/images/share-before318.png'
        })
    },

    // 预览海报图片（用户可长按转发为真正的图片）
    onSharePosterImage: function () {
      var self = this
      if (!self.data.posterImagePath) return

      wx.previewImage({
        urls: [self.data.posterImagePath],
        current: self.data.posterImagePath
      })
    },

    // 辅助：绘制圆角矩形路径（不自动 stroke/fill）
    _roundRect: function (ctx: any, x: number, y: number, w: number, h: number, r: number) {
      if (r > h / 2) r = h / 2
      if (r > w / 2) r = w / 2
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.arcTo(x + w, y, x + w, y + r, r)
      ctx.lineTo(x + w, y + h - r)
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
      ctx.lineTo(x + r, y + h)
      ctx.arcTo(x, y + h, x, y + h - r, r)
      ctx.lineTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r)
      ctx.closePath()
    },

    // 辅助：hex 色值转 r,g,b 字符串（用于 rgba）
    _hexToRgb: function (hex: string): string {
      var r = parseInt(hex.slice(1, 3), 16)
      var g = parseInt(hex.slice(3, 5), 16)
      var b = parseInt(hex.slice(5, 7), 16)
      return r + ', ' + g + ', ' + b
    },

    // 辅助：Canvas 自动换行绘制文字
    _drawWrappedText: function (ctx: any, text: string, x: number, startY: number, maxWidth: number, lineHeight: number, align: string) {
      ctx.textAlign = align
      ctx.textBaseline = 'top'
      var chars = text.split('')
      var line = ''
      var y = startY

      for (var i = 0; i < chars.length; i++) {
        var testLine = line + chars[i]
        var metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line.length > 0) {
          ctx.fillText(line, x, y)
          line = chars[i]
          y += lineHeight
        } else {
          line = testLine
        }
      }
      if (line) {
        ctx.fillText(line, x, y)
      }
    },

    // 辅助：测量换行文字高度
    _measureWrappedTextHeight: function (ctx: any, text: string, maxWidth: number, lineHeight: number): number {
      var chars = text.split('')
      var line = ''
      var lines = 1

      for (var i = 0; i < chars.length; i++) {
        var testLine = line + chars[i]
        var metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line.length > 0) {
          line = chars[i]
          lines++
        } else {
          line = testLine
        }
      }
      return lines * lineHeight
    },

    // 保存海报到相册
    onSavePoster: function () {
      var self = this
      if (!self.data.posterImagePath) return

      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success: function () {
          wx.saveImageToPhotosAlbum({
            filePath: self.data.posterImagePath,
            success: function () {
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: function () {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        },
        fail: function () {
          // 权限被拒绝，引导用户去设置页开启
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限以保存图片',
            confirmText: '去设置',
            success: function (modalRes) {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      })
    },

    // 关闭海报预览
    onClosePosterPreview: function () {
      this.setData({ showPosterPreview: false, posterImagePath: '' })
    },

    // 分享到聊天
    onShareAppMessage: function () {
      var hex = this.data.hexagram
      if (!hex) {
        return {
          title: '易简研习 - 卦象解读',
          path: '/pages/index/index',
        }
      }

      var title = _buildShareTitle(hex, this.data.coreType, this.data.insightSituation || '')
      var path = '/pages/result/result?throws=' + this.data.throws.join(',')
      if (this.data.activeScene) {
        path = path + '&scene=' + this.data.activeScene
      }

      var result: any = {
        title: title,
        path: path,
      }

      // 如果有海报图片，使用海报作为分享卡片封面
      if (this.data.posterImagePath) {
        result.imageUrl = this.data.posterImagePath
      }

      return result
    },

    // 分享到朋友圈
    onShareTimeline: function () {
      var hex = this.data.hexagram
      if (!hex) {
        return {
          title: '易简研习 - 卦象解读',
          query: '',
        }
      }

      var title = _buildShareTitle(hex, this.data.coreType, this.data.insightSituation || '')
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
