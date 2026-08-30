import { Button } from '@danta/ui/button';
import { LogIn } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <LogIn className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-3xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Please log in to access this page.
        </p>
        <Button asChild>
          <a href="/login">Sign In</a>
        </Button>
      </div>
    </div>
  );
}
