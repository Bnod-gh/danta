import { Moon, Sun } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { useTheme } from '../../lib/theme-provider';

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
