# Agent Frontend - Real-time Agent Execution Viewer

A standalone React application for visualizing AI agent workflow execution in real-time using Server-Sent Events (SSE).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- A backend server running on `http://localhost:8000/events` that emits SSE events

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Run Development Server

```bash
# Using npm
npm run dev

# Using bun
bun run dev
```

The app will open automatically at `http://localhost:3001`

## 🎯 Features

- **Real-time Monitoring**: Live SSE connection to track agent execution
- **Visual Workflow**: Hierarchical display of Crew → Task → Agent → Operations
- **Event Tracking**: Color-coded events for different types (crew, task, agent, tool, llm, etc.)
- **Timeline Review**: Complete post-execution workflow timeline with details
- **Interactive UI**: Click events to view detailed information
- **Connection Control**: Easy connect/disconnect/reset controls

## 🔌 How It Works

1. **Click "Connect to SSE"** - Establishes connection to `http://localhost:8000/events`
2. **Real-time Updates** - Events stream in and are visualized hierarchically
3. **Monitor Progress** - Watch agents, tasks, and operations as they execute
4. **Review Timeline** - After completion, review the full workflow execution

## 📊 Supported Event Types

- **Crew** - Top-level crew coordination (blue)
- **Task** - Task execution (amber)
- **Agent** - Individual agent actions (violet)
- **Tool** - Tool invocations (orange)
- **Knowledge** - Knowledge base queries (emerald)
- **LLM** - LLM interactions (pink)
- **Memory** - Memory operations (blue)

## 🏗️ Project Structure

```
agent_frontend/
├── components/
│   ├── ui/                    # Base UI components
│   ├── AILoadingOverlay.tsx   # Real-time visualization
│   ├── WorkflowReviewModal.tsx # Timeline review
│   └── TerminalOutput.tsx     # Log display
├── hooks/
│   └── useSSEEvents.ts        # SSE connection hook
├── types/
│   └── sseEvents.ts           # TypeScript types
├── lib/
│   └── utils.ts               # Utilities
├── App.tsx                    # Main app component
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## 🔧 Configuration

### Change SSE Endpoint

Edit `hooks/useSSEEvents.ts`:

```typescript
const url = new URL('http://your-backend:port/events');
```

### Customize Port

Edit `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change this
}
```

## 📦 Build for Production

```bash
npm run build
# or
bun run build
```

Built files will be in the `dist/` directory.

## 🎨 Customization

The app uses Tailwind CSS. Customize colors and theme in:
- `tailwind.config.js` - Theme configuration
- `index.css` - CSS variables

## 📡 Backend Integration

Your backend should emit SSE events in this format:

```javascript
// Start event
data: {"type": "agent", "action": "start", "agent_role": "Analyzer", "agent_goal": "Analyze data"}

// Complete event
data: {"type": "agent", "action": "complete", "agent_role": "Analyzer"}

// Done (closes connection)
event: done
data: {}
```

## 🐛 Troubleshooting

**Connection fails?**
- Ensure backend is running on `http://localhost:8000/events`
- Check browser console for CORS errors
- Verify SSE endpoint is accessible

**Events not showing?**
- Check event format matches expected structure
- Verify `type` and `action` fields are present
- Check browser DevTools Network tab for SSE messages

## 📝 License

MIT
