# Feature 06: XP & Leveling — Database & Mobile Tasks

**Owner:** Database/Mobile Teams  
**Priority:** 🟡 HIGH  

---

## Database Task 6.6: Create `user_levels` Table

### SQL Schema

```sql
CREATE TABLE user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_levels_total_xp ON user_levels(total_xp DESC);
CREATE INDEX idx_user_levels_level ON user_levels(current_level DESC);
```

### Migration File: `infra/migrations/008_create_user_levels_table.up.sql`

```sql
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_levels_total_xp ON user_levels(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(current_level DESC);
```

---

## Infrastructure Task 6.7: XP Service Integration

Include XP service in docker-compose (already in user service).

---

## Mobile Task 6.8: Native Level Display

**File:** `apps/mobile/src/components/LevelCard.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useXPStore } from '../store/xp.store';
import * as Progress from 'react-native-progress';

export default function LevelCard() {
  const { level, xpProgress, xpForNextLevel, percentToNextLevel } = useXPStore();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.05, { damping: 6 });
    scale.value = withSpring(1, { damping: 6 });
  }, [level]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle} className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 m-4">
      <View className="items-center mb-4">
        <Text className="text-white text-sm opacity-75">LEVEL</Text>
        <Text className="text-white text-5xl font-bold">{level}</Text>
      </View>

      <View className="mb-3">
        <Progress.Bar
          progress={percentToNextLevel / 100}
          width={null}
          height={8}
          color="#fbbf24"
          unfilledColor="rgba(255,255,255,0.3)"
          borderColor="transparent"
        />
      </View>

      <Text className="text-white text-center text-xs">
        {xpProgress} / {xpForNextLevel} XP
      </Text>
    </Animated.View>
  );
}
```

**File:** `apps/mobile/src/store/xp.store.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelData, calculateLevel } from '@cq/shared-types';

interface XPStore extends LevelData {
  addXP: (amount: number) => Promise<void>;
  syncFromServer: (totalXP: number) => void;
}

export const useXPStore = create<XPStore>((set) => {
  const initial = calculateLevel(0);
  return {
    ...initial,
    addXP: async (amount: number) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/xp/gain`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await getToken()}`,
            },
            body: JSON.stringify({ amount }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          set(data);
        }
      } catch (err) {
        console.error('Failed to add XP:', err);
      }
    },
    syncFromServer: (totalXP: number) => {
      const level = calculateLevel(totalXP);
      set(level);
    },
  };
});

async function getToken(): Promise<string> {
  return (await AsyncStorage.getItem('accessToken')) || '';
}
```

