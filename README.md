# ELZATONA: THE ULTIMATE MONOREPO ENGINEERING BIBLE
> **Author:** Principal Engineer & Technical Architect
> **Strategy:** Monorepo (Next.js Web + Expo Mobile + Go Microservices + PostgreSQL + Redis)
> **Goal:** Build a Duolingo-clone for frontend developer interview preparation with full gamification parity.

---

## Workspace Scaffold

The current repo now follows the intended monorepo shape:

- `apps/web/shell`: existing web shell host
- `apps/web/website`: learner-facing website microfrontend
- `apps/web/admin`: Next.js admin micro-frontend stub
- `apps/mobile`: Expo mobile micro-frontend stub
- `packages/*`: shared UI, API, type, config, and validation packages
- `services/*`: Go microservice stubs for auth, content, spaced repetition, gamification, and leaderboard
- `tools/*`: reserved for scripts and generators

---

# 📦 MODULE 1: COMPLETE DUOLINGO-PARITY FEATURE MAP

Every feature below is decomposed into **Frontend (FE)**, **Backend (BE)**, and **Database (DB)** tasks, assigned as if distributing work across a team.

---

## Feature 1: User Onboarding & Registration Flow

### 1.1 Sign Up / Login
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 1.1.1 | FE | Build sign-up page with email/password fields, Google OAuth button, and GitHub OAuth button. Validate inputs with Zod schemas client-side. |
| 1.1.2 | FE | Build login page with email/password fields, "Forgot Password" link, and OAuth providers. Store JWT in httpOnly cookie. |
| 1.1.3 | BE | `services/auth`: Implement `POST /auth/register` endpoint. Hash password with bcrypt. Return JWT + refresh token pair. |
| 1.1.4 | BE | `services/auth`: Implement `POST /auth/login` endpoint. Verify bcrypt hash. Issue JWT (15min expiry) + refresh token (7d expiry). |
| 1.1.5 | BE | `services/auth`: Implement Google & GitHub OAuth2 callback handlers. Create user record if first login. |
| 1.1.6 | BE | `services/auth`: Implement `POST /auth/refresh` to rotate refresh tokens. |
| 1.1.7 | DB | `users` table: `id UUID PK`, `email UNIQUE`, `username UNIQUE`, `password_hash`, `avatar_url`, `auth_provider` (email/google/github), `created_at`, `updated_at`. |
| 1.1.8 | DB | `refresh_tokens` table: `id UUID PK`, `user_id FK`, `token_hash`, `expires_at`, `revoked_at`. |

### 1.2 Onboarding Wizard (First-Time User)
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 1.2.1 | FE | Step 1 screen: "What's your experience level?" — 4 cards: Beginner, Junior, Mid-Level, Senior. Animated card selection with scale bounce. |
| 1.2.2 | FE | Step 2 screen: "What do you want to master?" — Multi-select chips: HTML/CSS, JavaScript, React, TypeScript, System Design, Algorithms. |
| 1.2.3 | FE | Step 3 screen: "Set your daily goal" — 4 options: Casual (5 min/day), Regular (10 min), Serious (15 min), Intense (20 min). Each shows estimated XP. |
| 1.2.4 | FE | Step 4 screen: "Enable daily reminders?" — Time picker + push notification permission request. |
| 1.2.5 | FE | Final screen: Animated confetti + owl mascot saying "You're ready! Let's start your first lesson!" with CTA button. |
| 1.2.6 | BE | `services/auth`: `POST /users/onboarding` — Store experience level, selected topics, daily goal minutes. |
| 1.2.7 | BE | `services/content`: Auto-generate a recommended guided path based on selected topics and experience level. |
| 1.2.8 | DB | `user_preferences` table: `user_id FK`, `experience_level`, `daily_goal_minutes`, `reminder_time`, `selected_topics JSONB`, `onboarding_completed_at`. |

### 1.3 Placement Test (Optional Skip)
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 1.3.1 | FE | Placement test UI: 15 progressive-difficulty questions. Timer bar at top. Progress indicator showing question number. |
| 1.3.2 | FE | After test: Results screen showing "You placed at Unit 4! 3 units unlocked." with animated unlock effects. |
| 1.3.3 | BE | `services/content`: `POST /placement-test/submit` — Score responses, calculate placement unit, bulk-unlock completed units. |
| 1.3.4 | DB | `placement_results` table: `user_id FK`, `score`, `placed_unit`, `taken_at`. |

---

## Feature 2: The Learning Path Map (Duolingo Home Screen)

### 2.1 Serpentine Path Rendering
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 2.1.1 | FE | Render vertical serpentine (S-curve) path using SVG/Canvas. Path alternates left-right with smooth bezier curves connecting circular nodes. |
| 2.1.2 | FE | Each node is a circular button (64px). Render 3 visual states: Locked (grey, padlock icon, 40% opacity), Unlocked/Active (lime-gold border, pulsing glow animation), Completed (emerald green fill, white checkmark). |
| 2.1.3 | FE | Add a 4th "Perfect" state: Gold crown icon on completed nodes where user scored 100% accuracy. |
| 2.1.4 | FE | Floating mascot owl avatar sits on the current active node. Owl has idle breathing animation. Speech bubble says the lesson topic name. |
| 2.1.5 | FE | Scroll behavior: Auto-scroll to the active node on page load. Smooth scroll with spring physics. |
| 2.1.6 | BE | `services/content`: `GET /paths/:pathId/progress` — Return full node list with each node's state (locked/unlocked/completed/perfect) for the authenticated user. |
| 2.1.7 | DB | `path_nodes` table: `id`, `path_id FK`, `day_number`, `title`, `description`, `topic_category`, `xp_reward`, `order_index`. |
| 2.1.8 | DB | `user_node_progress` table: `user_id FK`, `node_id FK`, `status` (locked/unlocked/completed/perfect), `score`, `completed_at`. |

