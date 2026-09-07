# TaskFlow – Task Management Dashboard

TaskFlow is a modern, responsive task management and team collaboration application built with Next.js, React, TypeScript, Tailwind CSS, MongoDB, and JWT authentication.

The application allows users to create and manage tasks, organize work using categories and projects, assign tasks to team members, track deadlines, collaborate through comments, view activity history, and reorder tasks using drag-and-drop.

## 🚀 Live Application

Live Demo:
https://task-management-dashboard-eight-silk.vercel.app

## 📦 GitHub Repository

https://github.com/PrajwalSkali/task-management-dashboard

---

## 📌 Project Overview

TaskFlow was developed as an interactive task management dashboard with a focus on productivity, collaboration, responsive design, authentication, data persistence, and team-based project management.

The application provides:

- Personal task management
- Project-based task management
- Team collaboration
- Task assignment
- Task priorities and statuses
- Due-date and overdue tracking
- Search, filtering, and sorting
- Drag-and-drop task ordering
- Comments
- Activity history
- Category management
- User authentication and protected routes

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- User logout
- JWT-based authentication
- HTTP-only authentication cookie
- Protected dashboard routes
- User-specific task access
- Password hashing
- Authentication and authorization checks

---

### ✅ Task Management

- Create tasks
- View tasks
- Edit tasks
- Delete tasks
- Task descriptions
- Task categories
- Task priorities
- Task statuses
- Task due dates
- Personal tasks
- Project tasks
- Task assignment
- Drag-and-drop task ordering

### Task Statuses

Tasks support three statuses:

- Pending
- In Progress
- Completed

### Task Priorities

Tasks support three priority levels:

- Low
- Medium
- High

---

## 📅 Due Dates & Overdue Tasks

TaskFlow provides deadline management through task due dates.

The application can:

- Display task due dates
- Identify overdue tasks
- Track completed and pending tasks
- Filter tasks based on deadline-related conditions

---

## 🔎 Search, Filtering & Sorting

Users can efficiently find and organize tasks using:

- Task title search
- Status filtering
- Category filtering
- Priority filtering
- Assignee filtering
- Overdue filtering
- Sorting and task ordering
- Clear filters functionality

---

## 🖱️ Drag & Drop Ordering

TaskFlow supports drag-and-drop task reordering.

Users can:

- Reorder personal tasks
- Reorder project tasks
- Move tasks using the dedicated drag handle
- Persist the new task order to the database

Task ordering is handled using a drag-and-drop interaction and persisted through the task API.

---

## 📊 Dashboard

The dashboard provides an overview of the user's work.

It includes:

- Total tasks
- Pending tasks
- In-progress tasks
- Completed tasks
- Task analytics
- Task overview
- Productivity information

---

## 📁 Projects

Users can organize tasks into shared projects.

Project functionality includes:

- Create projects
- View projects
- Edit projects
- Delete projects
- Project descriptions
- Project task management
- Project member management
- Project roles
- Project activity history

### Project Roles

Projects support:

- Owner
- Admin
- Member

---

## 👥 Team Workspace

TaskFlow provides team collaboration features.

Users can:

- View team members
- Assign tasks to team members
- View assigned team tasks
- Manage project members
- Change member roles
- Remove project members
- Work collaboratively on project tasks

---

## 💬 Comments

Project tasks support collaboration through comments.

Users can:

- Add comments
- View comments
- Edit their own comments
- Delete their own comments

Comment actions are also recorded in the activity history.

---

## 📝 Activity History

TaskFlow maintains an activity history for important actions.

Activity tracking includes events such as:

- Task creation
- Task updates
- Status changes
- Priority changes
- Assignment changes
- Project changes
- Comment actions
- Project activity

The activity interface supports:

- Recent activity display
- Show All
- Show Less

---

## 🗂️ Category Management

Users can manage task categories.

Category functionality includes:

- Create categories
- View categories
- Delete categories
- Display task counts
- Assign categories to tasks
- Use categories when creating or editing tasks

---

## 💾 Data Persistence

TaskFlow uses MongoDB for persistent application data.

The database stores information including:

- Users
- Tasks
- Categories
- Projects
- Project members
- Comments
- Activity history

MongoDB Atlas is used for the production database.

---

## 🛠️ Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js App Router API routes
- Node.js
- Mongoose
- MongoDB Atlas

### Authentication & Security

- JWT
- HTTP-only cookies
- Password hashing
- Protected API routes
- Authentication and authorization checks
- Project membership validation

### State Management

- React Context API
- React Hooks

### Drag & Drop

- dnd-kit

### Data Visualization

- Recharts

### Development & Deployment

- Visual Studio Code
- Git
- GitHub
- npm
- Vercel
- MongoDB Atlas

---

## 📁 Project Structure

```text
task-management-dashboard/
│
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── team/
│   │   ├── categories/
│   │   └── settings/
│   │
│   ├── api/
│   │   ├── activities/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── register/
│   │   ├── categories/
│   │   ├── comments/
│   │   ├── projects/
│   │   ├── settings/
│   │   ├── tasks/
│   │   ├── team/
│   │   └── users/
│   │
│   ├── login/
│   ├── register/
│   └── ...
│
├── components/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── TaskCard.tsx
│   ├── AddTaskModal.tsx
│   ├── TaskComments.tsx
│   ├── ActivityHistory.tsx
│   └── ...
│
├── context/
│   └── TaskContext.tsx
│
├── lib/
│   ├── auth.ts
│   ├── task.ts
│   ├── user.ts
│   ├── project.ts
│   ├── projectMember.ts
│   ├── comment.ts
│   ├── activity.ts
│   └── ...
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── .gitignore
└── README.md