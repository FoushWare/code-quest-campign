# Feature 05: Streak System — Frontend Tasks

**Owner:** Frontend Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 3 frontend tasks  
**Tech Stack:** React 19, Zustand, Reanimated, TailwindCSS  

---

## Task 5.1: Streak Model & Store

### Description
Create TypeScript types and Zustand store for streak tracking with consecutive day logic.

### Implementation

**File:** `packages/shared-types/src/streaks.ts`

```typescript
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  totalDaysActive: number;
}

export interface StreakEvent {
  date: Date;
  questsCompleted: number;
  xpEarned: number;
}
```

**File:** `apps/web/shell/src/store/streak.store.ts`

```typescript
import { create } from 'zustand';
import { StreakData } from '@cq/shared-types';

interface StreakStore extends StreakData {
  updateStreak: (questCompleted: boolean) => void;
  syncFromServer: (data: StreakData) => void;
}

export const useStreakStore = create<StreakStore>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: new Date(),
  totalDaysActive: 0,

  updateStreak: (questCompleted: boolean) => {
    if (!questCompleted) return;

    const now = new Date();
    const state = get();
    const lastActivity = new Date(state.lastActivityDate);
    const daysSinceLastActivity = daysBetween(lastActivity, now);

    if (daysSinceLastActivity === 0) {
      // Same day, no change
      return;
    } else if (daysSinceLastActivity === 1) {
      // Consecutive day, increment streak
      const newStreak = state.currentStreak + 1;
      set({
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
        lastActivityDate: now,
        totalDaysActive: state.totalDaysActive + 1,
      });
    } else {
      // Streak broken, restart
      set({
        currentStreak: 1,
        lastActivityDate: now,
        totalDaysActive: state.totalDaysActive + 1,
      });
    }
  },

  syncFromServer: (data: StreakData) => {
    set(data);
  },
}));

function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
```

### Testing Checklist
- [ ] Store initializes correctly
- [ ] Streak increments on consecutive days
- [ ] Streak resets after gap
- [ ] Longest streak tracked

---

## Task 5.2: Streak Display Widget

### Description
Build animated streak counter widget showing current and longest streaks.

### Implementation

**File:** `apps/web/shell/src/components/StreakDisplay.tsx`

```typescript
import React, { useEffect } from 'react';
import { useStreakStore } from '../store/streak.store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

export function StreakDisplay() {
  const { currentStreak, longestStreak, totalDaysActive } = useStreakStore();
  const streakScale = useSharedValue(1);

  useEffect(() => {
    // Celebrate streak milestone
    if (currentStreak > 0 && currentStreak % 5 === 0) {
      streakScale.value = withSpring(1.2, { damping: 5 });
      streakScale.value = withSpring(1, { damping: 5 });
    }
  }, [currentStreak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  return (
    <Animated.div entering={FadeIn} style={animatedStyle} className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
      <div className="text-center">
        <p className="text-sm opacity-90">Current Streak</p>
        <p className="text-4xl font-bold mb-2">{currentStreak} 🔥</p>
        <p className="text-xs opacity-75">Longest: {longestStreak} | Days Active: {totalDaysActive}</p>
      </div>
    </Animated.div>
  );
}
```

### Testing Checklist
- [ ] Displays current streak correctly
- [ ] Shows longest streak
- [ ] Animation triggers on milestones
- [ ] Responsive design

---

## Task 5.3: Daily Streak Notification & Reset Logic

### Description
Implement streak notification and reset at midnight logic.

### Implementation

**File:** `apps/web/shell/src/hooks/useStreakNotification.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useStreakStore } from '../store/streak.store';

export function useStreakNotification() {
  const streakStore = useStreakStore();
  const notificationShown = useRef(false);

  useEffect(() => {
    // Check for streak milestone at midnight
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0 && !notificationShown.current) {
        notificationShown.current = true;

        // Show notification
        if (streakStore.currentStreak > 0) {
          showStreakNotification(streakStore.currentStreak);
        }

        // Reset flag after a minute
        setTimeout(() => {
          notificationShown.current = false;
        }, 60000);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMidnight);
  }, [streakStore.currentStreak]);
}

function showStreakNotification(streak: number) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🔥 Streak: ${streak} days!`, {
      badge: '🔥',
      tag: 'streak-notification',
    });
  }
}
```

### Testing Checklist
- [ ] Notification triggers at midnight
- [ ] Streak resets on gap days
- [ ] Milestone celebrations work

