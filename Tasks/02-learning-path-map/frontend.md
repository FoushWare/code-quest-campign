# Feature 02: Learning Path Map — Frontend Tasks

## Overview
Feature 02 breaks down into 4 frontend tasks covering learning path visualization, user progress tracking, and path selection UI.

---

## Task 2.1.1: Path Selection UI Component

### Description
Build the `/paths` page displaying available learning paths as cards with difficulty levels, estimated duration, topic tags, and preview buttons.

### Dependencies
- Feature 01 (User auth) must be complete to ensure user session exists
- Packages/shared-ui (component library)
- Packages/shared-types (PathTemplate interface)

### Requirements
- Display path cards in responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- Show: path name, difficulty (Beginner/Intermediate/Advanced), duration (hours), topic tags, preview button
- Implement filtering by difficulty and topic tags using Zustand store
- Add "Start Path" CTA button leading to onboarding-style flow
- Support search by path name with debounced API call
- Loading skeleton UI while fetching paths
- Error state with retry button

### Implementation Details

**Zod Schema:**
```typescript
// packages/shared-validation/src/path.ts
import { z } from 'zod';

export const PathFilterSchema = z.object({
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  topics: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
});

export type PathFilter = z.infer<typeof PathFilterSchema>;
```

**React Component (Next.js):**
```typescript
// apps/web/shell/app/paths/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/store/filterStore';
import { pathService } from '@/services/pathService';
import PathCard from '@/components/paths/PathCard';
import PathFilterSidebar from '@/components/paths/PathFilterSidebar';
import PathSkeleton from '@/components/paths/PathSkeleton';

export default function PathsPage() {
  const filters = useFilterStore();
  const { data: paths, isLoading, error, refetch } = useQuery({
    queryKey: ['paths', filters],
    queryFn: () => pathService.getPathsByFilters(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">Failed to load paths</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6">
      <PathFilterSidebar />
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-8">Learning Paths</h1>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PathSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths?.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Zustand Filter Store:**
```typescript
// apps/web/shell/store/filterStore.ts
import { create } from 'zustand';
import { PathFilter } from '@cq/shared-validation';

interface FilterStore {
  filters: PathFilter;
  setDifficulty: (difficulty: string | undefined) => void;
  setTopics: (topics: string[]) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: {},
  setDifficulty: (difficulty) =>
    set((state) => ({
      filters: { ...state.filters, difficulty },
    })),
  setTopics: (topics) =>
    set((state) => ({
      filters: { ...state.filters, topics: topics.length > 0 ? topics : undefined },
    })),
  setSearchQuery: (searchQuery) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: searchQuery || undefined },
    })),
  reset: () => set({ filters: {} }),
}));
```

### Testing Checklist
- ✅ Path cards render with correct difficulty colors
- ✅ Filter by difficulty updates UI immediately
- ✅ Filter by topic shows only matching paths
- ✅ Search debouncing prevents excessive API calls
- ✅ Loading skeleton displays while fetching
- ✅ Error state shows retry button
- ✅ Grid layout responsive on mobile/tablet/desktop
- ✅ Accessibility: ARIA labels on buttons and cards

### Acceptance Criteria
1. Display 3+ path cards with name, difficulty, duration, tags
2. Filtering by difficulty and topics updates results in <500ms
3. Search query is debounced (300ms delay before API call)
4. Loading and error states display properly
5. Mobile layout renders in single column

---

## Task 2.1.2: Path Details Modal/Drawer

### Description
Build a modal/drawer showing detailed path information: lessons, difficulty progression, estimated time, prerequisites, and "Start Path" button.

### Requirements
- Modal triggered by clicking path card preview button
- Display: path name, full description, lesson list with estimated durations
- Show difficulty progression (e.g., "Easy → Medium → Hard")
- Display prerequisites (dependent paths)
- Show estimated total time and daily time commitment
- "Start Path" button with loading state
- Close button (X icon) with keyboard support (Esc key)

### Implementation Details

**React Component:**
```typescript
// apps/web/shell/components/paths/PathDetailsModal.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pathService } from '@/services/pathService';
import type { PathTemplate } from '@cq/shared-types';

