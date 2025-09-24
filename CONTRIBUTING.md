# 🌱 Contributing to the Plant Diagnosis Frontend

Welcome, and thank you for considering contributing to the Plant Diagnosis Frontend! Your help is greatly appreciated. Before you begin, please read through this document to understand our development process and guidelines.

# Setup

1. Install [Node.js LTS](https://nodejs.org/en/download/) (v20 or higher).

2. Clone this repository to your local machine.

3. Navigate to the root directory of the repository.

4. Install the project dependencies with `pnpm install`.

<!-- ## Environment Variables

Create a `.env.local` file in the root of the repository by copying the example file:

```
cp .env.example .env.local
``` -->

<!-- You will need to set the NEXT_PUBLIC_API_BASE_URL variable in this file to point to the backend server's address (e.g., http://127.0.0.1:5000). -->

# Development

To start the local development server, run the following command. This will launch the application on http://localhost:3000.

```
pnpm run dev
```

The application will automatically reload when you save your changes.

# Testing Your Changes

In your pull request, it's important to provide a thorough plan for how you tested your changes.

- For all UI changes, please provide **screenshots or a short video** demonstrating the new behavior. A before-and-after comparison is always helpful.

- Ensure that any new components or logic are covered by unit tests. You can run the test suite with `pnpm test`.

# Git Workflow

Our project uses two main branches:

- `main`: Contains only stable, production-ready code. Direct pushes are disabled.

- `beta`: The primary development and integration branch. All feature branches are merged here.

1. **Create a Feature Branch**: Always create your new branch from the `beta` branch. Use a descriptive name (e.g., `feat/image-uploader` or `fix/styling-issue`).

2. **Make Commits**: For commit messages, please keep them concise, descriptive, and in all lowercase. We recommend reading [How to Write a Git Commit Message for guidance](https://chris.beams.io/posts/git-commit/).

3. **Open a Pull Request**: When your feature is complete, push your branch to GitHub and open a pull request to merge it into the beta branch. Provide a clear description of your changes and include your testing plan.

**Promoting to Production** (`main`)
Changes are promoted from `beta` to `main` only when `beta` is stable and ready for a release. This is done by a maintainer of the project.

A "Release" pull request is opened from `beta` into `main`.

After a final review, the pull request is merged.

A new version tag (e.g., `v1.1.0`) is created on the `main` branch to mark the release.

# Before Submitting a Pull Request

Please ensure your code keeps our CI checks green! Run these commands locally to verify everything is correct before you push.

- Your code passes linting: `pnpm run lint`

- Your code is type-checked: `pnpm run typecheck`

- All unit tests pass: `pnpm test`

Most importantly, make sure your code is well-commented and easy for others to understand!
