import { useState } from 'react';
import { PlayCircle, StopCircle, RotateCcw, Eye, Activity } from 'lucide-react';
import { useSSEEvents } from './hooks/useSSEEvents';
import { AILoadingOverlay } from './components/AILoadingOverlay';
import { WorkflowReviewModal } from './components/WorkflowReviewModal';
import { Button } from './components/ui/button';

function App() {
  const { events, isConnected, isComplete, connect, disconnect, resetEvents } = useSSEEvents();
  const [showWorkflowReview, setShowWorkflowReview] = useState(false);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      resetEvents();
      connect('');
    }
  };

  const handleReset = () => {
    disconnect();
    resetEvents();
    setShowWorkflowReview(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-border/40 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Agent Execution Viewer</h1>
                <p className="text-sm text-muted-foreground">Real-time AI workflow monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleConnect}
                disabled={isConnected}
                className="gap-2"
                size="sm"
              >
                {isConnected ? (
                  <>
                    <Activity className="w-4 h-4" />
                    Connected
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Connect
                  </>
                )}
              </Button>

              {isConnected && (
                <Button
                  variant="outline"
                  onClick={disconnect}
                  className="gap-2"
                  size="sm"
                >
                  <StopCircle className="w-4 h-4" />
                  Disconnect
                </Button>
              )}

              {events.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWorkflowReview(true)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Agent Execution Visualization */}
          {isConnected && events.length > 0 && (
            <div className="animate-fade-in">
              <AILoadingOverlay 
                events={events}
                isConnected={isConnected}
                onCancel={disconnect}
              />
            </div>
          )}

          {/* Completion Message */}
          {isComplete && events.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-1">Workflow Complete!</h3>
              <p className="text-sm text-emerald-700 mb-4">All agent operations have finished successfully.</p>
              <Button
                variant="outline"
                onClick={() => setShowWorkflowReview(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Review Full Timeline
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isConnected && events.length === 0 && (
            <div className="bg-white/50 border-2 border-dashed border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Monitor</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click "Connect to SSE" to start monitoring your AI agent workflow in real-time.
                Make sure your backend is running on <code className="px-2 py-1 bg-muted rounded text-sm">http://localhost:8000/events</code>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Crew</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Task</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span>Agent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Tool</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>LLM</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Workflow Review Modal */}
      <WorkflowReviewModal
        open={showWorkflowReview}
        onOpenChange={setShowWorkflowReview}
        events={events}
      />
    </div>
  );
}

export default App;
