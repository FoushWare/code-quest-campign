# Feature 03: Lesson Types — Frontend Tasks

**Owner:** Frontend Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 4 frontend tasks  
**Tech Stack:** React 19, Next.js 15, Zod validation, Reanimated, Zustand, TailwindCSS  

---

## Task 3.1: Create Lesson Type Model & Zod Schema

### Description
Define TypeScript types and Zod validation schemas for different lesson types (multiple choice, true/false, fill-in-blank, matching, essay).

### Types & Validation

**File:** `packages/shared-types/src/lessons.ts`

```typescript
// Lesson types enum
export type LessonTypeEnum = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'MATCHING' | 'ESSAY';

export interface BaseLessonQuestion {
  id: string;
  lessonId: string;
  type: LessonTypeEnum;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // seconds
  explanation?: string;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Multiple Choice Question
export interface MultipleChoiceQuestion extends BaseLessonQuestion {
  type: 'MULTIPLE_CHOICE';
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  singleSelect: boolean; // Multiple answers if false
}

// True/False Question
export interface TrueFalseQuestion extends BaseLessonQuestion {
  type: 'TRUE_FALSE';
  correctAnswer: boolean;
}

// Fill in the Blank
export interface FillInBlankQuestion extends BaseLessonQuestion {
  type: 'FILL_IN_BLANK';
  template: string; // "The capital of France is ___"
  answers: string[]; // ["Paris", "paris", "PARIS"]
  caseSensitive: boolean;
}

// Matching Question
export interface MatchingQuestion extends BaseLessonQuestion {
  type: 'MATCHING';
  pairs: {
    id: string;
    left: string;
    right: string;
  }[];
}

// Essay Question
export interface EssayQuestion extends BaseLessonQuestion {
  type: 'ESSAY';
  rubric?: string;
  minWords?: number;
  maxWords?: number;
}

export type LessonQuestion = 
  | MultipleChoiceQuestion 
  | TrueFalseQuestion 
  | FillInBlankQuestion 
  | MatchingQuestion 
  | EssayQuestion;

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: LessonTypeEnum; // Primary type for this lesson
  questions: LessonQuestion[];
  status: 'draft' | 'published';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**File:** `packages/shared-validation/src/lessons.ts`

```typescript
import { z } from 'zod';

const baseLessonQuestionSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  question: z.string().min(5, 'Question must be at least 5 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number().int().min(1).max(100),
  timeLimit: z.number().int().optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const multipleChoiceSchema = baseLessonQuestionSchema.extend({
  type: z.literal('MULTIPLE_CHOICE'),
  options: z.array(z.object({
    id: z.string().uuid(),
    text: z.string().min(1),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
  })).min(2, 'Must have at least 2 options'),
  singleSelect: z.boolean(),
});

export const trueFalseSchema = baseLessonQuestionSchema.extend({
  type: z.literal('TRUE_FALSE'),
  correctAnswer: z.boolean(),
});

export const fillInBlankSchema = baseLessonQuestionSchema.extend({
  type: z.literal('FILL_IN_BLANK'),
  template: z.string().min(5),
  answers: z.array(z.string()).min(1),
  caseSensitive: z.boolean(),
});

export const matchingSchema = baseLessonQuestionSchema.extend({
  type: z.literal('MATCHING'),
  pairs: z.array(z.object({
    id: z.string().uuid(),
    left: z.string().min(1),
    right: z.string().min(1),
  })).min(2),
});

export const essaySchema = baseLessonQuestionSchema.extend({
  type: z.literal('ESSAY'),
  rubric: z.string().optional(),
  minWords: z.number().int().min(10).optional(),
  maxWords: z.number().int().max(5000).optional(),
});

export const lessonQuestionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  trueFalseSchema,
  fillInBlankSchema,
  matchingSchema,
  essaySchema,
]);

