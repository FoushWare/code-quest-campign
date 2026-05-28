# ELZATONA Project Tasks Index

Master todo list for all 20 features. Each task contains dedicated directories with implementation details for Frontend, Backend, Database, Infrastructure, and Mobile teams.

---

## Feature Status Overview

- [ ] **01 - User Onboarding & Registration** — User sign-up, login, OAuth, onboarding wizard, placement test
  - Directory: `01-user-registration/`
  - Priority: 🔴 CRITICAL (Foundation feature)
  - Dependencies: None
  - Estimated Effort: 13 tasks (1.1.1-1.1.8, 1.2.1-1.2.8, 1.3.1-1.3.4)

- [ ] **02 - Learning Path Map** — Serpentine path rendering, nodes, units, boss fights, chests
  - Directory: `02-learning-path-map/`
  - Priority: 🔴 CRITICAL (Main UX hub)
  - Dependencies: Feature 01 (User setup)
  - Estimated Effort: 13 tasks (2.1.1-2.1.8, 2.2.1-2.2.4, 2.3.1-2.3.4, 2.4.1-2.4.4)

- [ ] **03 - Lesson Types & Quiz Engine** — Multiple choice, code output, fill-blank, matching, true/false, code challenges
  - Directory: `03-lesson-types/`
  - Priority: 🔴 CRITICAL (Core learning mechanic)
  - Dependencies: Feature 02 (Path structure)
  - Estimated Effort: 20 tasks (3.1.1-3.7.5)

- [ ] **04 - Hearts / Lives System** — 5 hearts, regeneration timer, heart cost for failures
  - Directory: `04-hearts-system/`
  - Priority: 🟠 HIGH (Engagement/progression gate)
  - Dependencies: Feature 03 (Lesson completion)
  - Estimated Effort: 8 tasks (4.1-4.8)

- [ ] **05 - Streak System** — Daily streak tracking, calendar, milestones, freeze power-up
  - Directory: `05-streak-system/`
  - Priority: 🟠 HIGH (Retention mechanic)
  - Dependencies: Feature 04 (Lesson completion)
  - Estimated Effort: 10 tasks (5.1-5.10)

- [ ] **06 - XP & Leveling System** — XP calculation, levels, formulas, level-up celebrations
  - Directory: `06-xp-leveling/`
  - Priority: 🟠 HIGH (Core progression)
  - Dependencies: Feature 03 (Lesson completion)
  - Estimated Effort: 8 tasks (6.1-6.8)

- [ ] **07 - Gems (Virtual Currency)** — Gem balance, earning sources, gem economy
  - Directory: `07-gems-currency/`
  - Priority: 🟠 HIGH (Monetization/shop mechanic)
  - Dependencies: Features 03, 05, 06 (Multiple earning sources)
  - Estimated Effort: 6 tasks (7.1-7.6)

- [ ] **08 - Weekly Leagues & Leaderboards** — Redis leaderboards, cohort assignment, promotion/demotion
  - Directory: `08-leagues-leaderboards/`
  - Priority: 🟠 HIGH (Social/competition)
  - Dependencies: Feature 06 (XP system)
  - Estimated Effort: 9 tasks (8.1-8.9)

- [ ] **09 - Daily Quests** — Quest generation, progress tracking, completion bonuses
  - Directory: `09-daily-quests/`
  - Priority: 🟡 MEDIUM (Retention driver)
  - Dependencies: Features 03, 07 (Lessons + rewards)
  - Estimated Effort: 8 tasks (9.1-9.8)

- [ ] **10 - Spaced Repetition Flashcards** — SM-2 algorithm, 3D card flip, review scheduling
  - Directory: `10-flashcard-arena/`
  - Priority: 🟡 MEDIUM (Alternative learning path)
  - Dependencies: Feature 03 (Quiz engine foundation)
  - Estimated Effort: 10 tasks (10.1-10.10)

- [ ] **11 - Freestyle Syllabus Builder** — Custom path builder, canvas drag-drop, connector lines
  - Directory: `11-freestyle-builder/`
  - Priority: 🟡 MEDIUM (Customization)
  - Dependencies: Feature 02 (Content catalog)
  - Estimated Effort: 8 tasks (11.1-11.8)

- [ ] **12 - Coding Playground** — Monaco editor, live preview, heart cost, XP multiplier
  - Directory: `12-coding-playground/`
  - Priority: 🟡 MEDIUM (Advanced learning)
  - Dependencies: Features 03, 04, 06 (Core mechanics)
  - Estimated Effort: 8 tasks (12.1-12.8)

