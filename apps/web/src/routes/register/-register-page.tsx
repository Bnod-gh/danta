import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { User, Lock, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { useAuth } from '../../lib/auth-context';
import { RegisterSchema } from '@danta/schemas';
import { cn } from '@danta/ui/utils';

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { register } = useAuth();

  const inviteToken = useMemo(() => new URLSearchParams(window.location.search).get('inviteToken') || '', []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const firstNameResult = RegisterSchema.shape.firstName.safeParse(firstName);
    if (!firstNameResult.success) newErrors.firstName = 'First name is required';

    const lastNameResult = RegisterSchema.shape.lastName.safeParse(lastName);
    if (!lastNameResult.success) newErrors.lastName = 'Last name is required';

    const emailResult = RegisterSchema.shape.email.safeParse(email);
    if (!emailResult.success) newErrors.email = 'Please enter a valid email address';

    const passwordResult = RegisterSchema.shape.password.safeParse(password);
    if (!passwordResult.success) newErrors.password = 'Password must be at least 12 characters';

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!inviteToken) {
      newErrors.inviteToken = 'Invitation token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGeneralError(null);
    try {
      await register({ email, password, firstName, lastName, inviteToken });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">D</div>
            <span className="text-2xl font-semibold">Danta</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Get started</h1>
            <p className="text-muted-foreground">Create your dental practice workspace in minutes.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">D</div>
              <span className="text-xl font-semibold">Danta</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground">Set up your practice workspace</p>
          </div>

          {generalError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors(prev => ({ ...prev, firstName: '' }));
                    }}
                    className={cn('pl-9', errors.firstName && 'border-destructive')}
                    disabled={loading}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErrors(prev => ({ ...prev, lastName: '' }));
                  }}
                  className={cn(errors.lastName && 'border-destructive')}
                  disabled={loading}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@practice.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={cn('pl-9', errors.email && 'border-destructive')}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 12 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={cn('pl-9', errors.password && 'border-destructive')}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  className={cn('pl-9', errors.confirmPassword && 'border-destructive')}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteToken">Invitation token</Label>
              <Input
                id="inviteToken"
                type="text"
                value={inviteToken}
                onChange={() => {
                  setErrors(prev => ({ ...prev, inviteToken: '' }));
                }}
                className={cn(errors.inviteToken && 'border-destructive')}
                disabled={loading}
                readOnly
              />
              {errors.inviteToken && <p className="text-xs text-destructive">{errors.inviteToken}</p>}
            </div>

            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              {loading ? 'Creating account...' : (
                <span className="flex items-center gap-2">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
