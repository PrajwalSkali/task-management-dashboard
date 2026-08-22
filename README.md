# TaskFlow

A modern and responsive task management application built with Next.js and Tailwind CSS.

TaskFlow allows users to create accounts, manage tasks, organize tasks using categories, set priorities and due dates, update task status, and efficiently search and filter their tasks.

---

## 🚀 Project Overview

TaskFlow is a productivity-focused task management system developed as part of the Phase 1 Foundation Development project.

The application provides users with a simple dashboard where they can manage their daily tasks and organize their work efficiently.

The current version focuses on authentication, task management, category management, filtering, search functionality, and responsive UI design.

---

## ✨ Features

### Authentication

- User Registration
- User Login
- Logout functionality
- Protected dashboard access
- User-specific task storage
- Login session handling

### Task Management

- Create new tasks
- View all tasks
- Edit existing tasks
- Delete tasks
- Set task priority
- Set task due date
- Add task description
- Change task status

### Task Status

Tasks can have one of the following statuses:

- Pending
- In Progress
- Completed

### Task Priority

Tasks support three priority levels:

- Low
- Medium
- High

### Category Management

- Create new categories
- View all categories
- Delete unused categories
- Display number of tasks in each category
- Assign tasks to categories
- Use newly created categories while creating or editing tasks

### Search & Filtering

- Search tasks by title
- Filter tasks by status
- Filter tasks by category
- Clear filters
- Display filtered task count

### Dashboard

- Total task count
- Pending task count
- Completed task count
- Task overview
- Responsive dashboard layout

### Data Persistence

TaskFlow currently uses browser LocalStorage for data persistence.

The following data is stored locally:

- User login information
- Tasks
- Categories

---

## 🛠️ Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### State Management

- React Context API
- React Hooks

### Storage

- Browser LocalStorage

### Development Tools

- Visual Studio Code
- Git
- GitHub
- npm

---

## 📁 Project Structure

```text
TaskFlow/
│
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── register/
│   │   └── page.tsx
│   │
│   └── ...
│
├── components/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── TaskCard.tsx
│   ├── AddTaskModal.tsx
│   └── ...
│
├── context/
│   └── TaskContext.tsx
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md