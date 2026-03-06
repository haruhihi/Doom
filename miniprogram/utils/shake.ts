// 摇一摇检测模块
// 基于加速度计 API 检测手机摇动

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

function _onAccelerometerChange(res: WechatMiniprogram.OnAccelerometerChangeCallbackResult) {
  const { x, y, z } = res
  const deltaX = Math.abs(x - _lastX)
  const deltaY = Math.abs(y - _lastY)
  const deltaZ = Math.abs(z - _lastZ)

  const totalDelta = deltaX + deltaY + deltaZ

  if (totalDelta > _threshold) {
    const now = Date.now()
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

export function startShakeDetection(callback: ShakeCallback, options?: ShakeOptions) {
  if (_isListening) {
    stopShakeDetection()
  }

  _callback = callback
  _threshold = options?.threshold ?? 15
  _cooldown = options?.cooldown ?? 1500
  _lastX = 0
  _lastY = 0
  _lastZ = 0
  _lastShakeTime = 0
  _isListening = true

  wx.startAccelerometer({
    interval: options?.interval ?? 'game',
    success: () => {
      wx.onAccelerometerChange(_onAccelerometerChange)
    },
    fail: (err) => {
      console.error('startAccelerometer failed:', err)
      _isListening = false
    }
  })
}

export function stopShakeDetection() {
  if (!_isListening) return
  _isListening = false
  _callback = null

  wx.offAccelerometerChange(_onAccelerometerChange)
  wx.stopAccelerometer({
    fail: (err) => {
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
