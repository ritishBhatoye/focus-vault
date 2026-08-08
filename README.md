# FocusVault 🚀

> **Lock Distraction. Unlock Discipline.**

FocusVault is a premium mobile application built with **React Native (Expo)** designed to help you reclaim your time, block distracting apps, and build deeply focused work habits. It goes beyond simple timers by incorporating behavioral psychology, experience points (XP), leveling, and rich analytics.

---

## 🌟 Key Features

- **Deep Focus Sessions**: Timers with multiple modes (Shallow, Deep, Hardcore) and a modern "Dark Glass" aesthetic.
- **Distraction Blocking**: Block social media and entertainment apps while you are focused.
- **Robust Analytics**: Track your total focus time, active streaks, daily performance, and attention scores.
- **Behavioral Logs**: Note your urges and triggers when you get distracted to build better habits over time.
- **Gamification**: Earn XP, unlock achievements, and level up your discipline.
- **Seamless Authentication**: Powered by Supabase Auth with secure session state management and route protection.

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native) with [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation.
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native) + Custom Glassmorphism components.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for global stores + `AsyncStorage`/`expo-secure-store` for persistence.
- **Backend/Auth**: [Supabase](https://supabase.com/) (PostgreSQL + GoTrue Auth).

---

## 🚀 Getting Started

Follow these instructions to get a local development copy up and running.

### 1. Prerequisites
- Node.js (v18+)
- Expo CLI
- Expo Go app on your physical device (iOS/Android) or an emulator.

### 2. Installation

Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Copy the `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase credentials:
```env
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Database Setup
A full database schema is provided.
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the contents of `supabase-schema.sql` (found in the root of this project) and run it. This creates all 8 tables, indexes, Row Level Security (RLS) policies, and auth triggers.

### 5. Run the App
Start the Expo Metro bundler:
```bash
npx expo start --clear
```
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Or scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

---

## 🔒 Security
All backend data is secured using **Row Level Security (RLS)** in Supabase, meaning users can only ever access their own sessions, analytics, and behavioral logs.
