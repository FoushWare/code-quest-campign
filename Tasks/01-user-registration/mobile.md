# Feature 01: User Onboarding & Registration — Mobile Tasks

**Owner:** Mobile Team  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** Mobile-specific tasks  
**Tech Stack:** React Native, Expo, expo-router, Reanimated, NativeWind  

---

## Task: Mobile Sign-Up & Login Screens

### Description
Adapt the sign-up and login forms for React Native using Expo. Support both web and mobile.

### Implementation

**File:** `apps/mobile/src/app/(auth)/signup.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { signUpSchema } from '@cq/shared-validation';
import * as WebBrowser from 'expo-web-browser';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignUp = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Validate with Zod
      const formData = signUpSchema.parse({
        email,
        password,
        confirmPassword,
      });

      // Call backend
      const response = await fetch('https://api.elzatona.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store tokens (AsyncStorage on mobile)
      await AsyncStorage.setItem('accessToken', data.accessToken);
      // refreshToken stored in httpOnly cookie by backend

      Alert.alert('Success', 'Account created! Redirecting to onboarding...');
      router.replace('/(auth)/onboarding');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black px-6 py-8">
      <Text className="text-2xl font-bold text-white mb-6">Create Account</Text>

      {/* Email Input */}
      <TextInput
        className="bg-gray-900 text-white px-4 py-3 rounded-lg mb-2 border border-gray-800"
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && <Text className="text-red-500 text-sm mb-4">{errors.email}</Text>}

      {/* Password Input */}
      <TextInput
        className="bg-gray-900 text-white px-4 py-3 rounded-lg mb-2 border border-gray-800"
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {errors.password && <Text className="text-red-500 text-sm mb-4">{errors.password}</Text>}

      {/* Confirm Password Input */}
      <TextInput
        className="bg-gray-900 text-white px-4 py-3 rounded-lg mb-2 border border-gray-800"
        placeholder="Confirm Password"
        placeholderTextColor="#666"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {errors.confirmPassword && <Text className="text-red-500 text-sm mb-4">{errors.confirmPassword}</Text>}

      {/* Sign Up Button */}
      <TouchableOpacity
        className="bg-lime-500 py-3 rounded-lg mb-4 active:opacity-80"
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text className="text-black font-bold text-center">
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* OAuth Buttons */}
      <TouchableOpacity
        className="bg-white py-3 rounded-lg mb-3 active:opacity-80"
        onPress={() => handleGoogleSignUp()}
      >
        <Text className="text-black font-bold text-center">Sign Up with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-gray-800 py-3 rounded-lg active:opacity-80"
        onPress={() => handleGitHubSignUp()}
      >
        <Text className="text-white font-bold text-center">Sign Up with GitHub</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-4">
        <Text className="text-gray-400 text-center">
          Already have an account? <Text className="text-lime-500 font-bold">Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

**File:** `apps/mobile/src/app/(auth)/login.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.elzatona.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      // Store token
      await AsyncStorage.setItem('accessToken', data.accessToken);
      
      // Check if user completed onboarding
      const hasOnboarded = await AsyncStorage.getItem('onboarding_completed');
      
      if (hasOnboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black px-6 py-8 justify-center">
      <Text className="text-3xl font-bold text-white mb-8">Login</Text>

      <TextInput
        className="bg-gray-900 text-white px-4 py-3 rounded-lg mb-4 border border-gray-800"
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        className="bg-gray-900 text-white px-4 py-3 rounded-lg mb-4 border border-gray-800"
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-lime-500 py-3 rounded-lg active:opacity-80"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-black font-bold text-center">
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')} className="mt-4">
        <Text className="text-gray-400 text-center">
          Don't have an account? <Text className="text-lime-500 font-bold">Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Task: Mobile Onboarding Flow with Reanimated

### Description
Implement the onboarding wizard with smooth animations using React Native Reanimated.

**File:** `apps/mobile/src/app/(auth)/onboarding/[step].tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@cq/shared-config';

export default function OnboardingStep() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(1);
  
  const scaleAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const onCardPress = (option: string) => {
    scaleAnim.value = withSpring(1.05, { damping: 8 });
    setTimeout(() => {
      scaleAnim.value = withSpring(1);
    }, 100);
    
    store.setExperienceLevel(option);
    handleNext();
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Call backend to save preferences
      const accessToken = await AsyncStorage.getItem('accessToken');
      await fetch('https://api.elzatona.com/users/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          experienceLevel: store.experienceLevel,
          selectedTopics: store.selectedTopics,
          dailyGoalMinutes: store.dailyGoal,
          reminderTime: store.reminderTime,
          remindersEnabled: true,
        }),
      });

      router.replace('/(tabs)/home');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View className="flex-1 bg-black px-6 py-8">
      {/* Progress Indicator */}
      <Text className="text-gray-500 text-sm mb-6">
        Step {currentStep} of 4
      </Text>

      {/* Step Content */}
      {currentStep === 1 && <ExperienceLevelStep onSelect={onCardPress} />}
      {currentStep === 2 && <TopicsStep onNext={handleNext} />}
      {currentStep === 3 && <DailyGoalStep onNext={handleNext} />}
      {currentStep === 4 && <ReminderStep onNext={handleNext} />}

      {/* Navigation Buttons */}
      <View className="flex-row gap-3 mt-8">
        {currentStep > 1 && (
          <TouchableOpacity
            className="flex-1 bg-gray-800 py-3 rounded-lg"
            onPress={handleBack}
          >
            <Text className="text-white font-bold text-center">Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="flex-1 bg-lime-500 py-3 rounded-lg"
          onPress={handleNext}
        >
          <Text className="text-black font-bold text-center">
            {currentStep === 4 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ExperienceLevelStep({ onSelect }: any) {
  const options = ['Beginner', 'Junior', 'Mid-Level', 'Senior'];
  return (
    <View>
      <Text className="text-2xl font-bold text-white mb-6">
        What's your experience level?
      </Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 mb-3 active:border-lime-500"
          onPress={() => onSelect(option.toLowerCase())}
        >
          <Text className="text-white font-semibold">{option}</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {option === 'Beginner' && 'Just starting to learn'}
            {option === 'Junior' && '1-2 years experience'}
            {option === 'Mid-Level' && '3-5 years experience'}
            {option === 'Senior' && '5+ years experience'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## Task: Push Notifications Setup (Expo)

### Description
Setup push notifications with Expo for onboarding reminders.

**File:** `apps/mobile/src/utils/notifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get notification permissions');
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

export function scheduleNotification(trigger: number) {
  Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to Practice!',
      body: 'Start your daily streak today',
      sound: 'default',
    },
    trigger: {
      seconds: trigger,
      type: 'time',
    },
  });
}
```

---

## Testing Checklist

- [ ] Sign-up form validates email format on mobile
- [ ] Password strength meter displays correctly
- [ ] Onboarding wizard animates smoothly (60fps target)
- [ ] OAuth buttons open native chooser (Google, GitHub)
- [ ] AsyncStorage persists tokens correctly
- [ ] Notifications permission request works
- [ ] Test on both iOS and Android simulators
- [ ] Responsive layout on different screen sizes (small, medium, large)
- [ ] Keyboard doesn't obscure input fields
