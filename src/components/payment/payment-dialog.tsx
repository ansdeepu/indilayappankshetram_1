'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useFirestore, useDoc } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import type { PaymentDetails, OfferingBooking, Donation, TempleDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppDialog } from './whatsapp-dialog';
import { CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  type: 'booking' | 'donation';
  record: OfferingBooking | Donation | null;
  onPaymentSuccess: (savedRecord: OfferingBooking | Donation) => void;
}

export function PaymentDialog({ isOpen, onClose, amount, type, record, onPaymentSuccess }: PaymentDialogProps) {
  const { language } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const paymentDetailsRef = useMemo(() => firestore ? doc(firestore, 'content', 'paymentDetails') : null, [firestore]);
  const { data: paymentDetails, loading } = useDoc<PaymentDetails>(paymentDetailsRef);
  
  const templeDetailsRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'templeDetails') : null, [firestore]);
  const { data: templeDetails } = useDoc<TempleDetails>(templeDetailsRef);


  const handleCopy = (text: string | undefined, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast({ title: language === 'en' ? 'Copied to clipboard!' : 'ക്ലിപ്പ്ബോർഡിലേക്ക് പകർത്തി!' });
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(err => {
      toast({ variant: 'destructive', title: language === 'en' ? 'Failed to copy' : 'പകർത്തുന്നതിൽ പരാജയപ്പെട്ടു' });
    });
  };

  const handlePaymentCompleted = async () => {
    if (!record || !firestore) return;
    
    try {
        const { id, ...dataToSave } = record;
        const collectionName = type === 'booking' ? 'offeringBookings' : 'donations';
        const docRef = await addDoc(collection(firestore, collectionName), dataToSave);
        
        setShowCompletionConfirm(false);
        
        const savedRecord = { ...record, id: docRef.id };
        onPaymentSuccess(savedRecord);

    } catch (error: any) {
        console.error("Error saving record: ", error?.message || String(error));
        toast({
            variant: 'destructive',
            title: language === 'en' ? 'Error Saving Record' : 'രേഖ സേവ് ചെയ്യുന്നതിൽ പിശക്',
            description: error.message
        });
    }
  }

  const t = {
    en: {
        title: "Indilayappan Temple",
        description: `Please pay ₹${amount.toFixed(2)} and share the payment screenshot on WhatsApp.`,
        option1: "Option 1: QR Code",
        option2: "Option 2: UPI ID",
        option3: "Option 3: Bank Transfer",
        accountName: "Account Name",
        accountNumber: "Account Number",
        ifsc: "IFSC Code",
        bankName: "Bank Name",
        scanToPay: "Scan to pay with any UPI app",
        cancel: "Cancel",
        shareScreenshot: "Share Screenshot",
        paymentCompleted: "Payment Completed",
        loading: "Loading payment details...",
        confirmTitle: "Confirm Screenshot",
        confirmDesc: "Have you shared the payment success screenshot to the temple WhatsApp number?",
        confirmYes: "Yes, Shared",
        confirmNo: "Not Yet"
    },
    ml: {
        title: "ഇണ്ടിളയപ്പൻ ക്ഷേത്രം",
        description: `ദയവായി ₹${amount.toFixed(2)} അടച്ച്, പേയ്‌മെന്റ് സ്ക്രീൻഷോട്ട് വാട്ട്‌സ്ആപ്പിൽ പങ്കുവെക്കുക.`,
        option1: "ഓപ്ഷൻ 1: QR കോഡ്",
        option2: "ഓപ്ഷൻ 2: UPI ഐഡി",
        option3: "ഓപ്ഷൻ 3: ബാങ്ക് ട്രാൻസ്ഫർ",
        accountName: "അക്കൗണ്ട് പേര്",
        accountNumber: "അക്കൗണ്ട് നമ്പർ",
        ifsc: "IFSC കോഡ്",
        bankName: "ബാങ്കിന്റെ പേര്",
        scanToPay: "ഏത് UPI ആപ്പ് ഉപയോഗിച്ചും പണമടയ്ക്കാൻ സ്കാൻ ചെയ്യുക",
        cancel: "റദ്ദാക്കുക",
        shareScreenshot: "ഷെയർ സ്ക്രീൻഷോട്ട്",
        paymentCompleted: "പേയ്മെന്റ് പൂർത്തിയായി",
        loading: "പേയ്‌മെന്റ് വിശദാംശങ്ങൾ ലോഡുചെയ്യുന്നു...",
        confirmTitle: "സ്ക്രീൻഷോട്ട് സ്ഥിരീകരിക്കുക",
        confirmDesc: "പേയ്മെന്റ് വിജയകരമായതിന്റെ സ്ക്രീൻഷോട്ട് നിങ്ങൾ ക്ഷേത്രത്തിന്റെ വാട്ട്‌സ്ആപ്പ് നമ്പറിലേക്ക് പങ്കിട്ടോ?",
        confirmYes: "അതെ, പങ്കിട്ടു",
        confirmNo: "ഇല്ല"
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl">{t[language].title}</DialogTitle>
            <DialogDescription>{t[language].description}</DialogDescription>
          </DialogHeader>

          {loading && <div className="p-8 text-center">{t[language].loading}</div>}

          {!loading && !paymentDetails?.upiId && (
            <div className="p-8 text-center text-destructive flex items-center gap-2 justify-center">
              <AlertCircle className="h-5 w-5" />
              <span>{language === 'en' ? 'Payment details not configured.' : 'പേയ്‌മെന്റ് വിശദാംശങ്ങൾ കോൺഫിഗർ ചെയ്തിട്ടില്ല.'}</span>
            </div>
          )}

          {!loading && paymentDetails && (
            <div className="py-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Option 1: QR Code */}
                <Card className="flex flex-col">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">{t[language].option1}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-4 pt-0">
                        {paymentDetails.qrCodeUrl ? (
                             <div className="bg-white p-2 rounded-lg border flex-grow flex flex-col justify-center">
                                <Image
                                    src={paymentDetails.qrCodeUrl}
                                    alt="Payment QR Code"
                                    width={200}
                                    height={200}
                                    className="rounded-lg"
                                />
                                <p className="text-xs text-muted-foreground mt-2">{t[language].scanToPay}</p>
                            </div>
                        ) : <p className="text-sm text-muted-foreground">QR Code not available</p>}
                    </CardContent>
                </Card>

                {/* Option 2: UPI ID */}
                <Card className="flex flex-col">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">{t[language].option2}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center p-4 pt-0">
                         <div className="border border-dashed rounded-lg p-4 w-full h-full flex flex-col justify-center items-center gap-2">
                            <span className="font-medium text-destructive break-all text-center">{paymentDetails.upiId}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleCopy(paymentDetails.upiId, 'upi')}>
                                {copiedField === 'upi' ? <CheckCircle className="h-4 w-4 text-green-600 mr-2"/> : <Copy className="h-4 w-4 mr-2"/>}
                                {language === 'en' ? 'Copy ID' : 'ഐഡി പകർത്തുക'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Option 3: Bank Transfer */}
                <Card className="flex flex-col">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">{t[language].option3}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm flex-grow p-4 pt-0">
                        <div className="flex justify-between items-start">
                            <span className="text-muted-foreground font-medium">{t[language].accountName}:</span>
                            <span className="font-semibold text-right">{paymentDetails.accountName}</span>
                        </div>
                         <div className="flex justify-between items-start">
                            <span className="text-muted-foreground font-medium">{t[language].accountNumber}:</span>
                            <span className="font-semibold">{paymentDetails.accountNumber}</span>
                        </div>
                         <div className="flex justify-between items-start">
                            <span className="text-muted-foreground font-medium">{t[language].ifsc}:</span>
                            <span className="font-semibold">{paymentDetails.ifscCode}</span>
                        </div>
                         <div className="flex justify-between items-start">
                            <span className="text-muted-foreground font-medium">{t[language].bankName}:</span>
                            <span className="font-semibold text-right">{paymentDetails.bankName}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between sm:w-full mt-2">
             <Button type="button" variant="ghost" onClick={onClose}>
                {t[language].cancel}
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setShowWhatsAppDialog(true)}>
                    {t[language].shareScreenshot}
                </Button>
                <Button type="button" onClick={() => setShowCompletionConfirm(true)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t[language].paymentCompleted}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {templeDetails && record && (
        <WhatsAppDialog
            isOpen={showWhatsAppDialog}
            onClose={() => setShowWhatsAppDialog(false)}
            phoneNumber={templeDetails.phone1}
            amount={amount}
            type={type}
            userName={record.userName}
            isReceipt={false}
        />
      )}

      <AlertDialog open={showCompletionConfirm} onOpenChange={setShowCompletionConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t[language].confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t[language].confirmDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowCompletionConfirm(false)}>{t[language].confirmNo}</AlertDialogCancel>
                <AlertDialogAction onClick={handlePaymentCompleted}>{t[language].confirmYes}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
