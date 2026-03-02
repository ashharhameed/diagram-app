import { Handle, Position } from 'reactflow';
import React, { useCallback, useState } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';
import './App.css';

// ── Custom Resizable Node ─────────────────────────────────────────────────────
const ResizableNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={50} isVisible={selected} />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <div style={{
        padding: '10px 20px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {data.label}
      </div>
    </>
  );
};

// ── Custom Image Node ─────────────────────────────────────────────────────────
const ImageNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px',
        border: selected ? '2px solid #4f46e5' : '2px solid #ccc',
      }}>
        <img
          src={data.imageUrl}
          alt={data.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    </>
  );
};

// ── Register Custom Node Types ────────────────────────────────────────────────
const nodeTypes = {
  resizable: ResizableNode,
  image: ImageNode,
};

// ── Initial State ─────────────────────────────────────────────────────────────
const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 100 },
    data: { label: 'Start Here 👋' },
    type: 'resizable',
  },
];

const initialEdges = [];

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedShape, setSelectedShape] = useState('resizable');
  const [edgeType, setEdgeType] = useState('smoothstep');

  // ── Connect nodes with arrow ────────────────────────────────────────────────
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: edgeType,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      ),
    [setEdges, edgeType]
  );

  // ── Add node ────────────────────────────────────────────────────────────────
  const addNode = () => {
    const newNode = {
      id: `${Date.now()}`,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: `Node ${nodes.length + 1}` },
      type: selectedShape,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // ── Remove selected node ────────────────────────────────────────────────────
  const removeNode = () => {
    if (!selectedNode) return alert('Click a node first to select it');
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  // ── Rename selected node ────────────────────────────────────────────────────
  const renameNode = () => {
    if (!selectedNode) return alert('Click a node first to select it');
    if (!renameValue.trim()) return alert('Enter a name first');
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, label: renameValue } }
          : n
      )
    );
    setRenameValue('');
    setSelectedNode(null);
  };

  // ── Save diagram to JSON file ───────────────────────────────────────────────
  const saveDiagram = () => {
    const diagram = { nodes, edges };
    const blob = new Blob([JSON.stringify(diagram, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Load diagram from JSON file ─────────────────────────────────────────────
  const loadDiagram = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const { nodes: loadedNodes, edges: loadedEdges } = JSON.parse(
        evt.target.result
      );
      setNodes(loadedNodes);
      setEdges(loadedEdges);
    };
    reader.readAsText(file);
  };

  // ── Save to localStorage ────────────────────────────────────────────────────
  const saveToBrowser = () => {
    const diagram = { nodes, edges };
    localStorage.setItem('cmap-diagram', JSON.stringify(diagram));
    alert('Saved to browser!');
  };

  // ── Load from localStorage ──────────────────────────────────────────────────
  const loadFromBrowser = () => {
    const saved = localStorage.getItem('cmap-diagram');
    if (!saved) return alert('No saved diagram found');
    const { nodes: n, edges: e } = JSON.parse(saved);
    setNodes(n);
    setEdges(e);
  };

  // ── Upload image as node ────────────────────────────────────────────────────
  const uploadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imageUrl = evt.target.result; // base64 string
      const newNode = {
        id: `${Date.now()}`,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        type: 'image',
        style: { width: 200, height: 200 },
        data: {
          label: file.name,
          imageUrl: imageUrl,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>

      {/* ── Toolbar ── */}
      <div style={{
        position: 'absolute', zIndex: 10, top: 20, left: 20,
        display: 'flex', flexDirection: 'column', gap: '8px', width: '200px'
      }}>

        <button onClick={addNode} style={btnStyle('#4f46e5')}>+ Add Node</button>
        <button onClick={removeNode} style={btnStyle('#dc2626')}>🗑 Remove Node</button>

        <input
          type="text"
          placeholder="New node name..."
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          style={inputStyle}
        />
        <button onClick={renameNode} style={btnStyle('#059669')}>✏️ Rename Node</button>

        <select
          value={selectedShape}
          onChange={(e) => setSelectedShape(e.target.value)}
          style={inputStyle}
        >
          <option value="resizable">Rectangle</option>
          <option value="input">Input (Rounded)</option>
          <option value="output">Output (Rounded)</option>
        </select>

        <select
          value={edgeType}
          onChange={(e) => setEdgeType(e.target.value)}
          style={inputStyle}
        >
          <option value="smoothstep">Smooth Arrow</option>
          <option value="step">Step Arrow</option>
          <option value="straight">Straight Arrow</option>
          <option value="bezier">Bezier Arrow</option>
        </select>

        <button onClick={saveDiagram} style={btnStyle('#0284c7')}>💾 Save to File</button>

        <label style={{ ...btnStyle('#7c3aed'), textAlign: 'center', cursor: 'pointer' }}>
          📂 Load from File
          <input type="file" accept=".json" onChange={loadDiagram} style={{ display: 'none' }} />
        </label>

        <button onClick={saveToBrowser} style={btnStyle('#f59e0b')}>💾 Save to Browser</button>
        <button onClick={loadFromBrowser} style={btnStyle('#10b981')}>📦 Load from Browser</button>

        <label style={{ ...btn2Style('#ec4899'), textAlign: 'center', cursor: 'pointer' }}>
          🖼 Upload Image
          <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} />
        </label>

        {selectedNode && (
          <div style={{
            color: 'white', fontSize: '12px',
            background: '#374151', padding: '6px', borderRadius: '6px'
          }}>
            Selected: <strong>{selectedNode.data.label}</strong>
          </div>
        )}
      </div>

      {/* ── Canvas ── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const btnStyle = (bg) => ({
  padding: '8px 12px',
  fontSize: '14px',
  cursor: 'pointer',
  backgroundColor: bg,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  width: '100%',
});

const btn2Style = (bg) => ({
  padding: '8px 12px',
  fontSize: '14px',
  cursor: 'pointer',
  backgroundColor: bg,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  width: '86%',
});

const inputStyle = {
  padding: '8px',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  width: '100%',
  boxSizing: 'border-box',
};

export default App;