### 2.2 Units & Sections (Grouping Nodes)
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 2.2.1 | FE | Group nodes into "Units" (e.g., Unit 1: DOM Basics — 5 lessons). Display unit header banner between node groups with unit title, icon, and overall progress bar. |
| 2.2.2 | FE | Unit completion triggers a "Unit Complete!" modal with XP summary, accuracy %, and an animated chest opening revealing gem rewards. |
| 2.2.3 | BE | `services/content`: `GET /paths/:pathId/units` — Return units with nested nodes and aggregate completion stats. |
| 2.2.4 | DB | `path_units` table: `id`, `path_id FK`, `title`, `description`, `order_index`, `icon_name`. |

### 2.3 Boss Fight Checkpoints
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 2.3.1 | FE | Every 5th node is a "Boss Fight" — double-wide portal gate asset. Glowing red/gold animation. Requires completing all prior nodes. |
| 2.3.2 | FE | Boss fight is a timed 10-question comprehensive quiz covering the entire unit. Timer bar depletes. Wrong answers cost hearts. |
| 2.3.3 | BE | `services/content`: `GET /boss-fight/:unitId` — Return 10 randomized questions from all topics in that unit. |
| 2.3.4 | BE | `services/gamification`: `POST /boss-fight/:unitId/submit` — Score results, award 3x XP multiplier for boss fights, unlock next unit. |

### 2.4 Milestone Reward Chests
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 2.4.1 | FE | After every 5 completed lessons, show a treasure chest on the path. Tapping it plays an opening animation revealing gems (10-50 random). |
| 2.4.2 | BE | `services/gamification`: `POST /chests/:chestId/open` — Calculate random gem reward, credit to user balance, mark chest as claimed. |
| 2.4.3 | DB | `milestone_chests` table: `id`, `path_id FK`, `trigger_after_node`, `min_gems`, `max_gems`. |
| 2.4.4 | DB | `user_chest_claims` table: `user_id FK`, `chest_id FK`, `gems_awarded`, `claimed_at`. |

---

## Feature 3: Lesson Types & Quiz Engine

### 3.1 Multiple Choice Questions
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.1.1 | FE | Display question text at top. 4 answer option cards below. Tapping a card highlights it. "Check" button at bottom. |
| 3.1.2 | FE | Correct answer: Card glows green, confetti particles burst, "+10 XP" floats up. Incorrect: Card shakes, flashes red, heart shatters. |
| 3.1.3 | BE | `services/content`: Store questions with `type: 'multiple_choice'`, `options JSONB`, `correct_index`. |
| 3.1.4 | DB | `questions` table: `id`, `node_id FK`, `type` enum, `prompt TEXT`, `code_snippet TEXT`, `options JSONB`, `correct_answer`, `explanation TEXT`, `difficulty` (1-5). |

### 3.2 Code Output Prediction
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.2.1 | FE | Show a syntax-highlighted code block (read-only). Ask "What does this code output?". 4 text options below. |
| 3.2.2 | FE | After answering, show expandable explanation panel with step-by-step code walkthrough. |
| 3.2.3 | BE | `services/content`: Questions with `type: 'code_output'`. Store code in `code_snippet` field. |

### 3.3 Fill-in-the-Blank Code Completion
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.3.1 | FE | Show code block with blanked-out tokens (e.g., `const result = arr._____(fn)`). User drags word chips from a bank below into blank slots. |
| 3.3.2 | FE | Word bank contains correct tokens + 2-3 distractors. Chips snap into slots with spring animation. |
| 3.3.3 | BE | `services/content`: Questions with `type: 'fill_blank'`. Store `blanks JSONB` array with positions and correct tokens. |

### 3.4 Matching Pairs
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.4.1 | FE | Two columns: left has concepts (e.g., "useEffect"), right has definitions. User taps one from each column to match. Matched pairs fade out with green glow. |
| 3.4.2 | BE | `services/content`: Questions with `type: 'matching'`. Store `pairs JSONB` array of `{left, right}` objects. |

### 3.5 True/False Rapid Fire
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.5.1 | FE | Statement card appears. Two large buttons: ✅ True / ❌ False. 5-second countdown per question. Rapid-fire sequence of 10 statements. |
| 3.5.2 | BE | `services/content`: Questions with `type: 'true_false'`. Store `correct_answer: boolean`. |

### 3.6 Code Writing Challenge (Playground)
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.6.1 | FE | Full split-pane code editor (Monaco/CodeMirror). Left: editable code with starter template. Right top: live preview. Right bottom: test case results. |
| 3.6.2 | FE | "Run Tests" button executes code against hidden test cases. Green checkmarks for passing, red X for failing. |
| 3.6.3 | BE | `services/content`: `POST /code-challenge/run` — Execute user code in a sandboxed environment (WebAssembly or Docker). Run against test cases. Return pass/fail results. |
| 3.6.4 | DB | `code_challenges` table: `id`, `node_id FK`, `starter_code TEXT`, `solution_code TEXT`, `test_cases JSONB` (array of `{input, expected_output}`). |

### 3.7 Lesson Session Orchestrator
| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 3.7.1 | FE | A lesson session = 5-8 questions mixed from different types. Progress bar at top fills with each answered question. |
| 3.7.2 | FE | Session complete screen: XP earned, accuracy %, hearts remaining, time taken. "Continue" button returns to map. |
| 3.7.3 | BE | `services/content`: `GET /lessons/:nodeId/session` — Return a shuffled set of 5-8 questions for that node. Mix question types. |
| 3.7.4 | BE | `services/gamification`: `POST /lessons/:nodeId/complete` — Calculate XP (base + accuracy bonus + speed bonus), update hearts, update streak, mark node completed. |
| 3.7.5 | DB | `lesson_sessions` table: `id`, `user_id FK`, `node_id FK`, `questions_answered`, `correct_answers`, `accuracy_pct`, `xp_earned`, `duration_seconds`, `completed_at`. |

---

