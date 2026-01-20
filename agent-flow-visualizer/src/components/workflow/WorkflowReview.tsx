import { useState } from 'react';
import { CheckCircle2, Clock, Users, Bot, ListTodo, Wrench, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ViewContentButton } from './ViewContentButton';
import type { WorkflowState } from '@/types/workflow';

interface WorkflowReviewProps {
  isOpen: boolean;
  onClose: () => void;
  state: WorkflowState;
}

export function WorkflowReview({ isOpen, onClose, state }: WorkflowReviewProps) {
  const tasks = Array.from(state.tasks.values());
  const agents = Array.from(state.agents.values());
  const totalTools = agents.reduce((sum, a) => sum + a.tools.length, 0);
  const totalLLMCalls = agents.reduce((sum, a) => sum + a.llmCalls.length, 0);

  const getDuration = () => {
    if (state.crew?.startTime && state.crew?.endTime) {
      const ms = state.crew.endTime.getTime() - state.crew.startTime.getTime();
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      }
      return `${seconds}s`;
    }
    return 'N/A';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Workflow Complete: {state.crew?.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-1">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-2">
              <StatBox icon={Clock} value={getDuration()} label="Duration" />
              <StatBox icon={ListTodo} value={tasks.length} label="Tasks" />
              <StatBox icon={Bot} value={agents.length} label="Agents" />
              <StatBox icon={Wrench} value={totalTools} label="Tools" />
            </div>

            {/* Tasks */}
            {tasks.length > 0 && (
              <CollapsibleSection title="Tasks" icon={ListTodo} count={tasks.length}>
                <div className="space-y-1">
                  {tasks.map(task => (
                    <div key={task.name} className="flex items-center justify-between px-2 py-1.5 bg-background rounded text-xs">
                      <span className="text-foreground">{task.name}</span>
                      <ViewContentButton 
                        title={`Task: ${task.name}`}
                        content={`Name: ${task.name}\n\nDescription: ${task.description || 'N/A'}`}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Agents */}
            {agents.length > 0 && (
              <CollapsibleSection title="Agents" icon={Bot} count={agents.length}>
                <div className="space-y-1">
                  {agents.map(agent => (
                    <div key={agent.role} className="flex items-center justify-between px-2 py-1.5 bg-background rounded text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{agent.role}</span>
                        {agent.tools.length > 0 && (
                          <span className="text-muted-foreground">({agent.tools.length} tools)</span>
                        )}
                      </div>
                      <ViewContentButton 
                        title={`Agent: ${agent.role}`}
                        content={`Role: ${agent.role}\n\nGoal: ${agent.goal || 'N/A'}`}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Tools */}
            {totalTools > 0 && (
              <CollapsibleSection title="Tool Calls" icon={Wrench} count={totalTools}>
                <div className="space-y-1">
                  {agents.flatMap(agent => 
                    agent.tools.map(tool => (
                      <div key={tool.id} className="flex items-center justify-between px-2 py-1.5 bg-background rounded text-xs">
                        <span className="text-foreground">{tool.name}</span>
                        <ViewContentButton 
                          title={`Tool: ${tool.name}`}
                          content={tool.output ? `Tool: ${tool.name}\n\nOutput: ${tool.output}` : undefined}
                        />
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* LLM Calls */}
            {totalLLMCalls > 0 && (
              <CollapsibleSection title="LLM Calls" icon={Sparkles} count={totalLLMCalls}>
                <div className="space-y-1">
                  {agents.flatMap(agent => 
                    agent.llmCalls.map(llm => (
                      <div key={llm.id} className="flex items-center justify-between px-2 py-1.5 bg-background rounded text-xs">
                        <span className="text-foreground">{llm.model}</span>
                        <ViewContentButton 
                          title={`LLM: ${llm.model}`}
                          content={llm.response ? `Model: ${llm.model}\n\nResponse: ${llm.response}` : undefined}
                        />
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* System Events */}
            {state.auxiliaryEvents.length > 0 && (
              <CollapsibleSection title="System Events" count={state.auxiliaryEvents.length}>
                <div className="flex flex-wrap gap-1">
                  {state.auxiliaryEvents.map(event => (
                    <span 
                      key={event.id}
                      className="px-2 py-0.5 bg-background text-muted-foreground text-xs rounded capitalize"
                    >
                      {event.type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>, value: string | number, label: string }) {
  return (
    <div className="bg-background rounded border border-border p-2 text-center">
      <Icon className="w-3 h-3 text-primary mx-auto mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function CollapsibleSection({ 
  title, 
  icon: Icon, 
  count, 
  children 
}: { 
  title: string; 
  icon?: React.ComponentType<{ className?: string }>; 
  count: number; 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 bg-secondary/50 rounded text-xs hover:bg-secondary transition-colors">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3 h-3 text-primary" />}
          <span className="text-foreground font-medium">{title}</span>
          <span className="text-muted-foreground">({count})</span>
        </div>
        {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 pl-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
