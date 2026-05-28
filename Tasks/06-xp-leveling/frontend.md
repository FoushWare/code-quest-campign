# Feature 06: XP & Leveling — Frontend Tasks

**Owner:** Frontend Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 3 frontend tasks  
**Tech Stack:** React 19, Zustand, Reanimated, Charts  

---

## Task 6.1: Level Model & Store

### Description
Create XP and level types with progression calculations.

### Implementation

**File:** `packages/shared-types/src/levels.ts`

```typescript
export interface LevelData {
  level: number;
  totalXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  percentToNextLevel: number;
}

export interface LevelConfig {
  baseXpPerLevel: number;  // 100
  xpMultiplier: number;     // 1.1
  maxLevel: number;         // 100
}

export const LEVEL_CONFIG: LevelConfig = {
  baseXpPerLevel: 100,
  xpMultiplier: 1.1,
  maxLevel: 100,
};

export function calculateLevel(totalXP: number): LevelData {
  let xpRequired = 0;
  let level = 1;

  while (level < LEVEL_CONFIG.maxLevel) {
    const nextLevelXp = Math.floor(
      LEVEL_CONFIG.baseXpPerLevel * Math.pow(LEVEL_CONFIG.xpMultiplier, level - 1)
    );

    if (xpRequired + nextLevelXp > totalXP) break;

    xpRequired += nextLevelXp;
    level++;
  }

  const xpForCurrentLevel = Math.floor(
    LEVEL_CONFIG.baseXpPerLevel * Math.pow(LEVEL_CONFIG.xpMultiplier, level - 1)
  );
  const xpProgress = totalXP - xpRequired;
  const percentToNextLevel = (xpProgress / xpForCurrentLevel) * 100;

  return {
    level,
    totalXP,
    xpForNextLevel: xpForCurrentLevel,
    xpProgress,
    percentToNextLevel: Math.min(100, percentToNextLevel),
  };
}
```

**File:** `apps/web/shell/src/store/xp.store.ts`

```typescript
import { create } from 'zustand';
import { LevelData, calculateLevel } from '@cq/shared-types';

interface XPStore extends LevelData {
  addXP: (amount: number) => void;
  syncFromServer: (totalXP: number) => void;
}

export const useXPStore = create<XPStore>((set, get) => {
  const initialLevel = calculateLevel(0);

  return {
    ...initialLevel,

    addXP: (amount: number) => {
      const state = get();
      const newTotalXP = state.totalXP + amount;
      const newLevel = calculateLevel(newTotalXP);

      set(newLevel);

      // Fire milestone event if leveled up
      if (newLevel.level > state.level) {
        window.dispatchEvent(
          new CustomEvent('level-up', {
            detail: { newLevel: newLevel.level, xpGained: amount },
          })
        );
      }
    },

    syncFromServer: (totalXP: number) => {
      const level = calculateLevel(totalXP);
      set(level);
    },
  };
});
```

---

## Task 6.2: XP Progress Bar & Level Display Widget

### Description
Build animated progress bar showing XP progress to next level.

### Implementation

**File:** `apps/web/shell/src/components/LevelDisplay.tsx`

```typescript
import React, { useEffect } from 'react';
import { useXPStore } from '../store/xp.store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

export function LevelDisplay() {
  const { level, totalXP, xpProgress, xpForNextLevel, percentToNextLevel } = useXPStore();
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(percentToNextLevel, { damping: 8 });
  }, [percentToNextLevel]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.div entering={FadeIn} className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Level {level}</h3>
        <p className="text-sm text-gray-600">
          {xpProgress} / {xpForNextLevel} XP
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <Animated.div
          style={progressStyle}
          className="h-4 bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Total XP: {totalXP.toLocaleString()}
      </p>
    </Animated.div>
  );
}
```

---

## Task 6.3: XP Gain Animation & Notifications

### Description
Show animated XP gain notifications when user earns XP.

### Implementation

**File:** `apps/web/shell/src/components/XPGainNotification.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeOut,
} from 'react-native-reanimated';

export function XPGainNotification() {
  const [notifications, setNotifications] = useState<Array<{ id: string; amount: number }>>([]);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const handleXPGain = (e: CustomEvent) => {
      const id = Math.random().toString();
      setNotifications(prev => [...prev, { id, amount: e.detail.xpAmount }]);

      // Auto-remove after 2 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 2000);
    };

    window.addEventListener('xp-gain', handleXPGain as EventListener);
    return () => window.removeEventListener('xp-gain', handleXPGain as EventListener);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <div className="fixed bottom-8 right-8 space-y-2 pointer-events-none">
      {notifications.map(notif => (
        <Animated.div
          key={notif.id}
          style={animatedStyle}
          className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-lg shadow-lg"
        >
          +{notif.amount} XP
        </Animated.div>
      ))}
    </div>
  );
}
```

### Testing Checklist
- [ ] Level calculated correctly
- [ ] Progress bar updates smoothly
- [ ] XP gain notifications display
- [ ] Level up animation triggers