## Feature 4: Hearts / Lives System

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 4.1 | FE | Display 5 heart icons in the HUD header. Filled hearts = remaining lives. Empty hearts = lost lives. |
| 4.2 | FE | When a wrong answer is submitted: the rightmost filled heart shatters with a red pixel explosion animation and a subtle screen shake. |
| 4.3 | FE | When hearts reach 0: Display modal "Out of Hearts!" with options: "Wait for refill" (shows countdown timer), "Watch ad" (future), "Spend 350 gems to refill". |
| 4.4 | FE | Heart regeneration countdown: Show timer next to hearts "Next heart in 4h 23m". Each heart regenerates every 5 hours. |
| 4.5 | BE | `services/gamification`: Heart regeneration logic — On each API request, calculate elapsed time since `last_heart_regen_at`. For every 5 hours elapsed, increment hearts (max 5). Update `last_heart_regen_at`. |
| 4.6 | BE | `services/gamification`: `POST /hearts/refill` — Deduct 350 gems, set hearts to 5. Reject if insufficient gems. |
| 4.7 | BE | `services/gamification`: `POST /hearts/deduct` — Decrease hearts by 1. If hearts = 0, block lesson access. |
| 4.8 | DB | `user_gamification_vitals.hearts` (INTEGER DEFAULT 5), `user_gamification_vitals.last_heart_regen_at` (TIMESTAMPTZ). |

---

## Feature 5: Streak System

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 5.1 | FE | Streak flame icon in HUD header. Shows current streak count with fire-orange glow. Pulse animation on active streak days. |
| 5.2 | FE | Streak calendar widget: 30-day grid. Active days = orange fire dots. Missed days = grey dots. Current day = pulsing gold ring. |
| 5.3 | FE | Streak milestone celebrations: At 7, 30, 50, 100, 365 days — full-screen celebration modal with unique animated badge and gem rewards. |
| 5.4 | FE | "Streak at risk!" warning notification if user hasn't practiced today and it's past 8 PM local time. |
| 5.5 | FE | Streak freeze indicator: Small blue shield icon next to streak flame when a freeze is equipped. |
| 5.6 | BE | `services/gamification`: Streak logic — On lesson completion, check if `last_active_date` is yesterday → increment `current_streak`. If today → no change. If older → reset to 1 (unless streak freeze is equipped → consume freeze, keep streak). |
| 5.7 | BE | `services/gamification`: `GET /streak/calendar` — Return 30-day activity log with dates and completion status. |
| 5.8 | BE | `services/gamification`: Streak milestone rewards — Award gems automatically: 7d=50, 30d=150, 100d=500 gems. |
| 5.9 | DB | `user_gamification_vitals.current_streak`, `longest_streak`, `last_active_date DATE`. |
| 5.10 | DB | `streak_activity_log` table: `user_id FK`, `activity_date DATE`, `xp_earned`, `lessons_completed`. |

---

## Feature 6: XP (Experience Points) & Leveling System

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 6.1 | FE | XP counter in HUD header with blue progress ring showing % to next level. |
| 6.2 | FE | Level-up celebration: Full-screen modal with "Level 15!" text, star burst particles, and new title reveal (e.g., "React Apprentice → React Developer"). |
| 6.3 | FE | XP breakdown toast after each lesson: Base XP + Accuracy Bonus + Speed Bonus + Streak Multiplier = Total. |
| 6.4 | BE | XP calculation formula: `base_xp` (10 per question) + `accuracy_bonus` (100% = +20 XP) + `speed_bonus` (under 60s = +15 XP) + `streak_multiplier` (streak > 7 = 1.5x). |
| 6.5 | BE | Level thresholds: Level = floor(total_xp / 500). Each level requires 500 XP. |
| 6.6 | BE | `services/gamification`: `POST /xp/award` — Add XP, check for level-up, return new level if changed. |
| 6.7 | DB | `user_gamification_vitals.xp` (INTEGER), `user_gamification_vitals.level` (INTEGER). |
| 6.8 | DB | `level_titles` table: `level_number`, `title` (e.g., 1="Novice", 5="Junior Dev", 10="Mid Developer", 20="Senior Engineer", 30="Staff Engineer"). |

---

## Feature 7: Gems (Virtual Currency)

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 7.1 | FE | Gem balance in HUD header: Amber diamond icon + count. Animate count change with number ticker. |
| 7.2 | FE | Gem earning animations: "+10 gems" floats upward from source (chest, lesson, quest) to the HUD counter. |
| 7.3 | BE | Gem earning sources: Lesson completion (5 gems), Perfect lesson (15 gems), Daily quest completion (10 gems each), Streak milestones (50-500 gems), Chest rewards (10-50 gems). |
| 7.4 | BE | `services/gamification`: `POST /gems/credit` and `POST /gems/debit` — Atomic balance operations with transaction locking to prevent race conditions. |
| 7.5 | DB | `user_gamification_vitals.gems` (INTEGER DEFAULT 100). |
| 7.6 | DB | `gem_transactions` table: `id`, `user_id FK`, `amount` (+/-), `source` (lesson/quest/chest/purchase/store), `description`, `created_at`. |

---

## Feature 8: Weekly Leagues & Leaderboards

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 8.1 | FE | League screen: Show current league name and badge (Bronze → Silver → Gold → Sapphire → Ruby → Obsidian → Diamond). |
| 8.2 | FE | Leaderboard table: 30 users per cohort. Show rank, avatar, username, weekly XP. Top 10 highlighted in promotion zone (green). Bottom 5 in demotion zone (red). Current user row always visible and highlighted in gold. |
| 8.3 | FE | End-of-week results modal: "Promoted to Gold League!" or "Demoted to Silver League" with animation. |
| 8.4 | BE | `services/leaderboard`: Use **Redis Sorted Sets**. Key: `league:{cohortId}:week:{weekNumber}`. Score: weekly XP. Member: userId. |
| 8.5 | BE | `services/leaderboard`: `GET /league/standings` — `ZREVRANGE` to get top 30 with scores. Calculate user's rank with `ZREVRANK`. |
| 8.6 | BE | `services/leaderboard`: Weekly cron job (Sunday 23:59 UTC) — Promote top 10, demote bottom 5, keep middle 15. Reassign cohorts. Clear Redis keys. |
| 8.7 | BE | `services/leaderboard`: Cohort assignment — New users placed in Bronze. Groups of 30 randomly formed each Monday. |
| 8.8 | DB | `user_gamification_vitals.current_league` VARCHAR (bronze/silver/gold/sapphire/ruby/obsidian/diamond). |
| 8.9 | DB | `league_history` table: `user_id FK`, `week_number`, `league`, `final_rank`, `xp_earned`, `promoted BOOLEAN`. |

