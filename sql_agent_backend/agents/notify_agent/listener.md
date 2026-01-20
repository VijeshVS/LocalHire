# Event Listeners and Payloads

This document lists all the CrewAI events being listened to and their corresponding payloads sent to the SSE backend.

## Backend Endpoint
```
http://localhost:8000/emit
```

## Events

### 1. CrewKickoffStartedEvent
**Payload:**
```json
{
  "type": "crew",
  "action": "start",
  "crew_name": "<crew_name>"
}
```

### 2. CrewKickoffCompletedEvent
**Payload:**
```json
{
  "type": "crew",
  "action": "complete",
  "crew_name": "<crew_name>"
}
```

### 3. AgentExecutionStartedEvent
**Payload:**
```json
{
  "type": "agent",
  "action": "start",
  "agent_role": "<role>",
  "agent_goal": "<goal>"
}
```

### 4. AgentExecutionCompletedEvent
**Payload:**
```json
{
  "type": "agent",
  "action": "complete",
  "agent_role": "<role>"
}
```

### 5. TaskStartedEvent
**Payload:**
```json
{
  "type": "task",
  "action": "start",
  "task_name": "<name>",
  "task_desc": "<description>"
}
```

### 6. TaskCompletedEvent
**Payload:**
```json
{
  "type": "task",
  "action": "complete",
  "task_name": "<name>"
}
```

### 7. ToolUsageStartedEvent
**Payload:**
```json
{
  "type": "tool",
  "action": "start",
  "tool_name": "<name>"
}
```

### 8. ToolUsageFinishedEvent
**Payload:**
```json
{
  "type": "tool",
  "action": "complete",
  "tool_name": "<name>",
  "tool_output": "<output>"
}
```

### 9. KnowledgeRetrievalStartedEvent
**Payload:**
```json
{
  "type": "knowledge",
  "action": "start"
}
```

### 10. KnowledgeRetrievalCompletedEvent
**Payload:**
```json
{
  "type": "knowledge",
  "action": "complete"
}
```

### 11. LLMCallStartedEvent
**Payload:**
```json
{
  "type": "llm",
  "action": "start",
  "model": "<model>"
}
```

### 12. LLMCallCompletedEvent
**Payload:**
```json
{
  "type": "llm",
  "action": "complete",
  "model": "<model>",
  "response": "<response>"
}
```

### 13. MemoryRetrievalStartedEvent
**Payload:**
```json
{
  "type": "memory",
  "action": "start"
}
```

### 14. MemoryRetrievalCompletedEvent
**Payload:**
```json
{
  "type": "memory",
  "action": "complete"
}
```

### 15. MemorySaveStartedEvent
**Payload:**
```json
{
  "type": "memory_save",
  "action": "start"
}
```

### 16. MemorySaveCompletedEvent
**Payload:**
```json
{
  "type": "memory_save",
  "action": "complete"
}
```

### 17. AgentReasoningStartedEvent
**Payload:**
```json
{
  "type": "reasoning",
  "action": "start",
  "agent_role": "<role or null>"
}
```

### 18. AgentReasoningCompletedEvent
**Payload:**
```json
{
  "type": "reasoning",
  "action": "complete",
  "agent_role": "<role or null>",
  "reasoning": "<reasoning or null>"
}
```