- [ ] **13 - Gem Shop** — Store items, purchase flow, inventory management
  - Directory: `13-gem-shop/`
  - Priority: 🟡 MEDIUM (Monetization)
  - Dependencies: Features 07 (Gems)
  - Estimated Effort: 9 tasks (13.1-13.9)

- [ ] **14 - User Profile & Achievements** — Profile display, badge grid, stats, achievements
  - Directory: `14-profile-achievements/`
  - Priority: 🟡 MEDIUM (User showcase)
  - Dependencies: Features 04, 05, 06 (Stats aggregation)
  - Estimated Effort: 10 tasks (14.1-14.10)

- [ ] **15 - Practice Hub** — Mistake review, weak areas, random practice
  - Directory: `15-practice-hub/`
  - Priority: 🟢 LOW (Utility/learning support)
  - Dependencies: Feature 03 (Question history)
  - Estimated Effort: 5 tasks (15.1-15.5)

- [ ] **16 - Notifications & Reminders** — In-app bell, push notifications, scheduled triggers
  - Directory: `16-notifications/`
  - Priority: 🟢 LOW (Engagement tool)
  - Dependencies: Feature 04 (Events to notify)
  - Estimated Effort: 6 tasks (16.1-16.6)

- [ ] **17 - Social & Friends** — Friend search, leaderboard, friend profiles
  - Directory: `17-social-friends/`
  - Priority: 🟢 LOW (Community)
  - Dependencies: Feature 08 (User identities)
  - Estimated Effort: 5 tasks (17.1-17.5)

- [ ] **18 - Settings & Preferences** — Account settings, theme selector, notification toggles
  - Directory: `18-settings/`
  - Priority: 🟢 LOW (UX polish)
  - Dependencies: Feature 01 (User accounts)
  - Estimated Effort: 4 tasks (18.1-18.4)

- [ ] **19 - Admin Panel** — Content editor, path builder, analytics, league controller
  - Directory: `19-admin-panel/`
  - Priority: 🟢 LOW (Operational tooling)
  - Dependencies: All features (System observability)
  - Estimated Effort: 11 tasks (19.1-19.11)

- [ ] **20 - Navigation & Layout System** — Sidebar, HUD header, bottom nav, responsive
  - Directory: `20-navigation-layout/`
  - Priority: 🔴 CRITICAL (Foundational UX)
  - Dependencies: None (but all features depend on this)
  - Estimated Effort: 5 tasks (20.1-20.5)

---

## Recommended Implementation Order

### Phase 1: Foundation (Weeks 1-3)
1. **Feature 20** — Navigation & Layout System (HUD, sidebar, bottom nav scaffolding)
2. **Feature 01** — User Onboarding & Registration (auth endpoints, DB setup)
3. **Feature 03** — Lesson Types & Quiz Engine (core learning loop)

### Phase 2: Core Gamification (Weeks 4-6)
4. **Feature 02** — Learning Path Map (path rendering, node navigation)
5. **Feature 04** — Hearts / Lives System (progression gate)
6. **Feature 06** — XP & Leveling System (progression reward)
7. **Feature 05** — Streak System (retention mechanic)

### Phase 3: Social & Economy (Weeks 7-8)
8. **Feature 07** — Gems (Virtual Currency)
9. **Feature 08** — Weekly Leagues & Leaderboards (competition)
10. **Feature 09** — Daily Quests (engagement loops)

### Phase 4: Advanced Features (Weeks 9-11)
11. **Feature 10** — Spaced Repetition Flashcards
12. **Feature 12** — Coding Playground
13. **Feature 11** — Freestyle Syllabus Builder

### Phase 5: Polish & Monetization (Weeks 12-13)
14. **Feature 13** — Gem Shop
15. **Feature 14** — User Profile & Achievements
16. **Feature 15** — Practice Hub
17. **Feature 16** — Notifications & Reminders
18. **Feature 17** — Social & Friends
19. **Feature 18** — Settings & Preferences

### Phase 6: Admin & Operations (Week 14+)
20. **Feature 19** — Admin Panel

---

## Task File Naming Convention

Each feature directory contains 5 markdown files:

| File | Owner | Content |
|------|-------|---------|
| `frontend.md` | Frontend Team | React/Next.js/Expo UI components, state management, styling |
| `backend.md` | Backend Team | Go service endpoints, business logic, API contracts |
| `database.md` | Database Team | SQL schema, migrations, query optimizations |
| `infra.md` | DevOps Team | Docker config, environment setup, CI/CD pipeline |
| `mobile.md` | Mobile Team | React Native / Expo specific implementation, native APIs |

---

## Quick Links

- **Project README:** [../README.md](../README.md)
- **Architecture Diagram:** See README Module 2
- **Database Schema:** See README Module 3
- **Quality Gates:** See README Module 4
- **AI Rules:** See README Module 5