---

## Feature 9: Daily Quests

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 9.1 | FE | Daily quests card on dashboard: 3 quest rows. Each has icon, description, progress bar, and XP reward. |
| 9.2 | FE | Quest types: "Complete 2 lessons" (progress 1/2), "Earn 50 XP" (progress 35/50), "Get 3 answers correct in a row" (progress 2/3). |
| 9.3 | FE | Completed quest: Green checkmark, strikethrough text, claim button. Claiming triggers "+10 XP" animation. |
| 9.4 | FE | All 3 quests completed: Bonus "Daily Challenge Complete!" card appears with +20 bonus gems. |
| 9.5 | BE | `services/gamification`: `GET /quests/daily` — Generate 3 daily quests at midnight UTC. Quests rotate from a pool of 15 quest templates. |
| 9.6 | BE | `services/gamification`: `POST /quests/:questId/progress` — Increment quest progress. Auto-complete when threshold met. |
| 9.7 | DB | `quest_templates` table: `id`, `description`, `type` (lessons/xp/accuracy/streak), `target_value`, `xp_reward`, `gem_reward`. |
| 9.8 | DB | `user_daily_quests` table: `user_id FK`, `quest_template_id FK`, `date DATE`, `current_progress`, `target_value`, `completed BOOLEAN`, `claimed BOOLEAN`. |

---

## Feature 10: Spaced Repetition Flashcard Arena

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 10.1 | FE | Flashcard page: Large 3D card center-screen. Front face shows question. Tap to flip with smooth 3D Y-axis rotation (Reanimated). Back face shows answer with syntax-highlighted code. |
| 10.2 | FE | Review buttons below flipped card: `Again` (red, <1m), `Hard` (orange, 1d), `Good` (blue, 4d), `Easy` (green, 8d). |
| 10.3 | FE | Session stats bar: Cards reviewed, cards remaining, accuracy %. |
| 10.4 | FE | Combo meter at top: Consecutive correct answers fill a flame gauge. At 10x combo, "2x XP Booster!" banner activates. |
| 10.5 | FE | Card categories filter: Dropdown to filter by topic (DOM, React, CSS, JS, TypeScript). |
| 10.6 | BE | `services/spaced-repetition`: Implement **SuperMemo SM-2** algorithm in Go. Calculate next review date based on response quality (0-5 grade mapping: Again=1, Hard=2, Good=4, Easy=5). |
| 10.7 | BE | `services/spaced-repetition`: `GET /flashcards/due` — Return cards where `next_review_at <= NOW()` sorted by urgency. |
| 10.8 | BE | `services/spaced-repetition`: `POST /flashcards/:id/review` — Update easiness factor, repetitions, and next review timestamp. |
| 10.9 | DB | `user_flashcards` table: `id`, `user_id FK`, `question TEXT`, `answer TEXT`, `category`, `easiness_factor REAL DEFAULT 2.5`, `repetitions INTEGER DEFAULT 0`, `interval_days INTEGER DEFAULT 0`, `next_review_at TIMESTAMPTZ`. |
| 10.10 | DB | `flashcard_review_log` table: `id`, `card_id FK`, `user_id FK`, `response_quality` (1-5), `reviewed_at`. |

---

## Feature 11: Freestyle Custom Syllabus Builder

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 11.1 | FE | Dotted-grid canvas workspace. User drags topic blocks from a bottom drawer onto the canvas. |
| 11.2 | FE | Topic blocks: Glassmorphic cards showing topic name, lesson count, difficulty badge. Available topics: HTML5, CSS3, JavaScript ES6+, TypeScript, React 19, Next.js, System Design, Algorithms, Web Performance, Accessibility, Testing. |
| 11.3 | FE | Auto-connector lines: When two blocks are placed, animated cyan arrows connect them forming a custom timeline path. |
| 11.4 | FE | Stats panel (right sidebar): Total lessons, estimated days, total XP, difficulty average. Updates live as blocks are added/removed. |
| 11.5 | FE | "Activate Plan" button: Saves custom syllabus as the user's active study plan. Confetti animation on save. |
| 11.6 | BE | `services/content`: `POST /custom-paths` — Store user's custom syllabus with ordered topic references. Auto-generate day nodes from selected topics. |
| 11.7 | BE | `services/content`: `GET /topics/catalog` — Return all available topics with lesson counts and difficulty. |
| 11.8 | DB | `user_study_plans` table: `id`, `user_id FK`, `title`, `type` (guided/custom), `topic_ids JSONB`, `total_days`, `completed_days DEFAULT 0`, `is_active BOOLEAN`, `created_at`. |

---

## Feature 12: Coding Playground with Gamified Vitals

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 12.1 | FE | Split-pane layout: Left = Monaco code editor (Fira Code font, dark theme). Right top = live preview/output. Right bottom = test results console. |
| 12.2 | FE | Hearts tracker in editor header: 5 crimson hearts. Wrong test run = heart shatter animation with red pixel burst. |
| 12.3 | FE | XP multiplier dial: Radial gauge showing 1.0x → 1.5x → 2.0x. Increases with consecutive passing test runs. Resets on failure. |
| 12.4 | FE | Timer: Optional countdown timer for timed challenges. Completing under time limit = speed bonus XP. |
| 12.5 | FE | "Hype alerts" toast: "Flawless Code! 🔥", "DOM Destroyer! ⚡" — triggered during rapid error-free coding streaks. |
| 12.6 | BE | `services/content`: `POST /code/execute` — Sandbox execution of user code against test cases. Return pass/fail array with actual vs expected outputs. |
| 12.7 | BE | `services/gamification`: Calculate playground XP: base (30) + tests_passed_bonus + speed_bonus + no_errors_bonus. |
| 12.8 | DB | `code_submissions` table: `id`, `user_id FK`, `challenge_id FK`, `submitted_code TEXT`, `tests_passed INTEGER`, `tests_total INTEGER`, `execution_time_ms`, `submitted_at`. |

