import { 
  Users,
  Brain,
  ListTodo,
  Wrench,
  BookOpen,
  Cpu,
  Database,
  CheckCircle2,
  Clock,
  FileText,
  ChevronDown,
  Lightbulb,
  Search
} from 'lucide-react';
import { ActiveEvent, SSEEventType } from '../types/sseEvents';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface WorkflowReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: ActiveEvent[];
}

const getEventIcon = (type: SSEEventType) => {
  switch (type) {
    case 'crew':
      return Users;
    case 'agent':
      return Brain;
    case 'task':
      return ListTodo;
    case 'tool':
      return Wrench;
    case 'knowledge':
      return BookOpen;
    case 'llm':
      return Cpu;
    case 'memory':
      return Database;
    case 'memory_save':
      return Database;
    case 'reasoning':
      return Lightbulb;
    case 'sql_execution':
      return Search;
    default:
      return FileText;
  }
};

const getEventColor = (type: SSEEventType) => {
  switch (type) {
    case 'crew':
      return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' };
    case 'task':
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' };
    case 'agent':
      return { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/30' };
    case 'memory':
      return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' };
    case 'memory_save':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30' };
    case 'knowledge':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' };
    case 'reasoning':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' };
    case 'sql_execution':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/30' };
    case 'llm':
      return { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30' };
    case 'tool':
      return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
  }
};

const getEventLabel = (type: SSEEventType): string => {
  switch (type) {
    case 'crew':
      return 'Crew';
    case 'agent':
      return 'Agent';
    case 'task':
      return 'Task';
    case 'tool':
      return 'Tool';
    case 'knowledge':
      return 'Knowledge';
    case 'reasoning':
      return 'Reasoning';
    case 'sql_execution':
      return 'SQL Execution';
    case 'llm':
      return 'LLM';
    case 'memory':
      return 'Memory';
    case 'memory_save':
      return 'Memory Save';
    default:
      return 'Event';
  }
};

const getDetailLabel = (type: SSEEventType): string => {
  switch (type) {
    case 'agent':
      return 'Goal';
    case 'task':
      return 'Description';
    case 'tool':
      return 'Output';
    case 'llm':
      return 'Response';
    case 'sql_execution':
      return 'Query';
    default:
      return 'Details';
  }
};

const formatDetails = (details: string): React.ReactNode => {
  // Try to parse as JSON for better formatting
  try {
    const parsed = JSON.parse(details);
    return (
      <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    // Not JSON, display as text with proper formatting
    return (
      <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
        {details}
      </p>
    );
  }
};

export function WorkflowReviewModal({ open, onOpenChange, events }: WorkflowReviewModalProps) {
  // Group events by type for summary
  const eventsByType = events.reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = [];
    }
    acc[event.type].push(event);
    return acc;
  }, {} as Record<SSEEventType, ActiveEvent[]>);

  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.isComplete).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl min-h-[80vh] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Workflow Execution Review</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Complete execution timeline and details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{totalEvents} events</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600">{completedEvents} completed</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 pb-4 shrink-0">
          {Object.entries(eventsByType).map(([type, typeEvents]) => {
            const colors = getEventColor(type as SSEEventType);
            const Icon = getEventIcon(type as SSEEventType);
            return (
              <div
                key={type}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                  colors.bg,
                  colors.border
                )}
              >
                <Icon className={cn("w-4 h-4", colors.text)} />
                <span className={cn("text-sm font-medium", colors.text)}>
                  {getEventLabel(type as SSEEventType)}
                </span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full bg-background/50", colors.text)}>
                  {typeEvents.length}
                </span>
              </div>
            );
          })}
        </div>

        <Separator className="shrink-0" />

        {/* Events timeline */}
        <div className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-[60vh] overflow-y-auto">
            <div className="space-y-4 pr-4">
            {events.map((event, index) => {
              const Icon = getEventIcon(event.type);
              const colors = getEventColor(event.type);
              
              return (
                <div key={event.id} className="relative">
                  {/* Timeline connector */}
                  {index < events.length - 1 && (
                    <div className="absolute left-5 top-12 w-0.5 h-[calc(100%-24px)] bg-border" />
                  )}
                  
                  <div className={cn(
                    "rounded-xl border p-4 transition-all",
                    colors.bg,
                    colors.border
                  )}>
                    {/* Event header */}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        event.isComplete ? "bg-emerald-500/10" : colors.bg
                      )}>
                        {event.isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Icon className={cn("w-5 h-5", colors.text)} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                            colors.bg,
                            colors.text
                          )}>
                            {getEventLabel(event.type)}
                          </span>
                          <h4 className="font-semibold text-foreground">{event.name}</h4>
                          {event.isComplete && (
                            <span className="text-xs text-emerald-500 font-medium">✓ Complete</span>
                          )}
                        </div>
                        
                        {/* Event details - Collapsible */}
                        {event.details && (
                          <Collapsible className="mt-3">
                            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group w-full">
                              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              <span>{getDetailLabel(event.type)}</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="bg-background/80 rounded-lg p-3 border border-border/50">
                                {formatDetails(event.details)}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground shrink-0">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  </div>
              );
            })}
          </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
