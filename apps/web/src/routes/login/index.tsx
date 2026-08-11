import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@danta/ui';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/login/')({
  component: LoginPage,
});

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        window.location.href = '/dashboard';
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6 border rounded-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Danta</h1>
          <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor={field.name}>Email</label>
                <input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md text-sm',
                    field.state.meta.errors.length > 0 && 'border-red-500'
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          />
          <form.Field
            name="password"
            children={(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor={field.name}>Password</label>
                <input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md text-sm',
                    field.state.meta.errors.length > 0 && 'border-red-500'
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