---

## Feature 13: Gem Shop & Virtual Store

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 13.1 | FE | Store page grid layout: 2x3 card grid. Each card shows item 3D icon, name, description, and gem price badge. |
| 13.2 | FE | Store items: Streak Freeze (250 gems) — protects streak for 1 missed day. Heart Refill (350 gems) — restores all 5 hearts. Double XP Potion (200 gems) — 15 min of 2x XP. Timed Practice (150 gems) — unlock a bonus timed challenge. Theme Skins (400-800 gems) — Synthwave, Matrix, Olive editor themes. Loot Box (500 gems) — random reward. |
| 13.3 | FE | Purchase confirmation modal: "Buy Streak Freeze for 250 Gems?" with current balance shown. Success animation: item flies to inventory. |
| 13.4 | FE | Active items indicator: Small icons next to HUD showing equipped items (e.g., blue shield for streak freeze). |
| 13.5 | BE | `services/gamification`: `POST /store/purchase` — Validate balance, debit gems, credit item to user inventory. Atomic transaction. |
| 13.6 | BE | `services/gamification`: `GET /store/items` — Return available store catalog with prices. |
| 13.7 | BE | `services/gamification`: `POST /inventory/:itemId/use` — Consume item (e.g., activate streak freeze, apply theme). |
| 13.8 | DB | `store_items` table: `id`, `name`, `description`, `icon_name`, `gem_price`, `type` (consumable/permanent), `effect JSONB`. |
| 13.9 | DB | `user_inventory` table: `id`, `user_id FK`, `item_id FK`, `quantity`, `equipped BOOLEAN`, `purchased_at`. |

---

## Feature 14: User Profile & Achievements

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 14.1 | FE | Profile header: Avatar (uploadable), username, title (e.g., "Senior Developer"), level badge, join date. |
| 14.2 | FE | Stats cards row: Total XP, Longest Streak, Lessons Completed, Current League, Accuracy %. |
| 14.3 | FE | Achievement badge grid (Trophy Room): 4x3 grid of circular badges. Unlocked = vibrant colored with glow. Locked = greyed out with "?" icon. |
| 14.4 | FE | Badge hover/tap popover: Badge name, description, unlock condition, rarity % (e.g., "Only 3.2% of users"), unlock date. |
| 14.5 | FE | Weekly XP line chart: Last 12 weeks of XP activity plotted on a gradient line graph. |
| 14.6 | FE | League journey timeline: Horizontal bar showing league progression history (Bronze → Silver → Gold, etc.). |
| 14.7 | BE | `services/gamification`: `GET /profile/:userId` — Return aggregated stats, badges, league history. |
| 14.8 | BE | `services/gamification`: Achievement evaluation engine — On each lesson completion or milestone, check if any new badge conditions are met. Award badge if so. |
| 14.9 | DB | `achievements` table: `id`, `name`, `description`, `icon_name`, `condition_type` (streak/xp/lessons/accuracy/league), `condition_value`, `rarity_pct REAL`. |
| 14.10 | DB | `user_achievements` table: `user_id FK`, `achievement_id FK`, `unlocked_at`. |

### Achievement Examples:
| Badge Name | Condition | Rarity |
|------------|-----------|--------|
| First Steps | Complete 1 lesson | 85% |
| Week Warrior | 7-day streak | 42% |
| Century Club | 100-day streak | 3.2% |
| Perfectionist | 10 perfect lessons | 18% |
| DOM Destroyer | Complete DOM unit | 25% |
| Speed Demon | Complete lesson under 60s | 12% |
| Gem Collector | Accumulate 5,000 gems | 8% |
| Diamond League | Reach Diamond League | 1.5% |
| Code Poet | 50 code challenges passed | 15% |
| Flashcard Master | Review 500 flashcards | 7% |

---

## Feature 15: Practice Hub & Mistake Review

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 15.1 | FE | Practice Hub page: "Review Mistakes" card — shows count of previously wrong answers. "Weak Areas" card — topics with lowest accuracy. "Random Practice" card — quick random quiz. |
| 15.2 | FE | Mistake review session: Re-presents previously incorrect questions. Correct answers remove from mistake queue. |
| 15.3 | BE | `services/content`: `GET /practice/mistakes` — Return questions the user has answered incorrectly, sorted by frequency of errors. |
| 15.4 | BE | `services/content`: `GET /practice/weak-areas` — Aggregate accuracy per topic category. Return topics below 70% accuracy threshold. |
| 15.5 | DB | `user_question_history` table: `user_id FK`, `question_id FK`, `attempts INTEGER`, `correct_attempts INTEGER`, `last_attempted_at`. |

---

## Feature 16: Notifications & Reminders

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 16.1 | FE | In-app notification bell in HUD: Red badge counter for unread notifications. Dropdown panel showing notification list. |
| 16.2 | FE | Notification types: "Your streak is at risk! Practice now.", "You've been promoted to Gold League!", "New daily quests available!", "Your flashcards are due for review." |
| 16.3 | FE | Push notification integration (Expo): Request permission on onboarding. Schedule local notifications for daily reminder time. |
| 16.4 | BE | `services/notifications`: `GET /notifications` — Return user's notification feed. Mark as read on view. |
| 16.5 | BE | `services/notifications`: Scheduled triggers — Streak risk (8 PM if not practiced), league results (Sunday), flashcard due reminders (morning). |
| 16.6 | DB | `notifications` table: `id`, `user_id FK`, `type`, `title`, `body`, `read BOOLEAN DEFAULT false`, `created_at`. |

---