interface PathDetailsModalProps {
  path: PathTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export default function PathDetailsModal({ path, isOpen, onClose }: PathDetailsModalProps) {
  const [isStarting, setIsStarting] = useState(false);

  const startPathMutation = useMutation({
    mutationFn: () => pathService.startPath(path.id),
    onSuccess: () => {
      // Redirect to first lesson
      window.location.href = `/paths/${path.id}/lessons/1`;
    },
    onError: (error) => {
      console.error('Failed to start path:', error);
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{path.name}</h2>
            <p className="text-gray-600 text-sm">Difficulty: {path.difficulty}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{path.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Lessons ({path.lessons.length})</h3>
            <div className="space-y-3">
              {path.lessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{lesson.name}</p>
                    <p className="text-sm text-gray-500">{lesson.estimatedMinutes} minutes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Time Commitment</h3>
            <p>Total: {path.estimatedHours} hours</p>
            <p className="text-sm text-gray-600">Recommended: {path.dailyMinutes} minutes/day</p>
          </div>

          {path.prerequisites.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Prerequisites</h3>
              <p className="text-sm text-gray-700">{path.prerequisites.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => startPathMutation.mutate()}
            disabled={startPathMutation.isPending}
            className="flex-1 btn btn-primary"
          >
            {startPathMutation.isPending ? 'Starting...' : 'Start Path'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Testing Checklist
- ✅ Modal opens when preview button clicked
- ✅ Modal closes with X button and Esc key
- ✅ Lessons display in correct order with estimated times
- ✅ Prerequisites display if path has them
- ✅ "Start Path" button triggers API call
- ✅ Loading state shows while starting path
- ✅ Accessibility: dialog role, proper focus management
- ✅ Modal doesn't close when clicking inside content

---

## Task 2.1.3: Progress Tracking Visualization

### Description
Display progress bar, completed/remaining lesson count, and estimated time to completion on path cards and detail views.

### Requirements
- Show progress as percentage bar (0-100%)
- Display "X of Y lessons completed"
- Show "X hours remaining" estimate
- Update progress in real-time as lessons complete
- Animate progress bar change with Reanimated
- Display completion badge (🏆) when path is 100% complete
- Show active lesson indicator

### Implementation Details

**Progress Component:**
```typescript
// apps/web/shell/components/paths/ProgressTracker.tsx
'use client';

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { PathProgress } from '@cq/shared-types';

interface ProgressTrackerProps {
  progress: PathProgress;
}

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    const percentage = (progress.completedLessons / progress.totalLessons) * 100;
    progressValue.value = withSpring(percentage, {
      damping: 10,
      mass: 1,
      overshootClamping: false,
    });
  }, [progress.completedLessons, progress.totalLessons]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const isComplete = progress.completedLessons === progress.totalLessons;
  const remainingHours = progress.estimatedHoursRemaining;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          {progress.completedLessons} of {progress.totalLessons} lessons
        </span>
        {isComplete && <span className="text-2xl">🏆</span>}
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <Animated.div
          style={[animatedStyle]}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-none"
        />
      </div>
      <p className="text-xs text-gray-600">
        {remainingHours > 0
          ? `${remainingHours} hours remaining`
          : isComplete ? 'Path completed!' : 'In progress'}
      </p>
    </div>
  );
}
```

### Testing Checklist
- ✅ Progress bar animates smoothly with Reanimated
- ✅ Percentage updates when lesson completed
- ✅ Completion badge displays at 100%
- ✅ Remaining hours calculated correctly
- ✅ Progress bar doesn't exceed 100%
- ✅ Animation performs smoothly on mobile

---

## Task 2.1.4: Path Sidebar Navigation (Web)

### Description
Build sidebar showing current path structure, user progress on each lesson, and quick navigation buttons.

### Requirements
- Collapsible sidebar showing all lessons in current path
- Highlight active lesson
- Show completion checkmarks on finished lessons
- Quick navigation between lessons
- Estimated time per lesson
- Close/expand button on mobile
- Sticky positioning during scrolling

### Implementation Details

```typescript
// apps/web/shell/components/paths/PathSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Lesson } from '@cq/shared-types';

interface PathSidebarProps {
  pathId: string;
  lessons: Lesson[];
  currentLessonId: string;
  completedLessonIds: string[];
}

export default function PathSidebar({
  pathId,
  lessons,
  currentLessonId,
  completedLessonIds,
}: PathSidebarProps) {
  return (
    <aside className="w-64 bg-gray-50 border-r sticky top-0 h-screen overflow-y-auto">
      <div className="p-4 space-y-4">
        <h3 className="font-bold text-lg">Path Lessons</h3>
        <div className="space-y-2">
          {lessons.map((lesson, idx) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            const isActive = currentLessonId === lesson.id;

            return (
              <Link
                key={lesson.id}
                href={`/paths/${pathId}/lessons/${lesson.id}`}
                className={`block p-3 rounded transition ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted && <span>✓</span>}
                  <span className="text-sm font-medium">{idx + 1}. {lesson.name}</span>
                </div>
                <p className="text-xs text-gray-500 ml-6">{lesson.estimatedMinutes}m</p>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
```

### Testing Checklist
- ✅ Sidebar renders all lessons in order
- ✅ Active lesson highlighted correctly
- ✅ Completed lessons show checkmark
- ✅ Quick navigation links work
- ✅ Sidebar sticky on scroll
- ✅ Mobile collapse/expand works
- ✅ Responsive on small screens

---

## Task 2.1.5: Mobile Navigation (React Native)

### Description
Build React Native screen for path navigation on mobile: bottom tab bar with lesson list, swipe between lessons.

### Requirements
- Bottom tab navigation showing current lesson + total
- Swipe gestures to move between lessons
- Gesture handler for left/right swipes
- Reanimated animated transitions between screens
- Back to paths button
- Progress indicator in header

### Implementation Details

```typescript
// apps/mobile/src/screens/PathLessonScreen.tsx
import React, { useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Gesture,
  GestureDetector,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PathNavigatorParams } from '@/types/navigation';

type Props = NativeStackScreenProps<PathNavigatorParams, 'Lesson'>;

export default function PathLessonScreen({ navigation, route }: Props) {
  const { pathId, lessonIndex } = route.params;
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(lessonIndex);

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > 50 && currentIndex.value > 0) {
        currentIndex.value -= 1;
        translateX.value = withSpring(-300);
      } else if (e.translationX < -50 && currentIndex.value < 9) {
        currentIndex.value += 1;
        translateX.value = withSpring(300);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[animatedStyle]} className="flex-1">
          <ScrollView className="flex-1 p-4">
            {/* Lesson content */}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}
```

### Testing Checklist
- ✅ Swipe left/right navigates between lessons
- ✅ Reanimated animation smooth and performant
- ✅ Bottom tab shows current lesson number
- ✅ Progress indicator updates
- ✅ Gestures don't trigger on scrollable content conflicts
- ✅ Accessible on all iOS/Android devices

---

## Summary

Feature 02 frontend includes 5 interconnected tasks:
1. **Path Selection UI** - Main discovery interface with filtering
2. **Path Details Modal** - Rich preview with lessons and prerequisites
3. **Progress Tracking** - Visual feedback with animations
4. **Web Sidebar** - Persistent navigation sidebar for web
5. **Mobile Navigation** - Gesture-based lesson navigation for React Native

All tasks use shared types from `@cq/shared-types`, validation from `@cq/shared-validation`, and state management (Zustand for web, React Native state for mobile).

**Total Frontend Tasks: 5**
**Estimated Effort: 40 hours**
**Dependencies: Feature 01 (User auth required)**
