export type SSEEventType = 
  | 'crew' 
  | 'agent' 
  | 'task' 
  | 'tool' 
  | 'knowledge' 
  | 'llm' 
  | 'memory'
  | 'memory_save'
  | 'reasoning'
  | 'sql_execution';

export type SSEEventAction = 'start' | 'complete';

export interface SSEEventPayload {
  type: SSEEventType | string;
  action: SSEEventAction;
  crew_name?: string;
  agent_role?: string;
  agent_goal?: string;
  task_name?: string;
  task_desc?: string;
  tool_name?: string;
  tool_output?: string;
  model?: string;
  response?: string;
  query?: string;
}

export interface ActiveEvent {
  id: string;
  type: SSEEventType | string;
  name: string;
  startTime: number;
  isComplete: boolean;
  details?: string;
}
