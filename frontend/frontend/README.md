# Vectorshift Frontend

This is the React frontend for the Vectorshift Pipeline Builder and DAG Analyzer application. It provides a visual drag-and-drop designer canvas built on ReactFlow.

For the full setup instructions (including backend requirements and DAG validation features), see the root [README.md](../../README.md).

---

## 🛠️ Frontend Stack

- **React 18**: Dynamic functional UI.
- **ReactFlow**: Infinite drag-and-drop pipeline canvas.
- **Zustand (v4.5.x)**: Global application state management.
- **Vanilla CSS**: Styled interfaces with custom themes.

---

## ⚙️ Development Instructions

### 1. Installation

From this directory (`frontend/frontend`), run:

```bash
npm install
```

### 2. Run Development Server

```bash
npm start
```
Opens the browser at `http://localhost:3000`.

### 3. Production Build

```bash
npm run build
```
Creates an optimized production bundle in the `build/` directory.
