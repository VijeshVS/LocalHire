import { Workflow, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  isConnected: boolean;
  onConnect: () => void;
}

export function EmptyState({ isConnected, onConnect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Workflow className="w-8 h-8 text-primary/40 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">
        {isConnected ? 'Waiting for workflow events...' : 'Connect to start monitoring'}
      </p>
      {!isConnected && (
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10"
        >
          <Wifi className="w-3 h-3 mr-1" />
          Connect
        </Button>
      )}
    </div>
  );
}
