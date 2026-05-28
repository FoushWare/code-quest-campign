# Feature 04: Hearts System — Frontend Tasks

**Owner:** Frontend Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 4 frontend tasks  
**Tech Stack:** React 19, Zustand state, Reanimated animations, TailwindCSS  

---

## Task 4.1: Hearts Model & Zustand Store

### Description
Create types and Zustand store for hearts system with daily reset logic.

### Implementation

**File:** `packages/shared-types/src/hearts.ts`

```typescript
export interface HeartsState {
  currentHearts: number;
  maxHearts: number;
  lastResetAt: Date;
  nextResetAt: Date;
}

export interface HeartsDamageEvent {
  questId: string;
  questionId: string;
  damageTaken: number;
  timestamp: Date;
}

export interface HeartsConfig {
  maxHearts: number;
  startingHearts: number;
  damagePerWrongAnswer: number;
  resetTimeUTC: number; // Hour (0-23)
  recoveryPerCorrectAnswer?: number;
}
```

**File:** `apps/web/shell/src/store/hearts.store.ts`

```typescript
import { create } from 'zustand';
import { HeartsState, HeartsDamageEvent } from '@cq/shared-types';

interface HeartsStore extends HeartsState {
  // Actions
  damageHearts: (amount: number, event: HeartsDamageEvent) => void;
  healHearts: (amount: number) => void;
  resetHearts: () => Promise<void>;
  syncHeartsFromServer: (state: HeartsState) => void;
  checkAndResetIfNeeded: () => void;
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

    // Log damage event for analytics
    logHeartsDamage(event);

    // If hearts reach 0, trigger game over modal
    if (get().currentHearts === 0) {
      triggerGameOver();
    }
  },

  healHearts: (amount: number) => {
    set(state => ({
      currentHearts: Math.min(state.maxHearts, state.currentHearts + amount),
    }));
  },

  resetHearts: async () => {
    try {
      const response = await fetch('/api/hearts/reset', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Reset failed');

      set({
        currentHearts: 5,
        lastResetAt: new Date(),
        nextResetAt: getNextResetTime(),
      });
    } catch (err) {
      console.error('Failed to reset hearts:', err);
    }
  },

  syncHeartsFromServer: (state: HeartsState) => {
    set(state);
  },

  checkAndResetIfNeeded: () => {
    const now = new Date();
    const state = get();

    if (now > state.nextResetAt) {
      get().resetHearts();
    }
  },
}));

function getNextResetTime(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0); // Reset at 6 AM UTC

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function logHeartsDamage(event: HeartsDamageEvent) {
  // Send to analytics
  console.log('Hearts damaged:', event);
}

function triggerGameOver() {
  // Dispatch event or call callback
  window.dispatchEvent(new CustomEvent('hearts-depleted'));
}
```

### Testing Checklist
- [ ] Store initializes with correct values
- [ ] damageHearts decreases hearts
- [ ] healHearts increases hearts (capped at max)
- [ ] resetHearts calls backend and updates state
- [ ] Daily reset time calculated correctly

---

## Task 4.2: Hearts Display Widget

### Description
Build animated hearts display widget that appears in UI header or quiz interface.

### Implementation

**File:** `apps/web/shell/src/components/ui/HeartsDisplay.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useHeartsStore } from '../../store/hearts.store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function HeartsDisplay() {
  const { currentHearts, maxHearts, nextResetAt } = useHeartsStore();
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Animate hearts when they change
  const heartScale = useSharedValue(1);
  const heartColor = useSharedValue(0);

  useEffect(() => {
    // Trigger pulse animation when hearts change
    heartScale.value = withSpring(1.2, { damping: 6 });
    heartScale.value = withSpring(1, { damping: 6 });
  }, [currentHearts]);

  useEffect(() => {
    // Update countdown timer
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextResetAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('Resetting...');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilReset(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextResetAt]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <div className="flex items-center gap-2">
      <Animated.div style={animatedStyle} className="flex gap-1">
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart key={i} isFilled={i < currentHearts} />
        ))}
      </Animated.div>

      <div className="text-sm text-gray-600">
        <p className="font-semibold">{currentHearts}/{maxHearts}</p>
        <p className="text-xs text-gray-500">{timeUntilReset}</p>
      </div>
    </div>
  );
}

function Heart({ isFilled }: { isFilled: boolean }) {
  return (
    <div className={`text-xl transition-colors ${
      isFilled ? 'text-red-500' : 'text-gray-300'
    }`}>
      ❤️
    </div>
  );
}
```

### Testing Checklist
- [ ] Hearts display correct count
- [ ] Animation triggers on damage
- [ ] Countdown timer updates correctly
- [ ] Display responsive on mobile

---

## Task 4.3: Wrong Answer Hearts Damage

### Description
Integrate hearts damage into quiz logic when user answers incorrectly.

