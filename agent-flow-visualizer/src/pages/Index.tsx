import { useState, useEffect } from 'react';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { ConnectionStatus } from '@/components/workflow/ConnectionStatus';
import { WorkflowVisualization } from '@/components/workflow/WorkflowVisualization';
import { WorkflowReview } from '@/components/workflow/WorkflowReview';
import { EmptyState } from '@/components/workflow/EmptyState';
import { Button } from '@/components/ui/button';
import { Eye, Workflow } from 'lucide-react';

const EVENT_SOURCE_URL = 'http://localhost:8000/events';

const Index = () => {
  const { state, connect, disconnect, reset } = useWorkflowEvents(EVENT_SOURCE_URL);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (state.isComplete && state.crew?.status === 'complete') {
      setShowReview(true);
    }
  }, [state.isComplete, state.crew?.status]);

  const hasWorkflow = state.crew !== null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" />
              <h1 className="text-sm font-bold text-primary uppercase tracking-wider">Workflow Monitor</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {state.isComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReview(true)}
                  className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Review
                </Button>
              )}
              <ConnectionStatus
                isConnected={state.isConnected}
                onConnect={connect}
                onDisconnect={disconnect}
                onReset={reset}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="retro-bg rounded border border-border p-4 min-h-[calc(100vh-120px)]">
          {hasWorkflow ? (
            <WorkflowVisualization state={state} />
          ) : (
            <EmptyState isConnected={state.isConnected} onConnect={connect} />
          )}
        </div>
      </main>

      <WorkflowReview
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        state={state}
      />
    </div>
  );
};

export default Index;
