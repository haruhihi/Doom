// 爻级场景数据入口（异步分包加载）
// 根据卦号按需加载对应的数据分片，避免一次性加载全部 1676KB 数据
// 数据格式: string[][] — 外层按爻位(0-5)，内层按场景顺序(general..social)

// 场景键 → 数组下标映射（与 scenarioMetas 顺序一致）
var SCENARIO_INDEX: Record<string, number> = {
  general: 0, career: 1, decision: 2, love: 3,
  family: 4, wealth: 5, wellness: 6, social: 7
}

// 分片缓存，避免重复加载
var _cache: Record<string, Record<number, string[][]>> = {}

// 分片配置：卦号范围 → 分包路径 + 导出变量名
var _shards = [
  { max: 16, path: '../../subpkg-lines-a/data/lines-01-16', key: 'lines01' },
  { max: 32, path: '../../subpkg-lines-b/data/lines-17-32', key: 'lines17' },
  { max: 48, path: '../../subpkg-lines-c/data/lines-33-48', key: 'lines33' },
  { max: 64, path: '../../subpkg-lines-d/data/lines-49-64', key: 'lines49' }
]

function _getShard(hexNumber: number) {
  for (var i = 0; i < _shards.length; i++) {
    if (hexNumber <= _shards[i].max) { return _shards[i] }
  }
  return _shards[3] // fallback to last shard
}

function _extractContent(data: Record<number, string[][]>, hexNumber: number, lineIndex: number, scenarioKey: ScenarioKey): string {
  var hexData = data[hexNumber]
  if (!hexData) { return '' }
  var lineData = hexData[lineIndex]
  if (!lineData) { return '' }
  var idx = SCENARIO_INDEX[scenarioKey]
  return (idx !== undefined && lineData[idx]) || ''
}

export function getLineContent(hexNumber: number, lineIndex: number, scenarioKey: ScenarioKey): Promise<string> {
  var shard = _getShard(hexNumber)

  // 命中缓存，直接返回
  if (_cache[shard.key]) {
    return Promise.resolve(_extractContent(_cache[shard.key], hexNumber, lineIndex, scenarioKey))
  }

  // 异步加载分包数据
  return require.async(shard.path).then(function (mod: any) {
    _cache[shard.key] = mod[shard.key]
    return _extractContent(_cache[shard.key], hexNumber, lineIndex, scenarioKey)
  })
}