export const lessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'MATCHING', 'ESSAY']),
  questions: z.array(lessonQuestionSchema),
  status: z.enum(['draft', 'published']),
});
```

### Testing Checklist
- [ ] Zod schemas validate correct question types
- [ ] Zod rejects invalid options/answers
- [ ] Type discriminated unions work correctly
- [ ] TypeScript types resolve without errors

---

## Task 3.2: Lesson Renderer Component

### Description
Build a flexible LessonRenderer component that renders different question types dynamically based on the `type` field.

### Component Structure

**File:** `apps/web/shell/src/components/lessons/LessonRenderer.tsx`

```typescript
import React, { useState } from 'react';
import { LessonQuestion } from '@cq/shared-types';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import FillInBlankQuestion from './questions/FillInBlankQuestion';
import MatchingQuestion from './questions/MatchingQuestion';
import EssayQuestion from './questions/EssayQuestion';

interface LessonRendererProps {
  question: LessonQuestion;
  onAnswer: (answer: any) => void;
  showExplanation?: boolean;
}

export const LessonRenderer: React.FC<LessonRendererProps> = ({
  question,
  onAnswer,
  showExplanation = false,
}) => {
  const renderQuestion = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            question={question}
            onAnswer={onAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'TRUE_FALSE':
        return (
          <TrueFalseQuestion
            question={question}
            onAnswer={onAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'FILL_IN_BLANK':
        return (
          <FillInBlankQuestion
            question={question}
            onAnswer={onAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'MATCHING':
        return (
          <MatchingQuestion
            question={question}
            onAnswer={onAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'ESSAY':
        return (
          <EssayQuestion
            question={question}
            onAnswer={onAnswer}
            showExplanation={showExplanation}
          />
        );
      default:
        return <div>Unknown question type</div>;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mb-2">
            {question.type}
          </span>
          <h2 className="text-2xl font-bold text-gray-800">{question.question}</h2>
          <p className="text-gray-600 text-sm mt-2">
            Difficulty: {question.difficulty} | Points: {question.points}
            {question.timeLimit && ` | Time: ${question.timeLimit}s`}
          </p>
        </div>

        {renderQuestion()}

        {showExplanation && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-gray-700"><strong>Explanation:</strong> {question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonRenderer;
```

**File:** `apps/web/shell/src/components/lessons/questions/MultipleChoiceQuestion.tsx`

```typescript
import React, { useState } from 'react';
import { MultipleChoiceQuestion } from '@cq/shared-types';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated';

interface Props {
  question: MultipleChoiceQuestion;
  onAnswer: (answer: string[]) => void;
  showExplanation?: boolean;
}

export default function MultipleChoiceQuestionComponent({ 
  question, 
  onAnswer, 
  showExplanation = false 
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleToggleOption = (optionId: string) => {
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

  const handleSubmit = () => {
    setSubmitted(true);
    onAnswer(selected);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrect = option.isCorrect;
          const showFeedback = submitted;

          return (
            <button
              key={option.id}
              onClick={() => !submitted && handleToggleOption(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              } ${
                showFeedback && isCorrect ? 'border-green-500 bg-green-50' : ''
              } ${
                showFeedback && isSelected && !isCorrect ? 'border-red-500 bg-red-50' : ''
              }`}
              disabled={submitted}
            >
              <div className="flex items-start">
                <div className={`w-5 h-5 rounded border-2 mr-3 mt-1 flex items-center justify-center ${
                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}>
                  {isSelected && <span className="text-white text-sm">✓</span>}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{option.text}</p>
                  {showFeedback && isCorrect && (
                    <p className="text-green-700 text-sm mt-1">✓ Correct</p>
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <p className="text-red-700 text-sm mt-1">✗ Incorrect</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}
```

### Testing Checklist
- [ ] Multiple choice rendering displays all options
- [ ] Selection state updates correctly
- [ ] Feedback shows correct/incorrect after submission
- [ ] Single/multi-select modes work separately
- [ ] Explanation displays when enabled

---

## Task 3.3: True/False, Fill-in-Blank & Matching Renderers

### Description
Implement specialized renderers for True/False, Fill-in-Blank, and Matching question types.

### Implementation

**File:** `apps/web/shell/src/components/lessons/questions/TrueFalseQuestion.tsx`

```typescript
import React, { useState } from 'react';
import { TrueFalseQuestion } from '@cq/shared-types';

interface Props {
  question: TrueFalseQuestion;
  onAnswer: (answer: boolean) => void;
  showExplanation?: boolean;
}

export default function TrueFalseQuestionComponent({ 
  question, 
  onAnswer, 
  showExplanation = false 
}: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected !== null) {
      setSubmitted(true);
      onAnswer(selected);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((value) => {
          const isSelected = selected === value;
          const isCorrect = value === question.correctAnswer;
          const showFeedback = submitted;

          return (
            <button
              key={String(value)}
              onClick={() => !submitted && setSelected(value)}
              className={`p-6 rounded-lg border-2 font-bold text-lg transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              } ${
                showFeedback && isCorrect ? 'border-green-500 bg-green-50 text-green-700' : ''
              } ${
                showFeedback && isSelected && !isCorrect ? 'border-red-500 bg-red-50 text-red-700' : ''
              }`}
              disabled={submitted}
            >
              {value ? 'TRUE' : 'FALSE'}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
        >
          Submit Answer
        </button>
      )}

      {submitted && (
        <div className={`p-4 rounded-lg ${
          selected === question.correctAnswer
            ? 'bg-green-100 border border-green-500'
            : 'bg-red-100 border border-red-500'
        }`}>
          <p className={selected === question.correctAnswer ? 'text-green-800' : 'text-red-800'}>
            {selected === question.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
          </p>
        </div>
      )}
    </div>
  );
}
```

**File:** `apps/web/shell/src/components/lessons/questions/FillInBlankQuestion.tsx`

```typescript
import React, { useState } from 'react';
import { FillInBlankQuestion } from '@cq/shared-types';

interface Props {
  question: FillInBlankQuestion;
  onAnswer: (answer: string) => void;
  showExplanation?: boolean;
}

export default function FillInBlankQuestionComponent({ 
  question, 
  onAnswer, 
  showExplanation = false 
}: Props) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const answer = question.caseSensitive 
      ? userAnswer.trim() 
      : userAnswer.trim().toLowerCase();
    
    const correct = question.answers.some(a =>
      (question.caseSensitive ? a : a.toLowerCase()) === answer
    );

    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(userAnswer.trim());
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-800 text-lg mb-4">
          {question.template}
        </p>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Enter your answer..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
        >
          Submit Answer
        </button>
      )}

      {submitted && (
        <div className={`p-4 rounded-lg ${
          isCorrect
            ? 'bg-green-100 border border-green-500 text-green-800'
            : 'bg-red-100 border border-red-500 text-red-800'
        }`}>
          <p>{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
          {!isCorrect && (
            <p className="text-sm mt-2">Correct answer(s): {question.answers.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

**File:** `apps/web/shell/src/components/lessons/questions/MatchingQuestion.tsx`

```typescript
import React, { useState, useMemo } from 'react';
import { MatchingQuestion } from '@cq/shared-types';

interface Props {
  question: MatchingQuestion;
  onAnswer: (answer: Record<string, string>) => void;
  showExplanation?: boolean;
}

export default function MatchingQuestionComponent({ 
  question, 
  onAnswer, 
  showExplanation = false 
}: Props) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Shuffle right side
  const shuffledPairs = useMemo(() => {
    const rights = question.pairs.map(p => p.right);
    return rights.sort(() => Math.random() - 0.5);
  }, [question.pairs]);

  const handleMatch = (leftId: string, rightValue: string) => {
    setMatches(prev => ({
      ...prev,
      [leftId]: rightValue,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAnswer(matches);
  };

  const checkCorrect = useMemo(() => {
    const correct: Record<string, boolean> = {};
    question.pairs.forEach(pair => {
      correct[pair.id] = matches[pair.id] === pair.right;
    });
    return correct;
  }, [matches, question.pairs]);

  const allCorrect = Object.values(checkCorrect).every(v => v);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-3">
          {question.pairs.map(pair => (
            <div key={pair.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-800">{pair.left}</p>
            </div>
          ))}
        </div>

        {/* Right column with dropdown */}
        <div className="space-y-3">
          {question.pairs.map(pair => (
            <select
              key={`${pair.id}-select`}
              value={matches[pair.id] || ''}
              onChange={(e) => handleMatch(pair.id, e.target.value)}
              disabled={submitted}
              className="w-full px-3 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Select...</option>
              {shuffledPairs.map((right, idx) => (
                <option key={idx} value={right}>{right}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== question.pairs.length}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
        >
          Submit Answer
        </button>
      )}

      {submitted && (
        <div className={`p-4 rounded-lg ${
          allCorrect
            ? 'bg-green-100 border border-green-500 text-green-800'
            : 'bg-red-100 border border-red-500 text-red-800'
        }`}>
          <p>{allCorrect ? '✓ All correct!' : '✗ Some incorrect'}</p>
        </div>
      )}
    </div>
  );
}
```

### Testing Checklist
- [ ] True/False buttons toggle correctly
- [ ] Fill-in-blank input accepts user text
- [ ] Matching dropdowns populate with shuffled options
- [ ] Answer validation works for all types
- [ ] Correct/incorrect feedback displays

---

## Task 3.4: Essay & Advanced Question Renderers

### Description
Build Essay question renderer with word count validation and advanced features.

### Implementation

**File:** `apps/web/shell/src/components/lessons/questions/EssayQuestion.tsx`

```typescript
import React, { useState, useMemo } from 'react';
import { EssayQuestion } from '@cq/shared-types';

interface Props {
  question: EssayQuestion;
  onAnswer: (answer: string) => void;
  showExplanation?: boolean;
}

export default function EssayQuestionComponent({ 
  question, 
  onAnswer, 
  showExplanation = false 
}: Props) {
  const [essayText, setEssayText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const wordCount = useMemo(() => {
    return essayText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [essayText]);

  const isWithinWordLimit = useMemo(() => {
    if (question.minWords && wordCount < question.minWords) return false;
    if (question.maxWords && wordCount > question.maxWords) return false;
    return true;
  }, [wordCount, question.minWords, question.maxWords]);

  const handleSubmit = () => {
    if (isWithinWordLimit) {
      setSubmitted(true);
      onAnswer(essayText.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-gray-50 rounded-lg">
        <textarea
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          disabled={submitted}
          placeholder="Type your essay here..."
          rows={8}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
        />

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Word count: <span className={!isWithinWordLimit ? 'text-red-500 font-bold' : 'text-gray-800'}>
              {wordCount}
            </span>
            {question.minWords && <span> / {question.minWords} min</span>}
            {question.maxWords && <span> - {question.maxWords} max</span>}
          </div>
        </div>

        {question.rubric && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-gray-700"><strong>Rubric:</strong> {question.rubric}</p>
          </div>
        )}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!isWithinWordLimit}
          className={`w-full py-2 px-4 rounded-lg font-semibold ${
            isWithinWordLimit
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit Essay
        </button>
      )}

      {submitted && (
        <div className="p-4 bg-blue-100 border border-blue-500 rounded-lg text-blue-800">
          <p>✓ Your essay has been submitted for review.</p>
        </div>
      )}
    </div>
  );
}
```

### Testing Checklist
- [ ] Essay textarea accepts long text
- [ ] Word count updates in real-time
- [ ] Min/max word validation works
- [ ] Submit button disabled when outside word limits
- [ ] Rubric displays when provided
- [ ] Submit marks question as submitted

