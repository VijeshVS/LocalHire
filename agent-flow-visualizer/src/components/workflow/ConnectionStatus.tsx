import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onReset: () => void;
}

export function ConnectionStatus({ isConnected, onConnect, onDisconnect, onReset }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
      >
        <RefreshCw className="w-3 h-3" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={isConnected ? onDisconnect : onConnect}
        className={`h-7 text-xs ${isConnected ? 'border-primary/50 text-primary' : 'border-muted-foreground text-muted-foreground'}`}
      >
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 mr-1" />
            Connected
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 mr-1" />
            Connect
          </>
        )}
      </Button>
    </div>
  );
}
