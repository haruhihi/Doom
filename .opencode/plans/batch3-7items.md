# Batch 3: Execute 7 Approved Items

## Execution Order: 4 → 5 → 6 → 7 → 2 → 3 → 1

---

## Item 4 — Rename button text (SIMPLE)

**File:** `miniprogram/pages/divine/divine.wxml` L58

**Change:**
```
OLD: >{{currentThrow > 0 ? '继续' : '掷铜钱'}}</button>
NEW: >{{currentThrow > 0 ? '继续' : '分次掷出'}}</button>
```

---

## Item 5 — Add "什么是爻？" QA section (SIMPLE)

**File:** `miniprogram/pages/result/result.wxml` — Insert BEFORE line 242 (the existing "什么是变爻？" section)

**Insert this block between `<view class="sheet-body">` (L241) and the first `<view class="change-tip-section">` (L242):**
```xml
      <view class="change-tip-section">
        <text class="change-tip-heading">什么是爻？</text>
        <text class="change-tip-paragraph">爻是组成卦象的基本单位，每个卦由六个爻从下往上排列而成。一条实线「—」代表阳爻，一条断线「- -」代表阴爻。六个爻的不同组合构成了易经的六十四卦。</text>
      </view>
```

This goes inside the "什么是变化？" sheet, as the FIRST section before "什么是变爻？".

---

## Item 6 — Merge footer quote + source into one line (SIMPLE)

### File 1: `miniprogram/pages/index/index.wxml` L52-55

**Change:**
```
OLD:
    <view class="footer-deco">
      <text class="footer-text">{{footerQuote}}</text>
      <text class="footer-source">——{{footerSource}}</text>
    </view>

NEW:
    <view class="footer-deco">
      <text class="footer-text">{{footerQuote}} ——{{footerSource}}</text>
    </view>
```

### File 2: `miniprogram/pages/index/index.scss`

**Remove** the `.footer-source` block (L233-238):
```scss
/* DELETE THIS */
.footer-source {
  font-size: 22rpx;
  color: var(--text-tertiary);
  letter-spacing: 2rpx;
  opacity: 0.6;
}
```

**Simplify** `.footer-deco` — remove `gap: 12rpx` since there's only one child now:
```
OLD:
.footer-deco {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  margin-top: auto;
  padding-top: 20rpx;
  padding-bottom: 48rpx;
}

NEW:
.footer-deco {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  padding-top: 20rpx;
  padding-bottom: 48rpx;
}
```

---

## Item 7 — Change subtitle + add old subtitle to quote pool (SIMPLE)

### File 1: `miniprogram/pages/index/index.wxml` L12

**Change:**
```
OLD: <text class="app-subtitle">谦谦君子，用涉大川</text>
NEW: <text class="app-subtitle">以简研易，可通天下</text>
```

### File 2: `miniprogram/data/quotes.ts`

**Add** this entry to the end of the array (before the closing `]`), after the Lin Zexu entry (L129):
```typescript
  // ===== 周易 =====
  { text: '谦谦君子，用涉大川', source: '《周易·谦卦》' },
```

---

## Item 2 — Strengthen results-hint (MEDIUM)

### File 1: `miniprogram/pages/divine/divine.wxml` L72

**Change:**
```
OLD: <text class="results-hint" wx:if="{{hasChangingLine}}">标有「变」表示该爻正在变化</text>
NEW: <text class="results-hint" wx:if="{{hasChangingLine}}">标有「变」表示该爻正在变化，点击查看解读发现更多</text>
```

### File 2: `miniprogram/pages/divine/divine.scss` — Replace `.results-hint` (L262-268)

**Change:**
```scss
OLD:
.results-hint {
  font-size: 22rpx;
  color: var(--text-tertiary);
  text-align: center;
  display: block;
  margin-bottom: 16rpx;
}

NEW:
.results-hint {
  font-size: 24rpx;
  color: var(--text-body);
  background: var(--red-bg-light);
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  border-left: 4rpx solid var(--red);
  display: block;
  margin-bottom: 16rpx;
}
```

---

## Item 3 — Unified headerHint (COMPLEX)

### File 1: `miniprogram/pages/divine/divine.ts`

**A) Add `headerHint` to data (after `hasChangingLine: false,`):**
```typescript
    headerHint: '每次掷出三枚铜钱，共六次',
```

**B) In `_doThrow()` — set hint to '铜钱落定中...' when animation starts:**

In the `_doThrow()` method, change the first `setData` call (around L72-75):
```typescript
OLD:
      this.setData({
        isAnimating: true,
        coinResults: undefined,
      })

NEW:
      this.setData({
        isAnimating: true,
        coinResults: undefined,
        headerHint: '铜钱落定中...',
      })
```

**C) In `_doThrow()` — set hint when animation ends:**

