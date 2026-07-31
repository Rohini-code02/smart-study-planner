# Smart Study Planner

## 🔴 The Problem Statement
Students often struggle with time management, leading to burnout, last-minute cramming, and poor academic performance. When faced with multiple subjects, varying exam dates, and different difficulty levels, it becomes overwhelming to manually figure out *what* to study and *when*. Traditional to-do lists and calendar apps are static—they do not dynamically prioritize tasks, leaving students guessing where to focus their limited daily study hours.

## 🟢 The Solution
The **Smart Study Planner** is a full-stack web application designed to eliminate the guesswork in studying. It provides a centralized platform where students can input their subjects, exam dates, and available daily study hours.

Instead of relying on AI, the application uses a custom **rule-based mathematical algorithm**. It calculates an "urgency score" for each subject based on exam proximity, difficulty, and priority. It then automatically generates a perfectly optimized, session-based daily timetable (Morning, Afternoon, and Evening), ensuring that the most critical subjects receive the highest focus during peak cognitive hours.

## ✨ Features of the Website

### 1. Secure Authentication & User Profiles
* Secure Signup and Login using JWT (JSON Web Tokens).
* Private, isolated data storage so each student only sees their own study materials.

### 2. Interactive Dashboard
* A central hub that provides a quick glance at upcoming exams, pending tasks, and recent progress.
* Quick-action buttons to navigate the app easily.

### 3. Subject & Task Management (CRUD)
* **Subjects:** Add classes by specifying the name, difficulty (Easy/Medium/Hard), priority, exam date, and target daily study hours.
* **Tasks:** Create specific homework assignments or reading goals tied to those subjects, complete with due dates.

### 4. Algorithmic Timetable Generator
* Users input how many hours they have available to study on a given day.
* The backend algorithm ranks subjects by urgency (weighing days left until the exam + difficulty + priority).
* It automatically splits the available time into Morning (Peak Focus), Afternoon (Medium Focus), and Evening (Light Review) sessions.

### 5. My Study Plan
* A dedicated page to view the generated daily schedule.
* Displays a list of pending tasks that need attention, and a history of recently completed tasks.

### 6. Progress Tracking & Analytics Dashboard
* Visual bar charts displaying how many tasks the student has completed throughout the week.
* Calculates a "Goal Completion Percentage" to keep the user motivated.
* Tracks total estimated study hours.

### 7. Modern, Responsive UI
* Built with React and custom CSS, featuring a beautiful, clean, and beginner-friendly design that works smoothly.
