# Feature 04: Hearts System — Mobile Tasks

**Owner:** Mobile Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 2-3 mobile tasks  
**Tech Stack:** React Native, Expo, Zustand  

---

## Task 4.13: Mobile Hearts Display & Management

### Description
Build native hearts display widget and integrate hearts damage into mobile quiz flow.

### Implementation

**File:** `apps/mobile/src/components/HeartsWidget.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useHeartsStore } from '../store/hearts.store';

export default function HeartsWidget() {
  const { currentHearts, maxHearts, nextResetAt } = useHeartsStore();
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Animate when hearts change
  const shake = useSharedValue(0);

  useEffect(() => {
    shake.value = withSpring(1, { damping: 8 });
  }, [currentHearts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextResetAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('Ready!');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilReset(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextResetAt]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: shake.value }],
  }));

  return (
    <View className="flex-row items-center gap-2 bg-gray-900 px-3 py-2 rounded-lg">
      <Animated.View style={animatedStyle} className="flex-row gap-1">
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Text
            key={i}
            className={`text-2xl ${i < currentHearts ? 'opacity-100' : 'opacity-30'}`}
          >
            ❤️
          </Text>
        ))}
      </Animated.View>

      <View className="ml-2">
        <Text className="text-white text-sm font-bold">
          {currentHearts}/{maxHearts}
        </Text>
        <Text className="text-gray-400 text-xs">{timeUntilReset}</Text>
      </View>
    </View>
  );
}
```

**File:** `apps/mobile/src/store/hearts.store.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeartsState, HeartsDamageEvent } from '@cq/shared-types';

interface HeartsStore extends HeartsState {
  damageHearts: (amount: number, event: HeartsDamageEvent) => void;
  healHearts: (amount: number) => void;
  syncFromServer: (state: HeartsState) => void;
  loadFromStorage: () => Promise<void>;
  checkAndResetIfNeeded: () => Promise<void>;
}

export const useHeartsStore = create<HeartsStore>((set, get) => ({
  currentHearts: 5,
  maxHearts: 5,
  lastResetAt: new Date(),
  nextResetAt: getNextResetTime(),

  damageHearts: (amount: number, event: HeartsDamageEvent) => {
    set(state => ({
      currentHearts: Math.max(0, state.currentHearts - amount),
    }));

    // Sync with server
    syncDamageWithServer(event);
  },

  healHearts: (amount: number) => {
    set(state => ({
      currentHearts: Math.min(state.maxHearts, state.currentHearts + amount),
    }));
  },

  syncFromServer: (state: HeartsState) => {
    set(state);
    // Persist to AsyncStorage
    AsyncStorage.setItem('hearts-state', JSON.stringify(state));
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('hearts-state');
      if (stored) {
        set(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load hearts from storage:', err);
    }
  },

  checkAndResetIfNeeded: async () => {
    const now = new Date();
    const state = get();

    if (now > state.nextResetAt) {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/hearts/status`,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          get().syncFromServer(data);
        }
      } catch (err) {
        console.error('Failed to check hearts reset:', err);
      }
    }
  },
}));

function getNextResetTime(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

async function syncDamageWithServer(event: HeartsDamageEvent) {
  try {
    await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/hearts/damage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify(event),
      }
    );
  } catch (err) {
    console.error('Failed to sync damage with server:', err);
  }
}

async function getToken(): Promise<string> {
  const token = await AsyncStorage.getItem('accessToken');
  return token || '';
}
```

**File:** `apps/mobile/src/hooks/useQuizWithHearts.ts`

```typescript
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useHeartsStore } from '../store/hearts.store';
import { LessonQuestion } from '@cq/shared-types';

export function useQuizWithHearts(questions: LessonQuestion[]) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const { damageHearts, currentHearts } = useHeartsStore();

  const handleAnswer = useCallback((answer: any) => {
    const question = questions[currentIndex];
    const isCorrect = validateAnswer(answer, question);

    setAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));

    if (!isCorrect) {
      // Damage hearts
      damageHearts(1, {
        questId: 'current-quest',
        questionId: question.id,
        damageTaken: 1,
        timestamp: new Date(),
      });

      // Show hearts lost feedback
      if (currentHearts === 1) {
        Alert.alert(
          'Last Heart!',
          'You have one heart left. Answer carefully!',
          [{ text: 'OK' }]
        );
      }

      if (currentHearts - 1 === 0) {
        Alert.alert(
          'Game Over',
          'You\'ve run out of hearts! Come back tomorrow for more.',
          [
            { text: 'OK', onPress: () => router.push('/(tabs)/home') },
          ]
        );
      }
    }

    // Move to next question after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  }, [currentIndex, questions, damageHearts, currentHearts, router]);

  return {
    currentIndex,
    currentQuestion: questions[currentIndex],
    handleAnswer,
    canContinue: currentHearts > 0,
  };
}

function validateAnswer(answer: any, question: LessonQuestion): boolean {
  // Validation logic
  return true; // Simplified
}
```

### Testing Checklist
- [ ] Hearts display shows correct count
- [ ] Animation triggers on damage
- [ ] Countdown timer updates
- [ ] Offline storage works
- [ ] Game over alert displays
- [ ] Store syncs with server

