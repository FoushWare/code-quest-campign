# Feature 01: User Onboarding & Registration — Frontend Tasks

**Owner:** Frontend Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 5 frontend tasks (1.1.1, 1.1.2, 1.2.1-1.2.5)  
**Tech Stack:** React, Next.js, Zod validation, Tailwind CSS, Reanimated  

---

## Task 1.1.1: Sign-Up Page

### Description
Build a sign-up page with email/password fields, Google OAuth button, and GitHub OAuth button. Validate inputs with Zod schemas client-side.

### Requirements
- [ ] Email input field with validation (valid email format)
- [ ] Password input field with strength indicator (weak/fair/strong)
- [ ] Confirm password input field
- [ ] Google OAuth button (use next-auth or oauth2-helper)
- [ ] GitHub OAuth button
- [ ] "Already have an account? Login" link
- [ ] Client-side validation using Zod schema
- [ ] Visual error messages below each field
- [ ] Loading state on submit button
- [ ] Success toast on account creation

### Zod Schema
```typescript
// packages/shared-validation/src/auth.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

### Component Structure
```
apps/web/shell/src/components/auth/
├── SignUpForm.tsx          # Main form component
├── PasswordStrengthMeter.tsx
├── OAuthButtons.tsx
└── EmailVerification.tsx    # Optional: email verification modal
```

### API Integration
- **Endpoint:** `POST /auth/register`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response:** JWT token + refresh token (stored in httpOnly cookie)

---

## Task 1.1.2: Login Page

### Description
Build a login page with email/password fields, "Forgot Password" link, and OAuth providers. Store JWT in httpOnly cookie.

### Requirements
- [ ] Email input field
- [ ] Password input field
- [ ] "Remember me" checkbox (optional, sets longer cookie expiry)
- [ ] "Forgot Password?" link (modal or separate page)
- [ ] Google OAuth button
- [ ] GitHub OAuth button
- [ ] "Don't have an account? Sign up" link
- [ ] Client-side validation
- [ ] Loading state on submit
- [ ] Redirect to dashboard on success
- [ ] Error toast on failed login

### Zod Schema
```typescript
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});
```

### Authentication Flow
1. User submits credentials
2. Backend validates and returns JWT + refresh token
3. Frontend stores JWT in httpOnly cookie (handled by backend Set-Cookie)
4. Redirect to dashboard or initial onboarding

### Component Structure
```
apps/web/shell/src/components/auth/
├── LoginForm.tsx
├── ForgotPasswordModal.tsx  (or separate page)
└── OAuthButtons.tsx (shared)
```

---

## Task 1.2.1: Onboarding Wizard — Experience Level

### Description
Step 1 screen: "What's your experience level?" — 4 cards: Beginner, Junior, Mid-Level, Senior. Animated card selection with scale bounce.

### Requirements
- [ ] 4 card options with icons (beginner → senior progression)
- [ ] Card title + description
- [ ] Scale animation on card tap (bounce effect using Reanimated)
- [ ] Selected card highlights with lime-gold border + shadow
- [ ] Progress indicator showing "Step 1 of 4"
- [ ] "Next" button (disabled until selection made)
- [ ] State persisted in context/zustand

### Card Options
```
Beginner: "Just starting to learn HTML/CSS"
Junior: "1-2 years frontend experience"
Mid-Level: "3-5 years, familiar with frameworks"
Senior: "5+ years, system design knowledge"
```

### Animations
```typescript
// Using Reanimated v2
const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

// On tap
const onPress = () => {
  scale.value = withSpring(1.05, { damping: 8 });
  // Set selected option
};
```

---

## Task 1.2.2: Onboarding Wizard — Topic Selection

### Description
Step 2 screen: "What do you want to master?" — Multi-select chips: HTML/CSS, JavaScript, React, TypeScript, System Design, Algorithms.

### Requirements
- [ ] 6 topic chips with icons
- [ ] Multi-select (allow multiple chips selected)
- [ ] Toggle animation on chip tap
- [ ] Selected chips show lime-gold background
- [ ] Minimum 1 topic required to proceed
- [ ] Progress indicator "Step 2 of 4"
- [ ] "Back" and "Next" buttons
- [ ] Save selections to context

### Topic Options
- HTML/CSS (web fundamentals)
- JavaScript (core language)
- React (popular framework)
- TypeScript (type safety)
- System Design (architecture)
- Algorithms (computer science)

---

## Task 1.2.3: Onboarding Wizard — Daily Goal

### Description
Step 3 screen: "Set your daily goal" — 4 options: Casual (5 min/day), Regular (10 min), Serious (15 min), Intense (20 min). Each shows estimated XP.

### Requirements
- [ ] 4 goal option cards with daily time + estimated XP/week
- [ ] Single-select (radio button style)
- [ ] Selected card highlights
- [ ] Show XP calculation: minutes × 10 XP/min × 7 days
- [ ] Progress indicator "Step 3 of 4"
- [ ] Save to context

### Calculations
```
Casual (5 min):    5 × 10 × 7 = 350 XP/week
Regular (10 min):  10 × 10 × 7 = 700 XP/week
Serious (15 min):  15 × 10 × 7 = 1050 XP/week
Intense (20 min):  20 × 10 × 7 = 1400 XP/week
```

---

## Task 1.2.4: Onboarding Wizard — Reminders

### Description
Step 4 screen: "Enable daily reminders?" — Time picker + push notification permission request.

### Requirements
- [ ] Toggle for "Enable Reminders"
- [ ] Time picker (dropdown or time input)
- [ ] "Request Notification Permission" button (for mobile/web)
- [ ] Handle permission response gracefully
- [ ] Progress indicator "Step 4 of 4"
- [ ] "Complete" button

### Implementation
- **Web:** Use Notification API
- **Mobile (Expo):** Use `expo-notifications`
- Store reminder time in user preferences

---

## Task 1.2.5: Onboarding Wizard — Completion Screen

### Description
Final screen: Animated confetti + owl mascot saying "You're ready! Let's start your first lesson!" with CTA button.

### Requirements
- [ ] Confetti animation (canvas or particle library)
- [ ] Owl mascot asset (SVG or animated component)
- [ ] Motivational text + speech bubble
- [ ] "Start Learning" CTA button
- [ ] Redirect to learning path dashboard on click

### Animations
- Confetti burst on mount (2-3 seconds duration)
- Owl character has idle breathing/blinking animation
- Button has glow effect

---

## Shared Context / State Management

Use Zustand or Jotai for onboarding state:

```typescript
// packages/shared-config/src/store/onboarding.ts
interface OnboardingState {
  experienceLevel: 'beginner' | 'junior' | 'mid' | 'senior' | null;
  selectedTopics: string[];
  dailyGoal: number; // minutes
  reminderTime: string | null;
  reminderEnabled: boolean;
  step: 1 | 2 | 3 | 4 | 'complete';
  
  setExperienceLevel: (level: string) => void;
  addTopic: (topic: string) => void;
  removeTopic: (topic: string) => void;
  setDailyGoal: (minutes: number) => void;
  setReminderTime: (time: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}
```

---

## Testing Checklist

- [ ] Unit tests for Zod schemas (validation edge cases)
- [ ] Component snapshot tests for UI consistency
- [ ] Integration test: full onboarding flow end-to-end
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] Mobile responsive: test on 375px, 768px, 1440px viewports
- [ ] Performance: LCP < 2.5s, CLS < 0.1
