# Infinite Canvas Assignment

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000` (or the port shown in your terminal).

## Testing

Run the test suite once without watch mode:

```bash
npm test -- --watchAll=false
```

To run tests interactively during development, use:

```bash
npm test
```

## Production Build

Create an optimized production build:

```bash
npm run build
```

The generated files are written to the `build/` directory.

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow that deploys the app to GitHub Pages whenever changes are pushed to `main`.

In the GitHub repository settings, open **Settings > Pages** and set **Build and deployment** to **GitHub Actions**.

After the workflow completes, the app will be available at:

```text
https://345987-boop.github.io/infinity-canvas/
```

You can also start a deployment manually from the repository's **Actions** tab by selecting the **Deploy to GitHub Pages** workflow and choosing **Run workflow**.
