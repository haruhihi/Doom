// 摇一摇检测模块
// 基于加速度计 API 检测手机摇动
// iOS 修复: 跳过首次读数 + 失败重试 + interval 兼容

interface ShakeOptions {
  threshold?: number    // 灵敏度阈值，默认15
  cooldown?: number     // 冷却时间(ms)，默认1500
  interval?: 'game' | 'ui' | 'normal'  // 采样频率
}

type ShakeCallback = () => void

let _callback: ShakeCallback | null = null
let _lastX = 0
let _lastY = 0
let _lastZ = 0
let _lastShakeTime = 0
let _threshold = 15
let _cooldown = 1500
let _isListening = false
let _hasInitialReading = false  // 是否已获得初始读数

function _onAccelerometerChange(res: WechatMiniprogram.OnAccelerometerChangeCallbackResult) {
  var x = res.x
  var y = res.y
  var z = res.z

  // 跳过首次读数，避免从 (0,0,0) 到真实值的巨大 delta 误触发
  if (!_hasInitialReading) {
    _lastX = x
    _lastY = y
    _lastZ = z
    _hasInitialReading = true
    return
  }

  var deltaX = Math.abs(x - _lastX)
  var deltaY = Math.abs(y - _lastY)
  var deltaZ = Math.abs(z - _lastZ)

  var totalDelta = deltaX + deltaY + deltaZ

  if (totalDelta > _threshold) {
    var now = Date.now()
    if (now - _lastShakeTime > _cooldown) {
      _lastShakeTime = now
      if (_callback) {
        _callback()
      }
    }
  }

  _lastX = x
  _lastY = y
  _lastZ = z
}

function _doStartAccelerometer(intervalVal: 'game' | 'ui' | 'normal', retryCount: number) {
  wx.startAccelerometer({
    interval: intervalVal,
    success: function () {
      wx.onAccelerometerChange(_onAccelerometerChange)
    },
    fail: function (err) {
      console.error('startAccelerometer failed (attempt ' + (retryCount + 1) + '):', err)
      // iOS 有时首次启动失败，重试一次，fallback 到 'ui' interval
      if (retryCount < 1) {
        setTimeout(function () {
          _doStartAccelerometer('ui', retryCount + 1)
        }, 500)
      } else {
        _isListening = false
      }
    }
  })
}

export function startShakeDetection(callback: ShakeCallback, options?: ShakeOptions) {
  if (_isListening) {
    stopShakeDetection()
  }

  _callback = callback
  _threshold = (options && options.threshold !== undefined) ? options.threshold : 15
  _cooldown = (options && options.cooldown !== undefined) ? options.cooldown : 1500
  _lastX = 0
  _lastY = 0
  _lastZ = 0
  _lastShakeTime = 0
  _hasInitialReading = false
  _isListening = true

  var intervalVal = (options && options.interval) ? options.interval : 'game'
  _doStartAccelerometer(intervalVal, 0)
}

export function stopShakeDetection() {
  if (!_isListening) return
  _isListening = false
  _callback = null
  _hasInitialReading = false

  wx.offAccelerometerChange(_onAccelerometerChange)
  wx.stopAccelerometer({
    fail: function (err) {
      console.error('stopAccelerometer failed:', err)
    }
  })
}

// 临时暂停（不停止加速度计，只暂停回调）
export function pauseShakeDetection() {
  _callback = null
}

// 恢复监听（需要传入新的回调）
export function resumeShakeDetection(callback: ShakeCallback) {
  _callback = callback
}
