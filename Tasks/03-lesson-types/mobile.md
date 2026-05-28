# Feature 03: Lesson Types — Mobile Tasks

**Owner:** Mobile Team  
**Priority:** 🟡 HIGH  
**Estimated Effort:** 2-3 mobile tasks  
**Tech Stack:** React Native, Expo, expo-router, Reanimated, NativeWind  

---

## Task 3.13: Mobile Lesson Renderer Component

### Description
Adapt the lesson renderer for React Native with optimized touch interactions and animations.

### Implementation

**File:** `apps/mobile/src/components/LessonRenderer.tsx`

```typescript
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LessonQuestion } from '@cq/shared-types';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  FadeInDown,
  FadeOutUp
} from 'react-native-reanimated';

interface LessonRendererProps {
  question: LessonQuestion;
  onAnswer: (answer: any) => void;
  onNext: () => void;
  onPrev: () => void;
  questionNumber: number;
  totalQuestions: number;
  showExplanation?: boolean;
}

export default function LessonRenderer({
  question,
  onAnswer,
  onNext,
  onPrev,
  questionNumber,
  totalQuestions,
  showExplanation = false,
}: LessonRendererProps) {
  const [answered, setAnswered] = useState(false);
  const animValue = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    opacity: animValue.value,
    transform: [{ translateY: (1 - animValue.value) * 20 }],
  }));

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return <MultipleChoiceMobile question={question} onAnswer={handleAnswer} />;
      case 'TRUE_FALSE':
        return <TrueFalseMobile question={question} onAnswer={handleAnswer} />;
      case 'FILL_IN_BLANK':
        return <FillInBlankMobile question={question} onAnswer={handleAnswer} />;
      case 'MATCHING':
        return <MatchingMobile question={question} onAnswer={handleAnswer} />;
      case 'ESSAY':
        return <EssayMobile question={question} onAnswer={handleAnswer} />;
      default:
        return <Text className="text-gray-600">Unknown question type</Text>;
    }
  };

  const handleAnswer = (answer: any) => {
    onAnswer(answer);
    setAnswered(true);
    animValue.value = withSpring(1);
  };

  return (
    <View className="flex-1 bg-black">
      {/* Progress bar */}
      <View className="bg-gray-900 px-4 py-3 border-b border-gray-800">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white text-sm">
            Question {questionNumber} of {totalQuestions}
          </Text>
          <Text className="text-gray-400 text-xs">
            {question.difficulty.toUpperCase()} • {question.points} pts
          </Text>
        </View>
        <View className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-blue-500"
            style={{
              width: `${(questionNumber / totalQuestions) * 100}%`,
            }}
          />
        </View>
      </View>

      {/* Question content */}
      <ScrollView className="flex-1 px-4 py-6">
        <Animated.View entering={FadeInDown} style={animStyle}>
          {/* Tag */}
          <View className="mb-4">
            <View className="self-start bg-blue-900 px-3 py-1 rounded-full">
              <Text className="text-blue-200 text-xs font-semibold">
                {question.type}
              </Text>
            </View>
          </View>

          {/* Question text */}
          <Text className="text-white text-2xl font-bold mb-6">
            {question.question}
          </Text>

          {/* Question content */}
          {renderQuestionContent()}

          {/* Explanation */}
          {showExplanation && question.explanation && (
            <View className="mt-6 p-4 bg-blue-900 rounded-lg">
              <Text className="text-blue-200 text-sm">
                <Text className="font-bold">Explanation: </Text>
                {question.explanation}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation buttons */}
      <View className="bg-gray-900 border-t border-gray-800 px-4 py-4 flex-row gap-3">
        <Pressable
          onPress={onPrev}
          disabled={questionNumber === 1}
          className={`flex-1 py-3 rounded-lg border border-gray-700 ${
            questionNumber === 1 ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white text-center font-semibold">← Previous</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!answered || questionNumber === totalQuestions}
          className={`flex-1 py-3 rounded-lg ${
            !answered || questionNumber === totalQuestions
              ? 'bg-gray-700'
              : 'bg-blue-600'
          }`}
        >
          <Text className="text-white text-center font-semibold">
            {questionNumber === totalQuestions ? 'Finish' : 'Next →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Multiple Choice Component (Mobile)
function MultipleChoiceMobile({ question, onAnswer }: any) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (optionId: string) => {
    if (question.singleSelect) {
      setSelected([optionId]);
    } else {
      setSelected(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  return (
    <View className="space-y-3 gap-3">
      {question.options.map((option: any) => (
        <Pressable
          key={option.id}
          onPress={() => toggleOption(option.id)}
          className={`p-4 rounded-lg border-2 ${
            selected.includes(option.id)
              ? 'border-blue-500 bg-blue-900 bg-opacity-30'
              : 'border-gray-700 bg-gray-900'
          }`}
        >
          <View className="flex-row items-center">
            <View
              className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                selected.includes(option.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-600'
              }`}
            >
              {selected.includes(option.id) && (
                <Text className="text-white text-sm">✓</Text>
              )}
            </View>
            <Text className="text-white flex-1">{option.text}</Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        onPress={() => onAnswer(selected)}
        disabled={selected.length === 0}
        className={`mt-4 py-3 rounded-lg ${
          selected.length === 0 ? 'bg-gray-700' : 'bg-green-600'
        }`}
      >
        <Text className="text-white text-center font-semibold">Submit</Text>
      </Pressable>
    </View>
  );
}

// True/False Component (Mobile)
function TrueFalseMobile({ question, onAnswer }: any) {
  const [selected, setSelected] = useState<boolean | null>(null);

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => {
          setSelected(true);
          onAnswer(true);
        }}
        className={`p-6 rounded-lg border-2 ${
          selected === true
            ? 'border-blue-500 bg-blue-900 bg-opacity-30'
            : 'border-gray-700 bg-gray-900'
        }`}
      >
        <Text className="text-white text-xl font-bold text-center">TRUE</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setSelected(false);
          onAnswer(false);
        }}
        className={`p-6 rounded-lg border-2 ${
          selected === false
            ? 'border-blue-500 bg-blue-900 bg-opacity-30'
            : 'border-gray-700 bg-gray-900'
        }`}
      >
        <Text className="text-white text-xl font-bold text-center">FALSE</Text>
      </Pressable>
    </View>
  );
}

// Fill in the Blank Component (Mobile)
function FillInBlankMobile({ question, onAnswer }: any) {
  const [answer, setAnswer] = useState('');

  return (
    <View className="gap-4">
      <Text className="text-gray-300 text-lg">{question.template}</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Type your answer..."
        placeholderTextColor="#666"
        className="bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 text-base"
      />
      <Pressable
        onPress={() => onAnswer(answer)}
        disabled={!answer.trim()}
        className={`py-3 rounded-lg ${
          !answer.trim() ? 'bg-gray-700' : 'bg-green-600'
        }`}
      >
        <Text className="text-white text-center font-semibold">Submit</Text>
      </Pressable>
    </View>
  );
}

// Matching Component (Mobile)
function MatchingMobile({ question, onAnswer }: any) {
  const [matches, setMatches] = useState<Record<string, string>>({});

  const handleMatch = (leftId: string, rightValue: string) => {
    setMatches(prev => ({
      ...prev,
      [leftId]: rightValue,
    }));
  };

  return (
    <View className="gap-4">
      {question.pairs.map((pair: any) => (
        <View key={pair.id} className="gap-2">
          <Text className="text-white font-semibold">{pair.left}</Text>
          <SelectDropdown
            data={question.pairs.map((p: any) => p.right)}
            onSelect={(value) => handleMatch(pair.id, value)}
            buttonStyle="bg-gray-900 border border-gray-700 rounded-lg"
            buttonTextStyle="text-white text-left"
          />
        </View>
      ))}
      <Pressable
        onPress={() => onAnswer(matches)}
        className="mt-4 py-3 rounded-lg bg-green-600"
      >
        <Text className="text-white text-center font-semibold">Submit</Text>
      </Pressable>
    </View>
  );
}

// Essay Component (Mobile)
function EssayMobile({ question, onAnswer }: any) {
  const [essay, setEssay] = useState('');

  const wordCount = essay.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isValid = (!question.minWords || wordCount >= question.minWords) &&
                  (!question.maxWords || wordCount <= question.maxWords);

  return (
    <View className="gap-4">
      <TextInput
        value={essay}
        onChangeText={setEssay}
        placeholder="Write your essay here..."
        placeholderTextColor="#666"
        multiline
        numberOfLines={8}
        className="bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 text-base"
      />

      <Text className={`text-sm ${!isValid ? 'text-red-400' : 'text-gray-400'}`}>
        Words: {wordCount}
        {question.minWords && ` / ${question.minWords} min`}
        {question.maxWords && ` - ${question.maxWords} max`}
      </Text>

      <Pressable
        onPress={() => onAnswer(essay)}
        disabled={!isValid}
        className={`py-3 rounded-lg ${!isValid ? 'bg-gray-700' : 'bg-green-600'}`}
      >
        <Text className="text-white text-center font-semibold">Submit Essay</Text>
      </Pressable>
    </View>
  );
}
```

### Testing Checklist
- [ ] Multiple choice/true-false options respond to touch
- [ ] Selected state animates smoothly
- [ ] Text input works on mobile keyboards
- [ ] Navigation buttons enable/disable correctly
- [ ] Progress bar updates as questions progress
- [ ] Animations run smoothly on low-end devices

---

## Task 3.14: Lesson Submission & Score Calculation

### Description
Handle lesson submission and calculate scores based on answer correctness.

### Implementation

**File:** `apps/mobile/src/hooks/useLessonSubmit.ts`

```typescript
import { useCallback, useState } from 'react';
import { LessonQuestion, MultipleChoiceQuestion, FillInBlankQuestion } from '@cq/shared-types';

interface SubmitResult {
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  feedback: Record<string, 'correct' | 'incorrect'>;
}

export function useLessonSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateScore = useCallback((
    questions: LessonQuestion[],
    answers: Record<string, any>
  ): SubmitResult => {
    let correct = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const feedback: Record<string, 'correct' | 'incorrect'> = {};

    questions.forEach((q, idx) => {
      totalPoints += q.points;
      const userAnswer = answers[idx];

      if (q.type === 'MULTIPLE_CHOICE') {
        const mcQ = q as MultipleChoiceQuestion;
        const correctOptions = mcQ.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt.id);

        const isCorrect = JSON.stringify(userAnswer?.sort()) === 
                         JSON.stringify(correctOptions.sort());

        if (isCorrect) {
          correct++;
          earnedPoints += q.points;
          feedback[idx] = 'correct';
        } else {
          feedback[idx] = 'incorrect';
        }
      } else if (q.type === 'TRUE_FALSE') {
        const isCorrect = userAnswer === (q as any).correctAnswer;
        if (isCorrect) {
          correct++;
          earnedPoints += q.points;
          feedback[idx] = 'correct';
        } else {
          feedback[idx] = 'incorrect';
        }
      } else if (q.type === 'FILL_IN_BLANK') {
        const fQ = q as FillInBlankQuestion;
        const normalizedAnswer = fQ.caseSensitive
          ? userAnswer?.trim()
          : userAnswer?.trim().toLowerCase();

        const correctAnswers = fQ.answers.map(a =>
          fQ.caseSensitive ? a : a.toLowerCase()
        );

        const isCorrect = correctAnswers.includes(normalizedAnswer);
        if (isCorrect) {
          correct++;
          earnedPoints += q.points;
          feedback[idx] = 'correct';
        } else {
          feedback[idx] = 'incorrect';
        }
      }
    });

    return {
      score: Math.round((earnedPoints / totalPoints) * 100),
      maxScore: totalPoints,
      correct,
      total: questions.length,
      feedback,
    };
  }, []);

  const submitLesson = useCallback(async (
    lessonId: string,
    questions: LessonQuestion[],
    answers: Record<string, any>
  ): Promise<SubmitResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = calculateScore(questions, answers);

      // Send to backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/lessons/${lessonId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          score: result.score,
          maxScore: result.maxScore,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit lesson');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calculateScore]);

  return { submitLesson, loading, error, calculateScore };
}
```

### Testing Checklist
- [ ] Score calculation is accurate
- [ ] All question types score correctly
- [ ] Case sensitivity respected for fill-in-blank
- [ ] Submission sends to backend
- [ ] Error handling displays correctly
- [ ] Loading state works during submission

