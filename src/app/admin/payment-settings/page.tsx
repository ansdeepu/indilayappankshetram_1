'use client';

import { useFirestore, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { PaymentDetails } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const defaultPaymentDetails: PaymentDetails = {
    upiId: '',
    qrCodeUrl: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    receiptImageUrl: ''
};

export default function PaymentSettingsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const paymentDetailsRef = useMemo(() => firestore ? doc(firestore, 'content', 'paymentDetails') : null, [firestore]);
  const { data: paymentDetails, loading: detailsLoading } = useDoc<PaymentDetails>(paymentDetailsRef);
  
  const [localDetails, setLocalDetails] = useState<PaymentDetails>(defaultPaymentDetails);

  useEffect(() => {
    if (paymentDetails) {
      setLocalDetails(paymentDetails);
    }
  }, [paymentDetails]);

  const handleDetailsChange = (field: keyof PaymentDetails, value: string) => {
    setLocalDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!paymentDetailsRef) return;
    try {
      await setDoc(paymentDetailsRef, localDetails, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Your payment settings have been successfully updated.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Settings',
        description: error.message,
      });
    }
  };

  const isLoading = detailsLoading;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Payment & Receipt Settings</CardTitle>
          <CardDescription>
            Manage the payment details and receipt configuration for online seva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
           {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="space-y-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Payment Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input id="upiId" value={localDetails.upiId || ''} onChange={e => handleDetailsChange('upiId', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="qrCodeUrl">Payment QR Code Image URL</Label>
                      <Input id="qrCodeUrl" value={localDetails.qrCodeUrl || ''} onChange={e => handleDetailsChange('qrCodeUrl', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accountName">Bank Account Name</Label>
                    <Input id="accountName" value={localDetails.accountName || ''} onChange={e => handleDetailsChange('accountName', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountNumber">Bank Account Number</Label>
                      <Input id="accountNumber" value={localDetails.accountNumber || ''} onChange={e => handleDetailsChange('accountNumber', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="ifscCode">IFSC Code</Label>
                      <Input id="ifscCode" value={localDetails.ifscCode || ''} onChange={e => handleDetailsChange('ifscCode', e.target.value)} />
                    </div>
                  </div>
                  <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" value={localDetails.bankName || ''} onChange={e => handleDetailsChange('bankName', e.target.value)} />
                    </div>
                </div>
              </div>
              
              <div className="space-y-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Receipt Settings</h3>
                <div>
                    <Label htmlFor="receiptImageUrl">Pre-printed Receipt Image URL</Label>
                    <Input id="receiptImageUrl" value={localDetails.receiptImageUrl || ''} onChange={e => handleDetailsChange('receiptImageUrl', e.target.value)} />
                    <p className="text-sm text-muted-foreground mt-2">
                      Link to an image of the official, pre-printed receipt paper. This will be used as the background for generated PDF receipts.
                    </p>
                  </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button onClick={handleSave}>Save All Settings</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
