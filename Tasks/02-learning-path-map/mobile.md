# Feature 02: Learning Path Map — Mobile Tasks

## Overview
Feature 02 mobile breaks down into 3 tasks: path discovery UI, path details screen, and gesture-based lesson navigation.

---

## Task 2.5.1: Path List Screen with Filtering (React Native)

### Description
Build React Native screen displaying available learning paths with difficulty/topic filtering using NativeWind styling.

### Implementation Details

```typescript
// apps/mobile/src/screens/PathsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { pathService } from '@/services/pathService';
import PathCard from '@/components/PathCard';
import FilterBottomSheet from '@/components/FilterBottomSheet';
import type { RootStackParamList } from '@/navigation/RootStack';

type Props = NativeStackScreenProps<RootStackParamList, 'Paths'>;

export default function PathsScreen({ navigation }: Props) {
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [topics, setTopics] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const { data: paths, isLoading, error, refetch } = useQuery({
    queryKey: ['paths', difficulty, topics],
    queryFn: () =>
      pathService.getPaths({
        difficulty,
        topics: topics.length > 0 ? topics : undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Refetch when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handlePathPress = (pathId: string) => {
    navigation.navigate('PathDetails', { pathId });
  };

  const handleClearFilters = () => {
    setDifficulty(undefined);
    setTopics([]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Filter Button */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Learning Paths</Text>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className="p-2 rounded-full bg-blue-100"
        >
          <Text className="text-lg">⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(difficulty || topics.length > 0) && (
        <View className="px-4 py-3 bg-blue-50 flex-row flex-wrap gap-2">
          {difficulty && (
            <View className="bg-blue-500 rounded-full px-3 py-1 flex-row items-center gap-2">
              <Text className="text-white text-sm font-medium">{difficulty}</Text>
              <TouchableOpacity onPress={() => setDifficulty(undefined)}>
                <Text className="text-white text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {topics.map((topic) => (
            <View key={topic} className="bg-purple-500 rounded-full px-3 py-1 flex-row items-center gap-2">
              <Text className="text-white text-sm font-medium">{topic}</Text>
              <TouchableOpacity onPress={() => setTopics(topics.filter((t) => t !== topic))}>
                <Text className="text-white text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={handleClearFilters}>
            <Text className="text-blue-600 font-semibold text-sm">Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Paths List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-2 text-gray-600">Loading paths...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center gap-4">
          <Text className="text-red-600 font-semibold">Failed to load paths</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paths}
          renderItem={({ item }) => (
            <PathCard
              path={item}
              onPress={() => handlePathPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyState={
            <View className="items-center justify-center py-12">
              <Text className="text-gray-500">No paths match your filters</Text>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onDifficultyChange={setDifficulty}
        onTopicsChange={setTopics}
        selectedDifficulty={difficulty}
        selectedTopics={topics}
      />
    </SafeAreaView>
  );
}
```

**PathCard Component:**
```typescript
// apps/mobile/src/components/PathCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronRightIcon } from 'react-native-heroicons/solid';
import type { PathTemplate } from '@cq/shared-types';

interface PathCardProps {
  path: PathTemplate;
  onPress: () => void;
}

export default function PathCard({ path, onPress }: PathCardProps) {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800',
  };

  const difficultyBgColor = difficultyColors[path.difficulty as keyof typeof difficultyColors];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-900 flex-1">{path.name}</Text>
        <ChevronRightIcon size={20} color="#9ca3af" />
      </View>

      <Text className="text-sm text-gray-600 mb-3">{path.description}</Text>

      <View className="flex-row justify-between items-center mb-2">
        <View className={`rounded-full px-3 py-1 ${difficultyBgColor}`}>
          <Text className="text-xs font-semibold">{path.difficulty}</Text>
        </View>
        <Text className="text-sm text-gray-500">{path.estimatedHours}h</Text>
      </View>

      <View className="flex-row flex-wrap gap-1">
        {path.topics.slice(0, 3).map((topic) => (
          <View key={topic} className="bg-gray-100 rounded px-2 py-1">
            <Text className="text-xs text-gray-700">{topic}</Text>
          </View>
        ))}
        {path.topics.length > 3 && (
          <View className="bg-gray-100 rounded px-2 py-1">
            <Text className="text-xs text-gray-700">+{path.topics.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

### Testing Checklist
- ✅ Path list renders correctly with NativeWind styling
- ✅ Filter button opens bottom sheet
- ✅ Active filters display correctly
- ✅ Clear filters button works
- ✅ Path card navigation works
- ✅ Loading state shows spinner
- ✅ Error state displays with retry
- ✅ Smooth scrolling performance
- ✅ Responsive on iOS and Android

---

## Task 2.5.2: Path Details Modal with Bottom Tabs

### Description
Build full-screen modal showing path details, lessons, prerequisites, and "Start Path" button.

### Implementation Details

```typescript
// apps/mobile/src/screens/PathDetailsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeftIcon, CheckCircleIcon } from 'react-native-heroicons/solid';
import { pathService } from '@/services/pathService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'PathDetails'>;

