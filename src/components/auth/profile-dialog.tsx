'use client';

import { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { User, Key, Shield, Briefcase, Lock, Sparkles } from 'lucide-react';

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { user, isAdmin, isManager } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <Shield className="h-3.5 w-3.5" />
          Temple Admin
        </span>
      );
    }
    if (isManager) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <Briefcase className="h-3.5 w-3.5" />
          Temple Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        <User className="h-3.5 w-3.5" />
        Devotee
      </span>
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password must be at least 6 characters.',
      });
      return;
    }

    setLoading(true);

    try {
      // Firebase sometimes requires fresh authentication for security-sensitive actions (like changing password)
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      await updatePassword(auth.currentUser, newPassword);
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      
      // Reset fields and close dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      
      // Handle requires-recent-login or incorrect current password error
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({
          variant: 'destructive',
          title: 'Incorrect Password',
          description: 'The current password you entered is incorrect.',
        });
      } else if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please enter your current password to confirm your identity, or log in again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Updating Password',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            My Profile
          </DialogTitle>
          <DialogDescription>
            View your account details and update your security settings.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Account Details Box */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border flex flex-col gap-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Account Information
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium text-sm text-foreground select-all break-all pr-2">
                {user.email}
              </span>
              {getRoleBadge()}
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 border-b pb-2">
              <Key className="h-4 w-4 text-primary" />
              <span>Change Password</span>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="current-password">
                Current Password <span className="text-xs text-muted-foreground font-normal">(Required if logged in long ago)</span>
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="new-password">New Password (min 6 chars)</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
