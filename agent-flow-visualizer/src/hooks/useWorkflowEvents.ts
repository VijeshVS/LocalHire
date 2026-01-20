import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  WorkflowState, 
  WorkflowEvent, 
  AuxiliaryEvent,
  ToolState,
  LLMState 
} from '@/types/workflow';

const createInitialState = (): WorkflowState => ({
  isConnected: false,
  isComplete: false,
  crew: null,
  agents: new Map(),
  tasks: new Map(),
  auxiliaryEvents: [],
  allEvents: [],
});

export function useWorkflowEvents(eventSourceUrl: string) {
  const [state, setState] = useState<WorkflowState>(createInitialState());
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventIdCounter = useRef(0);

  const generateId = () => `evt-${++eventIdCounter.current}-${Date.now()}`;

  const processEvent = useCallback((eventData: Record<string, unknown>) => {
    const event: WorkflowEvent = {
      ...eventData,
      id: generateId(),
      timestamp: new Date(),
    } as WorkflowEvent;

    setState(prev => {
      const newState = { ...prev };
      newState.allEvents = [...prev.allEvents, event];

      switch (event.type) {
        case 'crew':
          if (event.action === 'start') {
            newState.crew = {
              name: event.crew_name,
              status: 'running',
              startTime: event.timestamp,
            };
          } else {
            if (newState.crew) {
              newState.crew = {
                ...newState.crew,
                status: 'complete',
                endTime: event.timestamp,
              };
            }
            newState.isComplete = true;
          }
          break;

        case 'agent':
          if (event.action === 'start') {
            newState.agents = new Map(prev.agents);
            newState.agents.set(event.agent_role, {
              role: event.agent_role,
              goal: event.agent_goal,
              status: 'running',
              tools: [],
              llmCalls: [],
            });
          } else {
            newState.agents = new Map(prev.agents);
            const agent = newState.agents.get(event.agent_role);
            if (agent) {
              newState.agents.set(event.agent_role, {
                ...agent,
                status: 'complete',
              });
            }
          }
          break;

        case 'task':
          if (event.action === 'start') {
            newState.tasks = new Map(prev.tasks);
            newState.tasks.set(event.task_name, {
              name: event.task_name,
              description: event.task_desc,
              status: 'running',
            });
          } else {
            newState.tasks = new Map(prev.tasks);
            const task = newState.tasks.get(event.task_name);
            if (task) {
              newState.tasks.set(event.task_name, {
                ...task,
                status: 'complete',
              });
            }
          }
          break;

        case 'tool': {
          // Find the most recent running agent to attach this tool to
          const runningAgents = Array.from(prev.agents.entries())
            .filter(([, a]) => a.status === 'running');
          
          if (runningAgents.length > 0) {
            const [agentRole, agent] = runningAgents[runningAgents.length - 1];
            newState.agents = new Map(prev.agents);
            
            if (event.action === 'start') {
              const newTool: ToolState = {
                id: event.id,
                name: event.tool_name,
                status: 'running',
              };
              newState.agents.set(agentRole, {
                ...agent,
                tools: [...agent.tools, newTool],
              });
            } else {
              const updatedTools = agent.tools.map(t => 
                t.name === event.tool_name && t.status === 'running'
                  ? { ...t, status: 'complete' as const, output: event.tool_output }
                  : t
              );
              newState.agents.set(agentRole, {
                ...agent,
                tools: updatedTools,
              });
            }
          }
          break;
        }

        case 'llm': {
          const runningAgents = Array.from(prev.agents.entries())
            .filter(([, a]) => a.status === 'running');
          
          if (runningAgents.length > 0) {
            const [agentRole, agent] = runningAgents[runningAgents.length - 1];
            newState.agents = new Map(prev.agents);
            
            if (event.action === 'start') {
              const newLLM: LLMState = {
                id: event.id,
                model: event.model,
                status: 'running',
              };
              newState.agents.set(agentRole, {
                ...agent,
                llmCalls: [...agent.llmCalls, newLLM],
              });
            } else {
              const updatedLLMs = agent.llmCalls.map(l => 
                l.model === event.model && l.status === 'running'
                  ? { ...l, status: 'complete' as const, response: event.response }
                  : l
              );
              newState.agents.set(agentRole, {
                ...agent,
                llmCalls: updatedLLMs,
              });
            }
          }
          break;
        }

        case 'memory':
        case 'memory_save':
        case 'knowledge':
        case 'reasoning': {
          if (event.action === 'start') {
            const auxEvent: AuxiliaryEvent = {
              id: event.id,
              type: event.type,
              status: 'running',
              agentRole: event.type === 'reasoning' ? event.agent_role : undefined,
            };
            newState.auxiliaryEvents = [...prev.auxiliaryEvents, auxEvent];
          } else {
            newState.auxiliaryEvents = prev.auxiliaryEvents.map(ae => 
              ae.type === event.type && ae.status === 'running'
                ? { 
                    ...ae, 
                    status: 'complete' as const,
                    content: event.type === 'reasoning' ? event.reasoning ?? undefined : undefined,
                  }
                : ae
            );
          }
          break;
        }
      }

      return newState;
    });
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(eventSourceUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true }));
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        processEvent(data);
      } catch (e) {
        console.error('Failed to parse event:', e);
      }
    };

    es.onerror = () => {
      setState(prev => ({ ...prev, isConnected: false }));
    };
  }, [eventSourceUrl, processEvent]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const reset = useCallback(() => {
    disconnect();
    setState(createInitialState());
    eventIdCounter.current = 0;
  }, [disconnect]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
    reset,
  };
}