### Implementation

**File:** `apps/web/shell/src/hooks/useQuizWithHearts.ts`

```typescript
import { useCallback, useState } from 'react';
import { LessonQuestion } from '@cq/shared-types';
import { useHeartsStore } from '../store/hearts.store';

export function useQuizWithHearts(questions: LessonQuestion[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({});

  const { damageHearts, currentHearts } = useHeartsStore();

  const isCorrect = useCallback((answer: any, question: LessonQuestion) => {
    // Validation logic (same as before)
    return validateAnswer(answer, question);
  }, []);

  const handleAnswer = useCallback((answer: any) => {
    const question = questions[currentIndex];
    const correct = isCorrect(answer, question);

    // Store answer
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));

    setFeedback(prev => ({
      ...prev,
      [currentIndex]: correct ? 'correct' : 'incorrect',
    }));

    // Damage hearts if wrong
    if (!correct) {
      damageHearts(1, {
        questId: 'current-quest',
        questionId: question.id,
        damageTaken: 1,
        timestamp: new Date(),
      });

      // Show damage indicator
      showHeartsLostAnimation();
    }

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  }, [currentIndex, questions, isCorrect, damageHearts]);

  const handleGameOver = useCallback(() => {
    // Handle game over state
    setCurrentIndex(0);
    setAnswers({});
    setFeedback({});
  }, []);

  return {
    currentIndex,
    currentQuestion: questions[currentIndex],
    answers,
    feedback,
    handleAnswer,
    currentHearts,
    isGameOver: currentHearts === 0,
  };
}

function showHeartsLostAnimation() {
  // Trigger visual feedback
  const event = new CustomEvent('hearts-damage', { detail: { damage: 1 } });
  window.dispatchEvent(event);
}

function validateAnswer(answer: any, question: LessonQuestion): boolean {
  // Same validation as lesson renderer
  return true; // Simplified
}
```

### Testing Checklist
- [ ] Wrong answer triggers hearts damage
- [ ] Correct answer doesn't damage hearts
- [ ] Game over triggered when hearts reach 0
- [ ] Answer feedback displays correctly

---

## Task 4.4: Hearts Recovery & Shop

### Description
Build hearts recovery UI and integrate with gem shop.

### Implementation

**File:** `apps/web/shell/src/components/HeartsRecoveryModal.tsx`

```typescript
import React, { useState } from 'react';
import { useHeartsStore } from '../store/hearts.store';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface HeartsRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeartsRecoveryModal({ isOpen, onClose }: HeartsRecoveryModalProps) {
  const { currentHearts, maxHearts, nextResetAt } = useHeartsStore();
  const [selectedOption, setSelectedOption] = useState<'wait' | 'gems'>('wait');

  const heartsMissing = maxHearts - currentHearts;
  const gemsRequired = heartsMissing * 10; // 10 gems per heart

  const handleRecover = async () => {
    if (selectedOption === 'gems') {
      try {
        const response = await fetch('/api/hearts/recover-with-gems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gemsSpent: gemsRequired }),
        });

        if (!response.ok) throw new Error('Recovery failed');

        useHeartsStore.getState().healHearts(heartsMissing);
        onClose();
      } catch (err) {
        console.error('Failed to recover hearts:', err);
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Animated.div entering={FadeIn} exiting={FadeOut} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Out of Hearts!</h2>

        <div className="mb-6 text-center">
          <p className="text-gray-600 mb-2">You've used all your hearts for now.</p>
          <p className="text-lg font-semibold">
            Next reset in {formatTimeRemaining(nextResetAt)}
          </p>
        </div>

        {/* Recovery options */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500"
                 onClick={() => setSelectedOption('wait')}>
            <input type="radio" checked={selectedOption === 'wait'} readOnly className="mr-3" />
            <div>
              <p className="font-semibold">Wait for Reset</p>
              <p className="text-sm text-gray-600">Get {maxHearts} hearts tomorrow</p>
            </div>
          </label>

          <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500"
                 onClick={() => setSelectedOption('gems')}>
            <input type="radio" checked={selectedOption === 'gems'} readOnly className="mr-3" />
            <div>
              <p className="font-semibold">Recover with Gems</p>
              <p className="text-sm text-gray-600">Costs {gemsRequired} 💎 for {heartsMissing} ❤️</p>
            </div>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
          <button
            onClick={handleRecover}
            disabled={selectedOption === 'gems' && gemsRequired > (window as any).__userGems}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {selectedOption === 'wait' ? 'OK' : `Spend ${gemsRequired} Gems`}
          </button>
        </div>
      </div>
    </Animated.div>
  );
}

function formatTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h`;
}
```

### Testing Checklist
- [ ] Modal displays when hearts depleted
- [ ] Gems cost calculated correctly
- [ ] Recovery with gems updates hearts store
- [ ] Wait option closes modal without recovery