In the second `setData` call inside `_doThrow()` (around L99-106), add the headerHint:
```typescript
OLD:
          this.setData({
            throwResults,
            throws,
            currentThrow: nextThrow,
            isAnimating: false,
            isComplete,
            hasChangingLine: this.data.hasChangingLine || lineResult.isChanging,
          })

NEW:
          this.setData({
            throwResults,
            throws,
            currentThrow: nextThrow,
            isAnimating: false,
            isComplete,
            hasChangingLine: this.data.hasChangingLine || lineResult.isChanging,
            headerHint: isComplete ? '结果已出，点击查看解读' : '点击继续',
          })
```

**D) In `_doQuickStep()` — set hint to '铜钱落定中...' when each step's animation starts:**

In `_doQuickStep`, in the first `setData` inside setTimeout (around L148-151):
```typescript
OLD:
        self.setData({
          isAnimating: false,
          coinResults: undefined,
        })

NEW:
        self.setData({
          isAnimating: false,
          coinResults: undefined,
          headerHint: '铜钱落定中...',
        })
```

**E) In `_doQuickStep()` — set hint when complete:**

In the `setData` call after recording results (around L180-187):
```typescript
OLD:
            self.setData({
              throwResults: throwResults,
              throws: throws,
              currentThrow: nextStep,
              isAnimating: false,
              isComplete: isComplete,
              hasChangingLine: self.data.hasChangingLine || lineResult.isChanging,
            })

NEW:
            self.setData({
              throwResults: throwResults,
              throws: throws,
              currentThrow: nextStep,
              isAnimating: false,
              isComplete: isComplete,
              hasChangingLine: self.data.hasChangingLine || lineResult.isChanging,
              headerHint: isComplete ? '结果已出，点击查看解读' : '铜钱落定中...',
            })
```

### File 2: `miniprogram/pages/divine/divine.wxml`

**Replace the entire header section (L7-12) with a single headerHint element:**

```xml
OLD:
      <text class="divine-main-hint" wx:if="{{currentThrow === 0 && !isComplete}}">每次掷出三枚铜钱，共六次</text>
      <text class="divine-step" wx:if="{{!isComplete}}">第 {{currentThrow + 1}} / 6 次</text>
      <text class="divine-step" wx:if="{{isComplete}}">六次完成</text>
      <text class="divine-hint" wx:if="{{isAnimating}}">铜钱落定中...</text>
      <text class="divine-hint divine-hint--done" wx:if="{{isComplete}}">结果已出，点击查看解读</text>

NEW:
      <text class="divine-main-hint {{isComplete ? 'divine-main-hint--done' : ''}}">{{headerHint}}</text>
      <text class="divine-step" wx:if="{{!isComplete}}">第 {{currentThrow + 1}} / 6 次</text>
      <text class="divine-step" wx:if="{{isComplete}}">六次完成</text>
```

**Remove the throw-hint line (L50):**
```xml
DELETE: <text class="throw-hint" wx:if="{{!isComplete && currentThrow > 0 && !isQuickMode}}">点击继续</text>
```

### File 3: `miniprogram/pages/divine/divine.scss`

**Add `.divine-main-hint--done` style (after `.divine-main-hint` block, around L50):**
```scss
.divine-main-hint--done {
  color: var(--gold);
  font-weight: bold;
}
```

**Remove `.divine-hint` and `.divine-hint--done` blocks (L36-44):**
```scss
/* DELETE THESE */
.divine-hint {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.divine-hint--done {
  color: var(--gold);
  font-weight: bold;
}
```

**Remove `.throw-hint` block (L232-238):**
```scss
/* DELETE THIS */
.throw-hint {
  font-size: 22rpx;
  color: var(--text-tertiary);
  text-align: center;
  margin-bottom: 16rpx;
  display: block;
}
```

---

## Item 1 — "已完成" fade-in text (MEDIUM)

### File 1: `miniprogram/pages/divine/divine.wxml` L65-67

**Change:**
```xml
OLD:
    <view class="throw-btn-area" wx:if="{{isComplete}}">
      <button class="mode-btn mode-btn--done" disabled="{{true}}">已完成</button>
    </view>

NEW:
    <view class="throw-btn-area" wx:if="{{isComplete}}">
      <text class="done-label">已完成</text>
    </view>
```

### File 2: `miniprogram/pages/divine/divine.scss`

**Add** `.done-label` style and `@keyframes fadeIn` (e.g. after `.mode-btn--done` block):
```scss
.done-label {
  font-size: 30rpx;
  color: var(--gold);
  font-weight: bold;
  text-align: center;
  flex: 1;
  animation: fadeIn 0.6s ease forwards;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**Remove** `.mode-btn--done` block (L223-231) since it's no longer used:
```scss
/* DELETE THIS */
.mode-btn--done {
  flex: 1;
  background: rgba(201, 169, 110, 0.15);
  color: var(--gold);
  border: 2rpx solid var(--border-gold-strong) !important;
  box-shadow: none;
  opacity: 1;
}
```

---

## Summary of all file touches

| File | Items |
|------|-------|
| `divine.wxml` | 4, 3, 1 |
| `divine.ts` | 3 |
| `divine.scss` | 2, 3, 1 |
| `result.wxml` | 5 |
| `index.wxml` | 6, 7 |
| `index.scss` | 6 |
| `quotes.ts` | 7 |