## Feature 17: Social & Friends

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 17.1 | FE | Friends tab: Search bar to find users by username. "Add Friend" button. Friends list showing avatar, name, streak, level. |
| 17.2 | FE | Friend profile peek: Tap a friend to see their stats, achievements, and current league. |
| 17.3 | FE | Friend leaderboard: Separate ranking table showing only friends' weekly XP. |
| 17.4 | BE | `services/auth`: `POST /friends/add`, `DELETE /friends/:friendId`, `GET /friends/list`. |
| 17.5 | DB | `friendships` table: `user_id FK`, `friend_id FK`, `status` (pending/accepted), `created_at`. |

---

## Feature 18: Settings & Preferences

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 18.1 | FE | Settings page sections: Account (email, password, delete account), Preferences (daily goal, reminder time, theme), Notifications (toggle push, email), Privacy (profile visibility). |
| 18.2 | FE | Theme selector: Preview cards for Zatona Classic, Synthwave Neon, Organic Olive, Cyberpunk Matrix, Apple Glass. Selecting applies theme app-wide via CSS variables. |
| 18.3 | BE | `services/auth`: `PATCH /users/settings` — Update user preferences. `DELETE /users/account` — Soft delete with 30-day grace period. |
| 18.4 | DB | `user_preferences` table additions: `theme VARCHAR DEFAULT 'zatona-classic'`, `push_notifications BOOLEAN DEFAULT true`, `email_notifications BOOLEAN DEFAULT true`, `profile_public BOOLEAN DEFAULT true`. |

---

## Feature 19: Admin Panel (Content & League Director)

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 19.1 | FE | Admin dashboard: Total users card, daily active users chart, average streak chart, gem economy overview. |
| 19.2 | FE | Content editor: Form to create/edit questions. Fields: type dropdown, prompt textarea, code snippet editor (Monaco), options builder, correct answer selector, explanation textarea, difficulty slider (1-5), category dropdown. |
| 19.3 | FE | Path builder: Admin version of freestyle builder to create official guided paths with ordered units and nodes. |
| 19.4 | FE | Flashcard creator: Bulk import (CSV) and individual card creator with question/answer/category fields. |
| 19.5 | FE | League controller: View all active cohorts. Adjust promotion thresholds. Force league resets. Ban users. |
| 19.6 | FE | Analytics dashboards: Lesson completion rates per topic, question difficulty calibration (too easy/hard), user retention funnels, gem inflation tracker. |
| 19.7 | BE | `services/auth`: Admin role middleware — Verify `user.role === 'admin'` before granting access to admin endpoints. |
| 19.8 | BE | `services/content`: Full CRUD endpoints for questions, paths, units, nodes, flashcards. Bulk import endpoint for CSV flashcard uploads. |
| 19.9 | BE | `services/gamification`: Admin overrides — manually adjust user XP, gems, hearts, streak. Audit logged. |
| 19.10 | DB | `users.role` VARCHAR DEFAULT 'user' — values: 'user', 'admin', 'moderator'. |
| 19.11 | DB | `admin_audit_log` table: `id`, `admin_user_id FK`, `action`, `target_table`, `target_id`, `changes JSONB`, `performed_at`. |

---

## Feature 20: Navigation & Layout System

| Task ID | Owner | Task Description |
|---------|-------|-----------------|
| 20.1 | FE | Desktop sidebar (240px): Fixed left vertical nav. Logo at top. Links: Home, Guided Path, Freestyle, Flashcards, Leaderboards, Shop, Profile, Settings. Active link has lime-gold left border accent. User card at bottom with avatar, level, logout. |
| 20.2 | FE | HUD top header (80px): Fixed top bar with glass backdrop blur. Left: breadcrumbs. Right: Level badge, Streak flame, Hearts row, Gem balance, Notification bell. |
| 20.3 | FE | Mobile bottom nav (64px): Sticky bottom bar with 5 icons: Map, Freestyle, Flashcards, League, Shop. Active icon scales up 15% with emerald dot indicator. |
| 20.4 | FE | Responsive breakpoints: Desktop ≥1024px (sidebar + HUD). Tablet 768-1023px (collapsible sidebar). Mobile <768px (bottom nav, no sidebar). |
| 20.5 | FE | Page transitions: Shared layout with smooth crossfade transitions between routes (200ms ease-in-out). |

---

# 📐 MODULE 2: SYSTEM ARCHITECTURE

## Microservices Topology
```
┌─────────────────────────────────────┐
│   Frontend Clients                  │
│ ┌─────────────┐   ┌─────────────┐  │
│ │  Web Shell  │   │    Admin    │  │
│ │  (React)    │   │   (Next.js) │  │
│ └─────────────┘   └─────────────┘  │
│ ┌─────────────────────────────────┐ │
│ │   Mobile (Expo / React Native)  │ │
│ └─────────────────────────────────┘ │
└──────────────────┬──────────────────┘
                   │
        ┌──────────────────────┐
        │   API Gateway       │
        │  (Envoy/Kong)       │
        └──────────────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼───┐  ┌──────▼──┐   ┌─────▼────┐
   │ Auth   │  │ Content │   │ Gamif.   │
   │Service │  │Service  │   │Service   │
   └────────┘  └─────────┘   └──────────┘
        │              │              │
   ┌────▼──────────────▼──────────────▼────┐
   │         PostgreSQL (Primary DB)       │
   │  (Users, Content, Paths, Flashcards)  │
   └────────────────────────────────────────┘
           │              │
        ┌──▼──┐      ┌───▼────┐
        │Redis│      │Archive │
        │(Hot)│      │Storage │
        └─────┘      └────────┘

Additional Services:
- Spaced Repetition Service (Go)
- Leaderboard Service (Go, Redis Sorted Sets)
```

