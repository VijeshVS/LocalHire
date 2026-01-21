import { useEffect, useRef } from "react";
import { Terminal, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id: string;
  type: "info" | "success" | "error" | "loading";
  message: string;
  timestamp: Date;
}

interface TerminalOutputProps {
  logs: LogEntry[];
  isProcessing: boolean;
}

const TerminalOutput = ({ logs, isProcessing }: TerminalOutputProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "loading":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <span className="w-4 h-4 text-muted-foreground">›</span>;
    }
  };

  const getTextColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-success";
      case "error":
        return "text-destructive";
      case "loading":
        return "text-primary";
      default:
        return "text-terminal-text";
    }
  };

  return (
    <div className="terminal-output rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border bg-secondary/30">
        <Terminal className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Output</span>
        {isProcessing && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-xs text-muted-foreground">Processing...</span>
          </div>
        )}
      </div>
      
      <div
        ref={scrollRef}
        className="p-4 h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Terminal className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Waiting for input...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-3 font-mono text-sm animate-fade-in",
                  getTextColor(log.type)
                )}
              >
                <span className="text-muted-foreground/60 shrink-0">
                  [{formatTime(log.timestamp)}]
                </span>
                <span className="shrink-0">{getIcon(log.type)}</span>
                <span className="whitespace-pre-wrap break-words">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
