
'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { OfferingBooking, Donation } from '@/lib/types';

interface DeleteDialogProps {
  item: OfferingBooking | Donation;
  type: 'booking' | 'donation';
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (item: OfferingBooking | Donation, type: 'booking' | 'donation') => void;
}

export function DeleteConfirmationDialog({ item, type, isOpen, onClose, onConfirmDelete }: DeleteDialogProps) {
  
  const handleConfirm = () => {
    onConfirmDelete(item, type);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the record for{' '}
            <span className="font-bold">{item.userName}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
