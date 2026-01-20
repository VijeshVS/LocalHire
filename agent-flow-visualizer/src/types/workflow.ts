export type EventType = 
  | 'crew' 
  | 'agent' 
  | 'task' 
  | 'tool' 
  | 'llm' 
  | 'memory' 
  | 'memory_save' 
  | 'knowledge' 
  | 'reasoning';

export type EventAction = 'start' | 'complete';

export interface BaseEvent {
  id: string;
  type: EventType;
  action: EventAction;
  timestamp: Date;
}

export interface CrewEvent extends BaseEvent {
  type: 'crew';
  crew_name: string;
}

export interface AgentEvent extends BaseEvent {
  type: 'agent';
  agent_role: string;
  agent_goal?: string;
}

export interface TaskEvent extends BaseEvent {
  type: 'task';
  task_name: string;
  task_desc?: string;
}

export interface ToolEvent extends BaseEvent {
  type: 'tool';
  tool_name: string;
  tool_output?: string;
}

export interface LLMEvent extends BaseEvent {
  type: 'llm';
  model: string;
  response?: string;
}

export interface MemoryEvent extends BaseEvent {
  type: 'memory' | 'memory_save';
}

export interface KnowledgeEvent extends BaseEvent {
  type: 'knowledge';
}

export interface ReasoningEvent extends BaseEvent {
  type: 'reasoning';
  agent_role?: string | null;
  reasoning?: string | null;
}

export type WorkflowEvent = 
  | CrewEvent 
  | AgentEvent 
  | TaskEvent 
  | ToolEvent 
  | LLMEvent 
  | MemoryEvent 
  | KnowledgeEvent 
  | ReasoningEvent;

export interface WorkflowState {
  isConnected: boolean;
  isComplete: boolean;
  crew: {
    name: string;
    status: 'idle' | 'running' | 'complete';
    startTime?: Date;
    endTime?: Date;
  } | null;
  agents: Map<string, {
    role: string;
    goal?: string;
    status: 'idle' | 'running' | 'complete';
    tools: ToolState[];
    llmCalls: LLMState[];
  }>;
  tasks: Map<string, {
    name: string;
    description?: string;
    status: 'idle' | 'running' | 'complete';
  }>;
  auxiliaryEvents: AuxiliaryEvent[];
  allEvents: WorkflowEvent[];
}

export interface ToolState {
  id: string;
  name: string;
  status: 'running' | 'complete';
  output?: string;
}

export interface LLMState {
  id: string;
  model: string;
  status: 'running' | 'complete';
  response?: string;
}

export interface AuxiliaryEvent {
  id: string;
  type: 'memory' | 'memory_save' | 'knowledge' | 'reasoning';
  status: 'running' | 'complete';
  content?: string;
  agentRole?: string | null;
}
