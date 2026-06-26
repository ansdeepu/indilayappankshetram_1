'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Briefcase, UserPlus, Key, Info } from 'lucide-react';

interface LoginDialogProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type TabType = 'signin' | 'register';

export function LoginDialog({ children, isOpen, onOpenChange }: LoginDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: 'You are now signed in.',
      });
      onOpenChange(false); // Close the dialog on successful login
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Check your credentials and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'Password should be at least 6 characters long.',
      });
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created and you are now signed in.',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration.',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setActiveTab('signin');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline text-center">
            {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Access financial records, logging, and bookings.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'signin'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              setActiveTab('signin');
              setEmail('');
              setPassword('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              setActiveTab('register');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            Register (Devotee)
          </button>
        </div>

        {activeTab === 'signin' ? (
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reg-email">Email Address</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-password">Password (min 6 chars)</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-2 animate-pulse" disabled={loading}>
              {loading ? 'Registering...' : 'Register & Log In'}
            </Button>
          </form>
        )}

        {/* Quick Demo Credentials Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-2">
            <Info className="h-3.5 w-3.5" />
            <span>Demo Credentials / Test Accounts:</span>
          </div>
          <div className="grid gap-2 text-xs">
            {/* Admin */}
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/60 border border-border">
              <div className="flex flex-col">
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <Shield className="h-3 w-3 text-red-500" /> Temple Admin
                </span>
                <span className="text-muted-foreground select-all">indilayappankshetram@gmail.com</span>
                <span className="text-muted-foreground">Password: 123456</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={() => quickFill('indilayappankshetram@gmail.com')}
              >
                Auto Fill
              </Button>
            </div>

            {/* Manager */}
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/60 border border-border">
              <div className="flex flex-col">
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <Briefcase className="h-3 w-3 text-blue-500" /> Temple Manager
                </span>
                <span className="text-muted-foreground select-all">templemanager@gmail.com</span>
                <span className="text-muted-foreground">Password: 123456</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={() => quickFill('templemanager@gmail.com')}
              >
                Auto Fill
              </Button>
            </div>

            {/* Devotee */}
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/60 border border-border">
              <div className="flex flex-col">
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <User className="h-3 w-3 text-green-500" /> Standard Devotee
                </span>
                <span className="text-muted-foreground select-all">devotee@gmail.com</span>
                <span className="text-muted-foreground">Password: 123456</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={() => quickFill('devotee@gmail.com')}
              >
                Auto Fill
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
