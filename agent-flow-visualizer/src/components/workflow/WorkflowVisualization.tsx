import { Users, Bot, ListTodo, Wrench, Sparkles, Brain, Database, BookOpen, Lightbulb } from 'lucide-react';
import type { WorkflowState } from '@/types/workflow';
import { StatusIndicator } from './StatusIndicator';
import { ViewContentButton } from './ViewContentButton';

interface WorkflowVisualizationProps {
  state: WorkflowState;
}

export function WorkflowVisualization({ state }: WorkflowVisualizationProps) {
  const tasks = Array.from(state.tasks.values());
  const agents = Array.from(state.agents.values());

  return (
    <div className="space-y-4">
      {/* Crew Header */}
      {state.crew && (
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Users className="w-4 h-4 text-crew" />
          <span className="text-sm font-bold text-crew uppercase tracking-wide">{state.crew.name}</span>
          <StatusIndicator status={state.crew.status} />
        </div>
      )}

      {/* Horizontal Hierarchy Flow */}
      <div className="flex gap-6 overflow-x-auto pb-2">
        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="flex-shrink-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tasks</div>
            <div className="flex flex-col gap-1">
              {tasks.map(task => (
                <div 
                  key={task.name} 
                  className="flex items-center gap-2 px-2 py-1.5 bg-card border border-task/30 rounded text-xs"
                >
                  <ListTodo className="w-3 h-3 text-task" />
                  <span className="text-task font-medium">{task.name}</span>
                  <StatusIndicator status={task.status} size="sm" />
                  <ViewContentButton 
                    title={`Task: ${task.name}`}
                    content={task.description ? `Name: ${task.name}\n\nDescription: ${task.description}` : undefined}
                    variant="task"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connector */}
        {tasks.length > 0 && agents.length > 0 && (
          <div className="flex items-center flex-shrink-0">
            <div className="w-6 h-px bg-primary/40" />
            <div className="w-0 h-0 border-l-4 border-l-primary/40 border-y-4 border-y-transparent" />
          </div>
        )}

        {/* Agents */}
        {agents.length > 0 && (
          <div className="flex-shrink-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Agents</div>
            <div className="flex flex-col gap-1">
              {agents.map(agent => (
                <div 
                  key={agent.role} 
                  className="flex items-center gap-2 px-2 py-1.5 bg-card border border-agent/30 rounded text-xs"
                >
                  <Bot className="w-3 h-3 text-agent" />
                  <span className="text-agent font-medium">{agent.role}</span>
                  <StatusIndicator status={agent.status} size="sm" />
                  <ViewContentButton 
                    title={`Agent: ${agent.role}`}
                    content={agent.goal ? `Role: ${agent.role}\n\nGoal: ${agent.goal}` : undefined}
                    variant="agent"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connector */}
        {agents.length > 0 && (agents.some(a => a.tools.length > 0) || agents.some(a => a.llmCalls.length > 0)) && (
          <div className="flex items-center flex-shrink-0">
            <div className="w-6 h-px bg-primary/40" />
            <div className="w-0 h-0 border-l-4 border-l-primary/40 border-y-4 border-y-transparent" />
          </div>
        )}

        {/* Tools */}
        {agents.some(a => a.tools.length > 0) && (
          <div className="flex-shrink-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tools</div>
            <div className="flex flex-col gap-1">
              {agents.flatMap(agent => 
                agent.tools.map(tool => (
                  <div 
                    key={tool.id} 
                    className="flex items-center gap-2 px-2 py-1.5 bg-card border border-tool/30 rounded text-xs"
                  >
                    <Wrench className="w-3 h-3 text-tool" />
                    <span className="text-tool font-medium">{tool.name}</span>
                    <StatusIndicator status={tool.status} size="sm" />
                    <ViewContentButton 
                      title={`Tool: ${tool.name}`}
                      content={tool.output ? `Tool: ${tool.name}\n\nOutput: ${tool.output}` : undefined}
                      variant="tool"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* LLM Calls */}
        {agents.some(a => a.llmCalls.length > 0) && (
          <div className="flex-shrink-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">LLM</div>
            <div className="flex flex-col gap-1">
              {agents.flatMap(agent => 
                agent.llmCalls.map(llm => (
                  <div 
                    key={llm.id} 
                    className="flex items-center gap-2 px-2 py-1.5 bg-card border border-llm/30 rounded text-xs"
                  >
                    <Sparkles className="w-3 h-3 text-llm" />
                    <span className="text-llm font-medium">{llm.model}</span>
                    <StatusIndicator status={llm.status} size="sm" />
                    <ViewContentButton 
                      title={`LLM: ${llm.model}`}
                      content={llm.response ? `Model: ${llm.model}\n\nResponse: ${llm.response}` : undefined}
                      variant="llm"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auxiliary Events - Flat Row */}
      {state.auxiliaryEvents.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">System</div>
          <div className="flex flex-wrap gap-2">
            {state.auxiliaryEvents.map(event => {
              const config = {
                memory: { icon: Brain, label: 'Memory' },
                memory_save: { icon: Database, label: 'Memory Save' },
                knowledge: { icon: BookOpen, label: 'Knowledge' },
                reasoning: { icon: Lightbulb, label: 'Reasoning' },
              }[event.type];
              const Icon = config.icon;
              
              return (
                <div 
                  key={event.id} 
                  className="flex items-center gap-2 px-2 py-1 bg-card border border-primary/20 rounded text-xs"
                >
                  <Icon className="w-3 h-3 text-primary" />
                  <span className="text-primary/80 font-medium">{config.label}</span>
                  <StatusIndicator status={event.status} size="sm" />
                  <ViewContentButton 
                    title={config.label}
                    content={event.content ? `${config.label}\n\n${event.agentRole ? `Agent: ${event.agentRole}\n\n` : ''}Content: ${event.content}` : undefined}
                    variant="crew"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
