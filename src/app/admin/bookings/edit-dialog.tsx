'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { doc, setDoc, deleteField } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { OfferingBooking, Donation } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditDialogProps {
  item: OfferingBooking | Donation;
  type: 'booking' | 'donation';
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch(e) {
      return dateString;
    }
};

// We create a separate component for the form content
// to manage its state internally.
function EditFormContent({ item, type, onClose, onSave }: Omit<EditDialogProps, 'isOpen'>) {
  const [paymentStatus, setPaymentStatus] = useState(item.paymentStatus || 'Pending');
  const [paymentDate, setPaymentDate] = useState<string>(
    item.paymentDate ? new Date(item.paymentDate).toISOString().split('T')[0] : ''
  );
  const [receiptNo, setReceiptNo] = useState(item.receiptNo || '');
  const [remarks, setRemarks] = useState(item.remarks || '');

  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSave = () => {
    if (!firestore || !item.id) return;
    
    const collectionName = type === 'booking' ? 'offeringBookings' : 'donations';
    const docRef = doc(firestore, collectionName, item.id);

    const dataToUpdate: Partial<OfferingBooking | Donation> & { paymentDate?: string | ReturnType<typeof deleteField> } = {
      paymentStatus,
      receiptNo,
      remarks,
    };

    if (paymentStatus === 'Paid') {
      if (!receiptNo) {
         toast({
          variant: 'destructive',
          title: 'Missing Receipt No.',
          description: 'Please enter a receipt number when status is "Paid".',
        });
        return;
      }
      if (!paymentDate) {
         toast({
          variant: 'destructive',
          title: 'Missing Date',
          description: 'Please select a payment date when status is "Paid".',
        });
        return;
      }
      dataToUpdate.paymentDate = new Date(paymentDate).toISOString();
    } else {
      // If status is Pending, we remove the paymentDate field
      dataToUpdate.paymentDate = deleteField();
    }

    setDoc(docRef, dataToUpdate, { merge: true })
      .then(() => {
          toast({
            title: 'Success',
            description: 'The record has been updated.',
          });
          onSave?.();
          onClose();
          window.location.reload();
      })
      .catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext, serverError);
        
        errorEmitter.emit('permission-error', permissionError);
        
        toast({
          variant: 'destructive',
          title: 'Error Saving',
          description: "You don't have permission to perform this action.",
        });
      });
  };
  
  const isBooking = (item: any): item is OfferingBooking => type === 'booking';
  const receiptSentDate = item.receiptSentAt ? new Date(item.receiptSentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', hour12: true }) : null;


  return (
    <>
        <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-4 p-6">
                <h4 className="text-sm font-semibold text-muted-foreground">User Details</h4>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right col-span-1">Name</Label>
                    <p className="col-span-3 font-medium">{item.userName}</p>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right col-span-1">Email</Label>
                    <p className="col-span-3">{item.userEmail}</p>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right col-span-1">Phone</Label>
                    <p className="col-span-3">{item.phone || '-'}</p>
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right col-span-1 pt-1">Address</Label>
                    <p className="col-span-3 whitespace-pre-wrap">{item.address || '-'}</p>
                </div>

                <Separator className="my-2" />
                <h4 className="text-sm font-semibold text-muted-foreground">{isBooking(item) ? 'Booking Details' : 'Donation Details'}</h4>

                {isBooking(item) && (
                  <>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Offering</Label>
                        <p className="col-span-3">{item.offeringNameEn}</p>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Price</Label>
                        <p className="col-span-3">₹{item.price.toFixed(2)}</p>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Star</Label>
                        <p className="col-span-3">{item.star}</p>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Date</Label>
                        <p className="col-span-3">{formatDate(item.bookingDate)}</p>
                    </div>
                  </>
                )}
                 {!isBooking(item) && 'amount' in item && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Amount</Label>
                        <p className="col-span-3">₹{item.amount.toFixed(2)}</p>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Purpose</Label>
                        <p className="col-span-3">{item.purpose || '-'}</p>
                    </div>
                  </>
                )}

                <Separator className="my-2" />
                <h4 className="text-sm font-semibold text-muted-foreground">Admin Section</h4>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment-status" className="text-right col-span-1">Payment</Label>
                    <Select value={paymentStatus} onValueChange={(value: 'Paid' | 'Pending') => setPaymentStatus(value)}>
                        <SelectTrigger className="col-span-3" id="payment-status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {paymentStatus === 'Paid' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="receiptNo" className="text-right col-span-1">
                          Receipt No.<span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="receiptNo"
                          value={receiptNo}
                          onChange={(e) => setReceiptNo(e.target.value)}
                          className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment-date" className="text-right col-span-1">
                          Payment Date<span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="payment-date"
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="col-span-3"
                        />
                    </div>
                  </>
                )}

                {receiptSentDate && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right col-span-1">Receipt Sent</Label>
                        <p className="col-span-3 text-sm text-muted-foreground">{receiptSentDate}</p>
                    </div>
                )}

                <div className="grid grid-cols-4 items-start gap-4">
                     <Label htmlFor="remarks" className="text-right col-span-1 pt-1">Remarks</Label>
                     <Textarea 
                        id="remarks" 
                        value={remarks} 
                        onChange={(e) => setRemarks(e.target.value)}
                        className="col-span-3"
                        placeholder="Add any internal notes..."
                     />
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
    </>
  )
}


export function EditBookingDonationDialog({ item, type, isOpen, onClose, onSave }: EditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>View {type === 'booking' ? 'Offering Booking' : 'Donation'}</DialogTitle>
          <DialogDescription>
            View user-submitted details and update payment status for this entry.
          </DialogDescription>
        </DialogHeader>
         {/* By moving the form to a child component, its state is preserved
             across re-renders of the parent Dialog. The key ensures
             that if we open the dialog for a *different* item, the form
             state is reset correctly. */}
        {item && (
          <EditFormContent
            key={item.id}
            item={item}
            type={type}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
