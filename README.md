# Quiet Study — Evidence-Informed Study Timer

A calm, low-distraction study timer web application designed for students who want help getting started, staying with a task, taking a real restorative break, and noticing their effort without guilt or shame.

---

## 🌿 Evidence-Informed Design Principles

1. **Flexible Starting Points (Not Dogma):**
   - Presets (15, 25, 45 minutes) are offered as convenient entry points to match available energy and time—never framed as "scientifically optimal intervals".
2. **Implementation Intentions:**
   - Small task prompts ("When I sit down, I will...") reduce starting resistance, while keeping **"Start without a task"** immediately available so planning is never an obstacle to starting.
3. **Drift-Proof Interval Computation:**
   - Countdown timer relies on an absolute target timestamp (`endTime`), ensuring accuracy even when tabs are throttled in the background or devices sleep.
4. **Mind-Clearing Thought Parking:**
   - A single-tap **"Park a thought"** feature allows sudden off-topic ideas ("Email prof", "Buy milk") to be jotted down in 5 seconds and saved to the session notes, preventing focus derailment.
5. **Guilt-Free Restorative Breaks:**
   - Breaks are voluntary, adjustable, and feature low-effort guided actions: 20-20-20 eye rests, standing posture shifts, hydration, and an interactive 4-4-6 breathing pacer.
   - Overtime is non-punitive: when a break runs long, the app gently indicates you can resume whenever ready.
6. **Effort Log Over Moral Streaks:**
   - Sessions are recorded honestly with real dates, completed durations, and optional progress reflections. No toxic streak loss or failure language.
7. **Sensory & Accessibility Customization:**
   - Includes procedural Web Audio harmonic chimes, low-stimulation mode (softening contrast and hiding animated rings), reduced-motion support, and full keyboard/screen-reader navigation.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS with custom editorial design tokens (warm paper & ink palette, serif headings)
- **Audio:** Web Audio API synthesized harmonic bell (no external audio assets or network requests)
- **State & Persistence:** Dual-mode unified storage service
  - **Offline/Guest Mode (Default):** Works 100% out of the box using `localStorage` with JSON export/import and zero external dependencies.
  - **Cloud Sync Mode:** Plug-and-play Supabase PostgreSQL with Row Level Security (RLS) and Supabase Auth.
- **Database Schema:** `supabase/schema.sql` (profiles, tasks, sessions, distraction_notes).

---

## 🚀 Running the App Locally

### 1. Install & Run
```bash
cd /Users/saipraveenbehara/.gemini/antigravity/scratch/study-timer-app
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The app runs immediately in local offline mode without needing any external credentials!

---

## ☁️ Optional: Connecting Supabase Cloud Sync

To enable cloud accounts and cross-device sync:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the script in `supabase/schema.sql`.
3. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Restart your development server (`npm run dev`). The app will automatically detect Supabase and transition from local storage to secure cloud PostgreSQL with RLS.
