import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewContentButtonProps {
  title: string;
  content?: string;
  variant?: string;
}

export function ViewContentButton({ title, content }: ViewContentButtonProps) {
  if (!content) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0 text-primary/60 hover:text-primary hover:bg-primary/10"
        >
          <Eye className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary text-sm uppercase tracking-wider">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono bg-background p-4 rounded border border-border">
            {content}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
