import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/patient-portal/login/')({
  component: PatientPortalLoginPage,
});

export function PatientPortalLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      phone: '',
      password: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      tenantId: '',
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isRegister ? '/api/v1/patient-portal/register' : '/api/v1/patient-portal/login';
        const body = isRegister
          ? { ...value, dateOfBirth: new Date(value.dateOfBirth).toISOString() }
          : { email: value.email, phone: value.phone, password: value.password };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || (isRegister ? 'Registration failed' : 'Login failed'));
        }
        const data = await res.json();
        localStorage.setItem('patientAccessToken', data.accessToken);
        localStorage.setItem('patientRefreshToken', data.refreshToken);
        window.location.href = '/patient-portal';
      } catch (err) {
        const message = err instanceof Error ? err.message : (isRegister ? 'Registration failed' : 'Login failed');
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
          <h1 className="text-2xl font-bold">Danta Patient Portal</h1>
          <p className="text-sm text-muted-foreground">{isRegister ? 'Create your patient account' : 'Sign in to your patient portal'}</p>
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
          {isRegister && (
            <>
              <form.Field
                name="firstName"
                children={(field) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={field.name}>First Name</label>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              />
              <form.Field
                name="lastName"
                children={(field) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={field.name}>Last Name</label>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              />
              <form.Field
                name="dateOfBirth"
                children={(field) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={field.name}>Date of Birth</label>
                    <input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              />
              <form.Field
                name="tenantId"
                children={(field) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={field.name}>Practice ID</label>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              />
            </>
          )}
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
                  className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          />
          <form.Field
            name="phone"
            children={(field) => (
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor={field.name}>Phone</label>
                <input
                  id={field.name}
                  type="tel"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
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
                  className={cn('w-full px-3 py-2 border rounded-md text-sm', field.state.meta.errors.length > 0 && 'border-red-500')}
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isRegister ? 'Create Account' : 'Sign in')}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-primary underline"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
