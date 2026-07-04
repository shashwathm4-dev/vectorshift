# main.py
# FastAPI backend with DAG analysis using Kahn's Algorithm.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from collections import defaultdict, deque

app = FastAPI()

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PipelineRequest(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


class Issue(BaseModel):
    type: str
    message: str
    edge: list[str] | None = None
    node: str | None = None
    node_title: str | None = None


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool
    issues: list[Issue]


def _node_display_name(node_id: str, node_map: dict[str, dict]) -> str:
    """Returns a human-readable name for a node: 'Title (id)' or just 'id'."""
    node = node_map.get(node_id, {})
    data = node.get("data", {})
    # Try to get a meaningful name from node data
    name = (
        data.get("inputName")
        or data.get("outputName")
        or data.get("alertName")
        or data.get("url")
        or data.get("condition")
        or None
    )
    ntype = node.get("type", "unknown")
    if name:
        return f"{name} ({ntype})"
    return f"{ntype} [{node_id}]"


def find_cycle_edges(
    node_ids: set[str], edges: list[dict], node_map: dict[str, dict]
) -> list[Issue]:
    """
    Kahn's Algorithm for DAG detection.
    Returns issues for all edges that participate in cycles.
    """
    adjacency: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = defaultdict(int)

    # Initialize all nodes with 0 in-degree
    for nid in node_ids:
        in_degree[nid] = 0

    # Build adjacency list and in-degree map
    for edge in edges:
        source = edge.get("source", "")
        target = edge.get("target", "")
        if source in node_ids and target in node_ids:
            adjacency[source].append(target)
            in_degree[target] += 1

    # Start with all nodes that have in-degree 0
    queue = deque([n for n in node_ids if in_degree[n] == 0])
    visited_count = 0

    while queue:
        node = queue.popleft()
        visited_count += 1
        for neighbor in adjacency[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if visited_count == len(node_ids):
        return []  # It's a DAG

    # Identify all nodes still in cycles (in_degree > 0)
    remaining = {n for n in node_ids if in_degree[n] > 0}

    issues: list[Issue] = []
    seen_edges = set()

    for edge in edges:
        source = edge.get("source", "")
        target = edge.get("target", "")
        if source in remaining and target in remaining:
            edge_key = f"{source}->{target}"
            if edge_key not in seen_edges:
                seen_edges.add(edge_key)
                src_name = _node_display_name(source, node_map)
                tgt_name = _node_display_name(target, node_map)
                issues.append(
                    Issue(
                        type="cycle",
                        message=f"Cycle detected: {src_name} → {tgt_name}",
                        edge=[source, target],
                    )
                )

    return issues


def detect_structural_issues(
    node_ids: set[str],
    nodes: list[dict],
    edges: list[dict],
    node_map: dict[str, dict],
) -> list[Issue]:
    """
    Detect structural issues independent of cycle detection:
    - Non-source node with zero incoming edges
    - Output-type node with zero incoming edges
    """
    issues: list[Issue] = []

    # Determine which node types are "source" types (no expected inputs)
    SOURCE_TYPES = {"customInput", "fileUpload"}

    # Build set of nodes that have at least one incoming edge
    nodes_with_incoming: set[str] = set()
    for edge in edges:
        target = edge.get("target", "")
        if target in node_ids:
            nodes_with_incoming.add(target)

    for node in nodes:
        nid = node.get("id", "")
        ntype = node.get("type", "")
        display = _node_display_name(nid, node_map)

        # Output-type node with zero incoming edges
        if ntype == "customOutput" and nid not in nodes_with_incoming:
            issues.append(
                Issue(
                    type="unreachable_output",
                    message=f"Output node '{display}' has no incoming connections",
                    node=nid,
                    node_title=display,
                )
            )
        # Non-source node with zero inputs (not already caught above)
        elif ntype not in SOURCE_TYPES and nid not in nodes_with_incoming:
            if ntype != "customOutput":  # Avoid duplicate
                issues.append(
                    Issue(
                        type="disconnected_node",
                        message=f"Node '{display}' has no incoming connections and may be unreachable",
                        node=nid,
                        node_title=display,
                    )
                )

    return issues


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(request: PipelineRequest):
    nodes = request.nodes
    edges = request.edges

    node_ids = {node.get("id", "") for node in nodes}
    node_map = {node.get("id", ""): node for node in nodes}
    issues: list[Issue] = []

    # 1. Kahn's algorithm — DAG check + cycle edge identification
    cycle_issues = find_cycle_edges(node_ids, edges, node_map)
    is_dag = len(cycle_issues) == 0
    issues.extend(cycle_issues)

    # 2. Structural issue detection
    structural_issues = detect_structural_issues(node_ids, nodes, edges, node_map)
    issues.extend(structural_issues)

    return PipelineResponse(
        num_nodes=len(nodes),
        num_edges=len(edges),
        is_dag=is_dag,
        issues=issues,
    )


@app.get("/pipelines/node-configs")
def get_node_configs():
    """
    Dynamically scans and reads all JSON files in the frontend's nodeConfigs directory.
    This allows adding/removing config files on the fly without server restarts.
    """
    import os
    import json

    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Path to frontend nodeConfigs folder
    configs_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "frontend", "src", "nodeConfigs"))

    if not os.path.exists(configs_dir):
        # Fallback to local subdirectory if not found
        configs_dir = os.path.abspath(os.path.join(current_dir, "nodeConfigs"))

    configs = []
    if os.path.exists(configs_dir):
        for file in os.listdir(configs_dir):
            if file.endswith(".json"):
                file_path = os.path.join(configs_dir, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        config_data = json.load(f)
                        configs.append(config_data)
                except Exception as e:
                    print(f"Error reading {file}: {e}")

    # Sort configs by category order, then title
    category_order = { "io": 0, "ai": 1, "transform": 2, "integration": 3, "logic": 4 }
    
    def sort_key(cfg):
        cat = cfg.get("category", "default")
        title = cfg.get("title", "")
        return (category_order.get(cat, 99), title.lower())

    configs.sort(key=sort_key)
    return configs


def _get_configs_hash(configs_dir: str) -> str:
    """Computes a unique MD5 hash based on JSON files and their modification times."""
    import os
    import hashlib

    if not os.path.exists(configs_dir):
        return ""
    
    files_info = []
    try:
        for file in sorted(os.listdir(configs_dir)):
            if file.endswith(".json"):
                path = os.path.join(configs_dir, file)
                # Combine filename and modification time
                files_info.append(f"{file}:{os.path.getmtime(path)}")
    except Exception as e:
        print(f"Error hashing folder: {e}")
        
    return hashlib.md5(",".join(files_info).encode("utf-8")).hexdigest()


@app.get("/pipelines/node-configs/stream")
async def stream_node_configs():
    """
    SSE stream that watches the configs directory and pushes updates
    to the frontend in real-time as soon as files are added, removed, or changed.
    """
    from fastapi.responses import StreamingResponse
    import asyncio
    import os
    import json

    async def event_generator():
        current_dir = os.path.dirname(os.path.abspath(__file__))
        configs_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "frontend", "src", "nodeConfigs"))

        if not os.path.exists(configs_dir):
            configs_dir = os.path.abspath(os.path.join(current_dir, "nodeConfigs"))

        last_hash = ""
        while True:
            try:
                new_hash = _get_configs_hash(configs_dir)
                if new_hash != last_hash:
                    last_hash = new_hash
                    # Scan and load the sorted list
                    configs = get_node_configs()
                    yield f"data: {json.dumps(configs)}\n\n"
            except Exception as e:
                print(f"Error in SSE generator: {e}")
            await asyncio.sleep(1.0)  # Check folder state every 1 second

    return StreamingResponse(event_generator(), media_type="text/event-stream")


