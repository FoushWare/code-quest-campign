# Feature 05: Streak System — Mobile Tasks

**Owner:** Mobile Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 2 mobile tasks  
**Tech Stack:** React Native, Expo, Zustand  

---

## Task 5.8: Mobile Streak Display & Updates

### Description
Build native streak widget and integrate with quest completion logic.

### Implementation

**File:** `apps/mobile/src/components/StreakWidget.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { useStreakStore } from '../store/streak.store';

export default function StreakWidget() {
  const { currentStreak, longestStreak } = useStreakStore();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (currentStreak % 5 === 0 && currentStreak > 0) {
      scale.value = withSpring(1.15, { damping: 6 });
      scale.value = withSpring(1, { damping: 6 });
    }
  }, [currentStreak]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn} style={animStyle} className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6">
      <View className="items-center">
        <Text className="text-white text-5xl font-bold">{currentStreak}</Text>
        <Text className="text-orange-100 text-lg font-semibold">🔥 Day Streak</Text>
        <Text className="text-orange-200 text-xs mt-2">Best: {longestStreak} days</Text>
      </View>
    </Animated.View>
  );
}
```

**File:** `apps/mobile/src/store/streak.store.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakData } from '@cq/shared-types';

interface StreakStore extends StreakData {
  updateStreak: (questCompleted: boolean) => Promise<void>;
  syncFromServer: (data: StreakData) => void;
}

export const useStreakStore = create<StreakStore>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: new Date(),
  totalDaysActive: 0,

  updateStreak: async (questCompleted: boolean) => {
    if (!questCompleted) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/streaks/update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getToken()}`,
          },
          body: JSON.stringify({ questCompleted: true }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        get().syncFromServer(data);
      }
    } catch (err) {
      console.error('Failed to update streak:', err);
    }
  },

  syncFromServer: (data: StreakData) => {
    set(data);
    AsyncStorage.setItem('streak-state', JSON.stringify(data));
  },
}));

async function getToken(): Promise<string> {
  const token = await AsyncStorage.getItem('accessToken');
  return token || '';
}
```

### Testing Checklist
- [ ] Streak displays correctly
- [ ] Animation triggers on milestones
- [ ] Server sync works
- [ ] Offline state persists

