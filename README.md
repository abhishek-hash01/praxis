# Praxis: Skill Exchange Platform

Praxis is a web application designed to connect people who want to learn new skills with those who want to teach them. It's a community-driven platform for skill sharing and personal growth.

 <!-- Replace with an actual screenshot URL -->

## ✨ Features

*   **User Profiles:** Create a profile showcasing skills you can teach and skills you want to learn.
*   **Discover:** Find users with complementary skills.
*   **Connections:** Connect with other users to arrange skill-sharing sessions.
*   **Real-time Chat:** Communicate with your connections.
*   **Firebase Integration:** Secure authentication and a real-time database powered by Firebase.

## 🚀 Tech Stack

*   **Frontend:** [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) (built on Radix UI)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
*   **Routing:** [React Router](https://reactrouter.com/)
*   **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
*   **Form Handling:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation

## 📋 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (v18 or newer) and [pnpm](https://pnpm.io/) installed on your system.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/praxis.git
    cd praxis
    ```

2.  **Install dependencies:**
    ```sh
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project by copying the example:
    ```sh
    cp .env .env.local
    ```
    Now, open `.env.local` and add your Firebase project configuration. You can find these keys in your Firebase project settings.
    ```
    VITE_FIREBASE_API_KEY="your_api_key_here"
    VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
    VITE_FIREBASE_PROJECT_ID="your_project_id"
    VITE_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
    VITE_FIREBASE_APP_ID="your_app_id"
    ```

## 📜 Available Scripts

In the project directory, you can run:

*   `pnpm dev` - Runs the app in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.
*   `pnpm build` - Builds the app for production to the `dist` folder.
*   `pnpm preview` - Serves the production build locally to preview it.
*   `pnpm test` - Runs the test suite using Vitest.
*   `pnpm typecheck` - Checks the project for TypeScript errors.

## ☁️ Deployment

This project is set up for easy deployment on platforms like [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/).

When deploying, you will need to set up the same environment variables that you have in your `.env.local` file in your hosting provider's dashboard. This ensures that your application can connect to Firebase in production without exposing your keys in the repository.

### Netlify Example

1.  Connect your GitHub repository to Netlify.
2.  Set the build command to `pnpm build`.
3.  Set the publish directory to `dist`.
4.  Go to `Site settings > Build & deploy > Environment` and add your `VITE_FIREBASE_*` variables.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/your-username/praxis/issues) if you want to contribute.