## Monorepo Structure
```
code-quest-campaign/
├── apps/                          # User-facing applications
│   ├── web/
│   │   ├── shell/                 # Web Shell (Module Federation host)
│   │   └── admin/                 # Admin Dashboard (Next.js 15 App Router)
│   └── mobile/                    # React Native (Expo)
├── packages/                      # Shared libraries
│   ├── shared-ui/                 # Shared React components + NativeWind styling
│   ├── shared-api/                # API contract types & client generators
│   ├── shared-types/              # TypeScript global types
│   ├── shared-config/             # Shared configs (Tailwind, postcss, etc.)
│   └── shared-validation/         # Zod schemas for API validation
├── services/                      # Go microservices
│   ├── auth/                      # User auth, OAuth2, JWT
│   ├── content/                   # Lessons, questions, paths, flashcards
│   ├── spaced-repetition/         # SM-2 algorithm, review scheduling
│   ├── gamification/              # XP, levels, gems, hearts, streaks, leagues
│   └── leaderboard/               # Weekly leagues, Redis sorted sets
├── infra/                         # Infrastructure & DevOps
│   ├── docker-compose.yml         # Local dev orchestration
│   ├── migrations/                # PostgreSQL schema migrations (Flyway/Migrate)
│   └── k8s/                       # Kubernetes configs (future)
├── tools/                         # Build & dev tooling
│   ├── scripts/                   # Bash/Node scripts
│   └── generators/                # Nx generator customizations
├── nx.json                        # Nx workspace config
├── package.json                   # Root pnpm workspace
├── tsconfig.base.json             # Shared TypeScript config
├── .gitignore                     # VCS ignores
└── README.md                      # This file
```

---

# 🗄️ MODULE 3: COMPLETE POSTGRESQL SCHEMA

## Core Tables

### Users & Authentication
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  avatar_url VARCHAR,
  auth_provider VARCHAR DEFAULT 'email',  -- email, google, github
  role VARCHAR DEFAULT 'user',            -- user, admin, moderator
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### User Preferences
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_level VARCHAR,           -- beginner, junior, mid, senior
  daily_goal_minutes INTEGER DEFAULT 10,
  reminder_time TIME,
  selected_topics JSONB,              -- ["HTML", "React", "TypeScript"]
  theme VARCHAR DEFAULT 'zatona-classic',
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  profile_public BOOLEAN DEFAULT true,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Gamification Vitals
```sql
CREATE TABLE user_gamification_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hearts INTEGER DEFAULT 5,
  gems INTEGER DEFAULT 100,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  last_heart_regen_at TIMESTAMPTZ DEFAULT now(),
  current_league VARCHAR DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Content Structure
```sql
CREATE TABLE paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  difficulty_level INTEGER,          -- 1-5
  total_lessons INTEGER,
  created_by UUID REFERENCES users(id),
  is_official BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE path_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  icon_name VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE path_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES path_units(id) ON DELETE SET NULL,
  day_number INTEGER,
  title VARCHAR NOT NULL,
  description TEXT,
  topic_category VARCHAR,
  xp_reward INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL,
  is_boss_fight BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_node_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'locked',   -- locked, unlocked, completed, perfect
  score DECIMAL(5,2),                -- 0-100 accuracy %
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, node_id)
);

CREATE TABLE user_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR,
  type VARCHAR DEFAULT 'guided',     -- guided, custom
  topic_ids JSONB,
  total_days INTEGER,
  completed_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Questions & Lessons
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,             -- multiple_choice, code_output, fill_blank, matching, true_false, code_challenge
  prompt TEXT NOT NULL,
  code_snippet TEXT,
  options JSONB,                     -- [{label, value}, ...]
  correct_answer VARCHAR,
  explanation TEXT,
  difficulty INTEGER DEFAULT 3,      -- 1-5
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE code_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  starter_code TEXT,
  solution_code TEXT,
  test_cases JSONB,                  -- [{input, expected_output}, ...]
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES code_challenges(id),
  submitted_code TEXT,
  tests_passed INTEGER,
  tests_total INTEGER,
  execution_time_ms INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  questions_answered INTEGER,
  correct_answers INTEGER,
  accuracy_pct DECIMAL(5,2),
  xp_earned INTEGER,
  duration_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 1,
  correct_attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);
```

### Flashcards (Spaced Repetition)
```sql
CREATE TABLE user_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR,
  easiness_factor REAL DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE flashcard_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES user_flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_quality INTEGER,          -- 1-5 (Again, Hard, Good, Easy)
  reviewed_at TIMESTAMPTZ DEFAULT now()
);
```

### Gamification Events
```sql
CREATE TABLE user_daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_template_id UUID NOT NULL,
  date DATE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, quest_template_id)
);

CREATE TABLE quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description VARCHAR NOT NULL,
  type VARCHAR NOT NULL,             -- lessons, xp, accuracy, streak
  target_value INTEGER,
  xp_reward INTEGER DEFAULT 10,
  gem_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  icon_name VARCHAR,
  condition_type VARCHAR NOT NULL,   -- streak, xp, lessons, accuracy, league
  condition_value INTEGER,
  rarity_pct DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE streak_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  xp_earned INTEGER,
  lessons_completed INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

CREATE TABLE league_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER,
  league VARCHAR,
  final_rank INTEGER,
  xp_earned INTEGER,
  promoted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Gem Economy
```sql
CREATE TABLE gem_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER,                    -- positive or negative
  source VARCHAR NOT NULL,           -- lesson, quest, chest, purchase, store, admin
  description VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  icon_name VARCHAR,
  gem_price INTEGER,
  type VARCHAR,                      -- consumable, permanent
  effect JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES store_items(id),
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE milestone_chests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES paths(id),
  trigger_after_node INTEGER,
  min_gems INTEGER,
  max_gems INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_chest_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chest_id UUID NOT NULL REFERENCES milestone_chests(id),
  gems_awarded INTEGER,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chest_id)
);
```

### Social & Notifications
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending',  -- pending, accepted
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR,
  body TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Admin & Audit
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR,
  target_table VARCHAR,
  target_id VARCHAR,
  changes JSONB,
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE placement_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER,
  placed_unit UUID REFERENCES path_units(id),
  taken_at TIMESTAMPTZ DEFAULT now()
);
```

---

# ⚙️ MODULE 4: DEVOPS QUALITY GATES

## TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Biome.json Config
```json
{
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": "error",
      "correctness": "error",
      "suspicious": "warn",
      "style": "warn"
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentSize": 2,
    "lineWidth": 100,
    "arrowParentheses": "asNeeded",
    "trailingComma": "es5"
  }
}
```

## Commitlint Config
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci']],
    'subject-case': [2, 'never', ['start-case', 'pascal-case']],
    'subject-max-length': [2, 'always', 100]
  }
};
```