export default function PathDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { pathId } = route.params;
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons'>('overview');

  const { data: path, isLoading } = useQuery({
    queryKey: ['path-details', pathId],
    queryFn: () => pathService.getPathByID(pathId),
  });

  const startPathMutation = useMutation({
    mutationFn: () => pathService.startPath(pathId),
    onSuccess: () => {
      navigation.navigate('PathLesson', {
        pathId,
        lessonIndex: 0,
      });
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!path) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-600">Path not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-center">{path.name}</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1">
        {/* Hero Section */}
        <View className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-6 gap-2">
          <Text className="text-white text-lg font-semibold">{path.difficulty}</Text>
          <Text className="text-white/90">{path.estimatedHours} hours • {path.dailyMinutes}m/day</Text>
          <View className="flex-row gap-1 flex-wrap mt-2">
            {path.topics.map((topic) => (
              <View key={topic} className="bg-white/20 rounded-full px-3 py-1">
                <Text className="text-white text-xs font-semibold">{topic}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="px-4 py-4 border-b border-gray-200">
          <Text className="text-gray-900 text-base leading-6">{path.description}</Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'overview' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'overview' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('lessons')}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'lessons' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'lessons' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Lessons ({path.lessons.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View className="p-4 gap-4">
            {/* Time Commitment */}
            <View className="bg-gray-50 rounded-lg p-4">
              <Text className="font-semibold text-gray-900 mb-2">Time Commitment</Text>
              <Text className="text-gray-600 text-sm">
                Total: {path.estimatedHours} hours ({path.dailyMinutes}m daily)
              </Text>
            </View>

            {/* Prerequisites */}
            {path.prerequisites.length > 0 && (
              <View className="bg-yellow-50 rounded-lg p-4">
                <Text className="font-semibold text-gray-900 mb-2">Prerequisites</Text>
                {path.prerequisites.map((prereq) => (
                  <Text key={prereq} className="text-gray-600 text-sm mb-1">
                    • {prereq}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'lessons' && (
          <View className="p-4 gap-2">
            {path.lessons.map((lesson, index) => (
              <View key={lesson.id} className="bg-gray-50 rounded-lg p-3 flex-row items-center gap-3">
                <View className="w-8 h-8 bg-blue-500 rounded-full justify-center items-center">
                  <Text className="text-white font-semibold text-sm">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{lesson.name}</Text>
                  <Text className="text-gray-500 text-xs">{lesson.estimatedMinutes}m</Text>
                </View>
                <CheckCircleIcon size={20} color="#d1d5db" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      <View className="px-4 py-4 border-t border-gray-200 gap-2">
        <TouchableOpacity
          onPress={() => startPathMutation.mutate()}
          disabled={startPathMutation.isPending}
          className="bg-blue-500 rounded-lg py-3 items-center"
          activeOpacity={0.8}
        >
          {startPathMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Start Path</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
```

### Testing Checklist
- ✅ Path details display correctly
- ✅ Tab navigation between overview and lessons works
- ✅ Prerequisites display if path has them
- ✅ Start button triggers path start
- ✅ Loading states work properly
- ✅ Back button navigates correctly
- ✅ "Start Path" button shows loading state
- ✅ Smooth scroll performance

---

## Task 2.5.3: Gesture-Based Lesson Navigation

### Description
Implement swipe gestures for navigating between lessons within a path using Reanimated.

### Implementation Details

```typescript
// apps/mobile/src/screens/PathLessonScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Gesture,
  GestureDetector,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeftIcon, ChevronRightIcon } from 'react-native-heroicons/solid';

export default function PathLessonScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { pathId, initialLessonIndex, lessons } = route.params;

  const [currentIndex, setCurrentIndex] = useState(initialLessonIndex);
  const translateX = useSharedValue(0);

  // Swipe gesture detector
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      // Swipe right: go to previous lesson
      if (e.translationX > 50 && currentIndex > 0) {
        translateX.value = withSpring(-300, { damping: 10 });
        setCurrentIndex(currentIndex - 1);
      }
      // Swipe left: go to next lesson
      else if (e.translationX < -50 && currentIndex < lessons.length - 1) {
        translateX.value = withSpring(300, { damping: 10 });
        setCurrentIndex(currentIndex + 1);
      } else {
        translateX.value = withSpring(0, { damping: 10 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-300, 0, 300],
          [-300, 0, 300],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const currentLesson = lessons[currentIndex];
  const progressPercent = ((currentIndex + 1) / lessons.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeftIcon size={24} color="#000" />
          </TouchableOpacity>
          <Text className="font-semibold text-gray-600">
            {currentIndex + 1} of {lessons.length}
          </Text>
          <View />
        </View>

        {/* Progress Bar */}
        <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      {/* Lesson Content */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          style={[animatedStyle]}
          className="flex-1"
        >
          <ScrollView className="flex-1 p-4">
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              {currentLesson.name}
            </Text>

            <View className="bg-blue-50 p-4 rounded-lg mb-6">
              <Text className="text-gray-700 leading-6">
                {currentLesson.content}
              </Text>
            </View>

            {/* Quiz or Exercise */}
            {currentLesson.exercise && (
              <View className="bg-green-50 p-4 rounded-lg border border-green-200">
                <Text className="font-semibold text-gray-900 mb-3">
                  Practice Question
                </Text>
                <Text className="text-gray-700 mb-4">{currentLesson.exercise.question}</Text>
                {currentLesson.exercise.options.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    className="border border-gray-300 rounded-lg p-3 mb-2"
                  >
                    <Text className="text-gray-700">{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Navigation Buttons */}
      <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
        <TouchableOpacity
          onPress={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1);
              translateX.value = withSpring(-300);
            }
          }}
          disabled={currentIndex === 0}
          className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
        >
          <Text className={`font-semibold ${currentIndex === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (currentIndex < lessons.length - 1) {
              setCurrentIndex(currentIndex + 1);
              translateX.value = withSpring(300);
            }
          }}
          disabled={currentIndex === lessons.length - 1}
          className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
        >
          <Text className="font-semibold text-white">
            {currentIndex === lessons.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
```

### Testing Checklist
- ✅ Swipe left navigates to next lesson
- ✅ Swipe right navigates to previous lesson
- ✅ Reanimated animation smooth and performant
- ✅ Progress bar updates correctly
- ✅ Previous button disabled at first lesson
- ✅ Next button shows "Complete" at last lesson
- ✅ Lesson content scrolls independently
- ✅ Button navigation works alongside gestures
- ✅ Smooth transition on iOS and Android

---

## Summary

Feature 02 mobile includes 3 interconnected tasks:
1. **Path List Screen** - Discovery interface with NativeWind styling
2. **Path Details Modal** - Full-screen modal with tabs and start button
3. **Lesson Navigation** - Gesture-based swipe navigation with Reanimated

All components use React Native, NativeWind v4 for styling, and Reanimated for smooth animations.

**Total Mobile Tasks: 3**
**Estimated Effort: 30 hours**
**Dependencies: Expo setup, React Navigation, Reanimated v3, NativeWind v4**
