from crewai.events import (
    CrewKickoffStartedEvent,
    CrewKickoffCompletedEvent,
    AgentExecutionCompletedEvent,
    AgentExecutionStartedEvent,
    TaskStartedEvent,
    TaskCompletedEvent,
    ToolUsageStartedEvent,
    ToolUsageFinishedEvent,
    KnowledgeRetrievalStartedEvent,
    KnowledgeRetrievalCompletedEvent,
    LLMCallStartedEvent,
    LLMCallCompletedEvent,
    MemoryRetrievalStartedEvent,
    MemoryRetrievalCompletedEvent,
    MemorySaveStartedEvent,
    MemorySaveCompletedEvent,
    AgentReasoningStartedEvent,
    AgentReasoningCompletedEvent,
)
from crewai.events import BaseEventListener
import requests

SSE_BACKEND = "http://localhost:8000/emit"

class MyCustomListener(BaseEventListener):
    def __init__(self):
        super().__init__()

    def setup_listeners(self, crewai_event_bus):
        @crewai_event_bus.on(CrewKickoffStartedEvent)
        def on_crew_started(source, event):
            payload = {
                "type": "crew",
                "action": "start",
                "crew_name": event.crew_name
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(CrewKickoffCompletedEvent)
        def on_crew_completed(source, event):
            payload = {
                "type": "crew",
                "action": "complete",
                "crew_name": event.crew_name
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(AgentExecutionStartedEvent)
        def on_agent_execution_started(source, event):
            payload = {
                "type": "agent",
                "action": "start",
                "agent_role": event.agent.role,
                "agent_goal": event.agent.goal
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(AgentExecutionCompletedEvent)
        def on_agent_execution_completed(source, event):
            payload = {
                "type": "agent",
                "action": "complete",
                "agent_role": event.agent.role
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(TaskStartedEvent)
        def on_task_started(source, event):
            payload = {
                "type": "task",
                "action": "start",
                "task_name": event.task.name,
                "task_desc": event.task.description
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(TaskCompletedEvent)
        def on_task_complete(source, event):
            payload = {
                "type": "task",
                "action": "complete",
                "task_name": event.task.name
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(ToolUsageStartedEvent)
        def on_tool_usage_started(source, event):
            payload = {
                "type": "tool",
                "action": "start",
                "tool_name": event.tool_name
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(ToolUsageFinishedEvent)
        def on_tool_usage_finished(source, event):
            payload = {
                "type": "tool",
                "action": "complete",
                "tool_name": event.tool_name,
                "tool_output": event.output
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(KnowledgeRetrievalStartedEvent)
        def on_knowledge_retrieval_started(source, event):
            payload = {
                "type": "knowledge",
                "action": "start"
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(KnowledgeRetrievalCompletedEvent)
        def on_knowledge_retrieval_completed(source, event):
            payload = {
                "type": "knowledge",
                "action": "complete"
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(LLMCallStartedEvent)
        def on_llm_call_started(source, event):
            payload = {
                "type": "llm",
                "action": "start",
                "model": event.model
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(LLMCallCompletedEvent)
        def on_llm_call_completed(source, event):
            payload = {
                "type": "llm",
                "action": "complete",
                "model": event.model,
                "response": event.response
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(MemoryRetrievalStartedEvent)
        def on_memory_retrieval_started(source, event):
            payload = {
                "type": "memory",
                "action": "start"
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(MemoryRetrievalCompletedEvent)
        def on_memory_retrieval_completed(source, event):
            payload = {
                "type": "memory",
                "action": "complete"
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(MemorySaveStartedEvent)
        def on_memory_save_started(source, event):
            payload = {
                "type": "memory_save",
                "action": "start"
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(MemorySaveCompletedEvent)
        def on_memory_save_completed(source, event):
            payload = {
                "type": "memory_save",
                "action": "complete"
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(AgentReasoningStartedEvent)
        def on_agent_reasoning_started(source, event):
            payload = {
                "type": "reasoning",
                "action": "start",
                "agent_role": event.agent.role if hasattr(event, 'agent') else None
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)


        @crewai_event_bus.on(AgentReasoningCompletedEvent)
        def on_agent_reasoning_completed(source, event):
            payload = {
                "type": "reasoning",
                "action": "complete",
                "agent_role": event.agent.role if hasattr(event, 'agent') else None,
                "reasoning": event.reasoning if hasattr(event, 'reasoning') else None
            }
            requests.post(SSE_BACKEND, json=payload, timeout=2)

