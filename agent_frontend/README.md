# Agent Frontend Workflow Components

This folder contains the agent execution workflow UI components extracted from the job-pilot project. These components provide a complete real-time visualization system for monitoring AI agent execution workflows.

## 📁 Structure

```
agent_frontend/
├── components/
│   ├── AILoadingOverlay.tsx      # Real-time agent execution visualization
│   ├── WorkflowReviewModal.tsx   # Complete workflow timeline review
│   └── TerminalOutput.tsx        # Terminal-style log output display
├── hooks/
│   └── useSSEEvents.ts           # Server-Sent Events (SSE) hook for real-time updates
├── types/
│   └── sseEvents.ts              # TypeScript types for SSE events
└── README.md                      # This file
```

## 🎯 Components Overview

### 1. **AILoadingOverlay** (`components/AILoadingOverlay.tsx`)

A sophisticated real-time visualization component that displays the current state of agent execution.

**Features:**
- Hierarchical display: Crew → Task → Agent → Operations
- Real-time event tracking with status indicators
- Color-coded event types (crew, task, agent, tool, memory, knowledge, llm)
- Expandable event details viewer
- Active/completed event counters
- Cancel functionality

**Usage:**
```tsx
import { AILoadingOverlay } from './components/AILoadingOverlay';

<AILoadingOverlay 
  events={events}
  isConnected={isConnected}
  onCancel={handleCancel}
/>
```

**Event Hierarchy:**
```
Crew (Level 0)
  ↓
Task (Level 1)
  ↓
Agent (Level 2)
  ↓
Operations (Level 3): Memory, Knowledge, LLM, Tool
```

### 2. **WorkflowReviewModal** (`components/WorkflowReviewModal.tsx`)

A comprehensive post-execution review modal showing the complete workflow timeline.

**Features:**
- Full timeline view of all events
- Collapsible event details
- Event type summary chips
- Visual timeline connectors
- Completion status tracking
- JSON-aware detail formatting

**Usage:**
```tsx
import { WorkflowReviewModal } from './components/WorkflowReviewModal';

<WorkflowReviewModal
  open={showWorkflowReview}
  onOpenChange={setShowWorkflowReview}
  events={events}
/>
```

### 3. **TerminalOutput** (`components/TerminalOutput.tsx`)

A terminal-style output display for logging agent activities.

**Features:**
- Auto-scrolling log display
- Timestamped log entries
- Type-based icons (info, success, error, loading)
- Color-coded messages
- Processing indicator

**Log Entry Types:**
- `info` - General information
- `success` - Successful operations
- `error` - Error messages
- `loading` - In-progress operations

**Usage:**
```tsx
import TerminalOutput from './components/TerminalOutput';

<TerminalOutput 
  logs={logs}
  isProcessing={isProcessing}
/>
```

### 4. **useSSEEvents Hook** (`hooks/useSSEEvents.ts`)

A React hook for managing Server-Sent Events (SSE) connections to receive real-time agent workflow updates.

**Features:**
- Automatic event tracking and state management
- Connection lifecycle management
- Event deduplication
- Start/complete event pairing
- Clean disconnect handling

**Usage:**
```tsx
import { useSSEEvents } from './hooks/useSSEEvents';

const { 
  events,           // Array of active events
  isConnected,      // Connection status
  isComplete,       // Workflow completion status
  connect,          // Start SSE connection
  disconnect,       // Close SSE connection
  resetEvents       // Clear event history
} = useSSEEvents();

// Connect to SSE endpoint
connect(promptText);

// Disconnect when done
disconnect();

// Reset events for new workflow
resetEvents();
```

## 🔄 Event Types

The system tracks 7 different event types:

| Type | Description | Icon | Color |
|------|-------------|------|-------|
| `crew` | Top-level crew coordination | Users | Primary |
| `task` | Task execution | ListTodo | Amber |
| `agent` | Individual agent actions | Brain | Violet |
| `tool` | Tool invocations | Wrench | Orange |
| `knowledge` | Knowledge base queries | BookOpen | Emerald |
| `llm` | LLM interactions | Cpu | Pink |
| `memory` | Memory operations | Database | Blue |

## 📊 Event Data Structure

### SSEEventPayload
```typescript
interface SSEEventPayload {
  type: SSEEventType;
  action: 'start' | 'complete';
  crew_name?: string;
  agent_role?: string;
  agent_goal?: string;
  task_name?: string;
  task_desc?: string;
  tool_name?: string;
  tool_output?: string;
  model?: string;
  response?: string;
}
```

### ActiveEvent
```typescript
interface ActiveEvent {
  id: string;
  type: SSEEventType;
  name: string;
  startTime: number;
  isComplete: boolean;
  details?: string;
}
```

## 🔌 Backend Integration

These components expect SSE events from a backend endpoint:

**Endpoint:** `http://localhost:8000/events`

**Event Format:**
```javascript
// Start event
{
  "type": "agent",
  "action": "start",
  "agent_role": "Data Analyzer",
  "agent_goal": "Analyze candidate data"
}

// Complete event
{
  "type": "agent",
  "action": "complete",
  "agent_role": "Data Analyzer"
}

// Done event (closes connection)
event: done
```

## 🎨 Dependencies

These components rely on:
- **React** - Core framework
- **lucide-react** - Icon library
- **@/components/ui/** - shadcn/ui components (Dialog, Button, ScrollArea, etc.)
- **@/lib/utils** - Utility functions (cn for className merging)

## 📝 Example Integration

```tsx
import { useState } from 'react';
import { useSSEEvents } from './hooks/useSSEEvents';
import { AILoadingOverlay } from './components/AILoadingOverlay';
import { WorkflowReviewModal } from './components/WorkflowReviewModal';

function App() {
  const [showReview, setShowReview] = useState(false);
  const { events, isConnected, connect, disconnect } = useSSEEvents();

  const handleSearch = async (prompt: string) => {
    connect(prompt);
    // Your API call here
  };

  return (
    <>
      {/* Show during execution */}
      {isConnected && (
        <AILoadingOverlay 
          events={events}
          isConnected={isConnected}
          onCancel={disconnect}
        />
      )}

      {/* Show after completion */}
      <button onClick={() => setShowReview(true)}>
        Review Workflow
      </button>

      <WorkflowReviewModal
        open={showReview}
        onOpenChange={setShowReview}
        events={events}
      />
    </>
  );
}
```

## 🚀 Key Features

1. **Real-time Updates** - Live event streaming via SSE
2. **Hierarchical Visualization** - Clear workflow structure display
3. **Event Tracking** - Start/complete pairing with timing
4. **Interactive Details** - Click to view event details
5. **Post-execution Review** - Complete timeline analysis
6. **Responsive Design** - Works on various screen sizes
7. **Type Safety** - Full TypeScript support

## 🎯 Use Cases

- Monitor AI agent workflow execution
- Debug multi-agent systems
- Visualize crew task coordination
- Track LLM interactions
- Review tool usage patterns
- Analyze knowledge base queries
- Monitor memory operations

## 📦 Installation Notes

To use these components in your project:

1. Ensure you have the required UI components from shadcn/ui
2. Install lucide-react: `npm install lucide-react`
3. Set up your SSE backend endpoint
4. Adjust import paths as needed for your project structure

## 🔧 Customization

The components use Tailwind CSS classes and can be customized by:
- Modifying color schemes in `getEventColor` functions
- Adjusting layout in component JSX
- Changing event icons in `getEventIcon` functions
- Customizing SSE endpoint URL in `useSSEEvents.ts`

---

**Note:** These components are designed to work with CrewAI or similar multi-agent frameworks that emit structured workflow events.
