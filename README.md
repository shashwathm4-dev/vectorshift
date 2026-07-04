# Vectorshift - Pipeline Builder & DAG Analyzer

A full-stack node-based workflow/pipeline builder clone of Vectorshift. Build pipelines visually with dynamic custom nodes, validate dependencies, detect cycles, and ensure your workflow is a valid Directed Acyclic Graph (DAG) using a FastAPI backend.

---

## 🚀 Features

- **Intuitive Drag-and-Drop Canvas**: Built with **ReactFlow** for high-performance and smooth panning/zooming.
- **State Management**: Built using **Zustand (v4.5.x)** for lightweight, fast, and scalable global state.
- **Dynamic Node Configs**: Configurable nodes driven by JSON schemas (supports Inputs, Outputs, LLM, Text, Branches, Loops, Math Transforms, API Webhooks, and Portfolio Alerts).
- **Auto-resizing Textareas**: Handles multi-line node inputs seamlessly using a native JS `scrollHeight` ref-based auto-resize implementation.
- **FastAPI Backend Analyzer**: A robust python backend that analyzes the pipeline structure.
- **Kahn's Algorithm validation**: Validates if the pipeline is a valid Directed Acyclic Graph (DAG), reporting the exact node and edge elements involved in cycles.
- **Type Compatibility Checking**: Validates compatible types on connection.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Functional components & hooks)
- **ReactFlow** (Canvas and connections)
- **Zustand 4.5** (Global state manager)
- **Vanilla CSS** (Sleek dark themes and interactive elements)

### Backend
- **FastAPI** (High performance, async python framework)
- **Uvicorn** (ASGI server implementation)
- **Pydantic** (Data validation and type safety)

---

## 📂 Project Structure

```text
Vectorshift/
├── backend/                  # Python Backend
│   └── backend/
│       ├── main.py           # FastAPI application & DAG analyzer logic
│       └── requirements.txt  # Python package dependencies
└── frontend/                 # React Frontend
    └── frontend/
        ├── public/           # Static assets and index.html
        ├── src/
        │   ├── components/   # Modular UI components (Modal, Toast, BaseNode, etc.)
        │   ├── nodeConfigs/  # JSON schemas mapping node properties
        │   ├── nodes/        # Registry and node template types
        │   ├── store.js      # Zustand global store configuration
        │   ├── submit.js     # Submit button and API integrator
        │   ├── ui.js         # Canvas UI and layout structure
        │   └── index.js      # Application entrypoint
        └── package.json      # React dependencies and scripts
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [Python 3.10+](https://www.python.org/)

---

### 1. Setting up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend/backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be running at `http://localhost:8000`.

---

### 2. Setting up the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend/frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the React development server:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🧩 Running Production Builds

To compile and optimize the frontend for hosting:

```bash
cd frontend/frontend
npm run build
```

This creates an optimized production bundle in the `build/` directory ready for deployment.

---

## 🔍 Pipeline Validation & Kahn's Algorithm

When the pipeline is submitted, it is processed by the backend using **Kahn's Algorithm** (topological sort) to detect cycles:

1. **Cycle Detection**: If the pipeline contains a loop (e.g., Node A -> Node B -> Node C -> Node A), the algorithm detects the unsorted nodes and flags the exact edges forming the loop.
2. **Detailed Reporting**: The analyzer counts the active nodes and edges, identifies validation warnings (such as orphaned nodes or type mismatches), and lists issues interactively in the submit modal.