## SonarQube Config
```properties
# sonar-project.properties
sonar.projectKey=code-quest-campaign
sonar.projectName=ELZATONA
sonar.sources=apps,services,packages
sonar.tests=apps,services,packages
sonar.test.inclusions=**/*.test.ts,**/*.test.go,**/*_test.go
sonar.exclusions=**/node_modules/**,**/dist/**,**/.next/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.go.coverage.reportPaths=coverage/coverage.out
```

---

# 🤖 MODULE 5: AI COPILOT RULES & CONVENTIONS

## Tech Stack
- **Monorepo:** Nx workspace (npmScope: "cq")
- **Frontend:** React 19 + Next.js 15 (App Router) + Expo + React Native
- **Styling:** Tailwind CSS + NativeWind v4 + CSS variables for theming
- **Backend:** Go 1.20+ (clean architecture: Handler → UseCase → Repository)
- **Database:** PostgreSQL (primary) + Redis (leaderboards, cache)
- **API Contracts:** Zod validation + OpenAPI/Swagger
- **Testing:** Jest (React) + Go testing package + Playwright (E2E)
- **Linting:** Biome (format + lint)
- **CI/CD:** GitHub Actions with Nx affected commands

## Core Rules
1. **No `any` type.** All TypeScript must be strictly typed. Use `unknown` if needed and narrow.
2. **Zod validation everywhere.** All API requests/responses must validate with Zod schemas co-located near handlers.
3. **Go clean architecture.** Separate concerns: Models → Repository (DB) → UseCase (business logic) → Handler (HTTP).
4. **No circular dependencies.** Monorepo dependencies: apps → packages → services, never reverse.
5. **Shared UI in `packages/shared-ui`.** React components use NativeWind for web+mobile compatibility.
6. **Env vars in `.env.local`.** Never commit secrets. Use GitHub Secrets for CI/CD.
7. **Commit messages:** Conventional Commits (feat:, fix:, docs:, etc.) — enforced by commitlint.
8. **File co-location:** Tests next to implementation (`*.test.ts`, `*_test.go`).
9. **Single source of truth:** Schema-driven development — define DB schema, generate types, build handlers.

## Testing Strategy
- **Unit Tests:** Jest for React components (snapshot tests for UI), Go `testing` package for services.
- **Integration Tests:** API contract tests with supertest or Go `net/http/httptest`.
- **E2E Tests:** Playwright against Docker Compose stack (full system).
- **Coverage Targets:** 70% for packages, 60% for apps, 80% for services.

## Performance Rules
- **Code splitting:** Webpack Module Federation for web shell remotes.
- **Image optimization:** Next.js Image + Expo Fast Image.
- **Lazy loading:** React.lazy for route-based splitting.
- **Caching:** Nx task caching + Redis for hot data.
- **Bundle size:** Target <250KB gzip for each remote.

---

# 🚀 MODULE 7: BOOTSTRAPPING GUIDE

## Step 1: Initialize Monorepo

```bash
mkdir code-quest-campaign
cd code-quest-campaign

# Initialize pnpm workspace
pnpm init
touch pnpm-workspace.yaml
```

Add to `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/**'
  - 'packages/**'
  - 'services/**'
```

## Step 2: Initialize Nx

```bash
pnpm install -D nx @nrwl/cli @nrwl/workspace @nrwl/react @nrwl/next @nrwl/expo @nrwl/storybook

npx nx init
```

Update `nx.json`:
```json
{
  "npmScope": "cq",
  "affected": { "defaultBase": "main" },
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/nx-cloud",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "e2e"]
      }
    }
  }
}
```

## Step 3: Setup Tools & Linting

```bash
# Biome (formatter + linter)
pnpm install -D @biomejs/biome

# husky + commitlint
pnpm install -D husky @commitlint/cli @commitlint/config-conventional
npx husky install

# Add pre-commit hooks
npx husky add .husky/pre-commit "pnpm biome check --apply ."
npx husky add .husky/commit-msg "npx commitlint --edit $1"

# TypeScript + ESLint
pnpm install -D typescript @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Zod validation
pnpm install zod
```

## Step 4: Create App Structure

```bash
# Web shell (Nx generator)
npx nx generate @nrwl/react:app web/shell --style=tailwind

# Admin (Next.js)
npx create-next-app apps/admin --typescript --tailwind --no-git

# Mobile (Expo)
npx create-expo-app apps/mobile
cd apps/mobile && npm install nativewind react-native-reanimated expo-router

# Go services
mkdir -p services/{auth,content,spaced-rep,gamification,leaderboard}
for dir in services/*/; do cd "$dir" && go mod init "github.com/elzatona/${dir%/}" && cd - ; done
```

## Step 5: Setup Docker Compose (Local Dev)

Create `infra/docker-compose.yml`:
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: localdev
      POSTGRES_DB: code_quest
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

```bash
cd infra && docker-compose up -d
```

## Step 6: Initial Commit

```bash
git init
git add .
git commit -m "feat: bootstrap monorepo with strict quality gates

- Initialize Nx workspace with npmScope 'cq'
- Setup pnpm workspace with apps/, packages/, services/ workspaces
- Configure TypeScript strict mode, Biome linting, commitlint hooks
- Create web shell (React), admin (Next.js), mobile (Expo) stubs
- Scaffold 5 Go microservices (auth, content, spaced-rep, gamification, leaderboard)
- Add Docker Compose for PostgreSQL + Redis local dev
- Add husky pre-commit hooks (Biome format, TypeScript check, tests)
"
```

---

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Start Nx web shell (dev server on port 4200)
```bash
npx nx serve web-shell
```

3. Start Go auth service (port 8081)
```bash
cd services/auth && go run ./cmd/main.go
```

Open `http://localhost:4200` for the web shell and `http://localhost:8081/health` for the auth service health check.
