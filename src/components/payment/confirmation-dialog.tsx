'use client';

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
import type { OfferingBooking, Donation, TempleDetails } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { TempleIcon } from '../icons/temple-icon';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useMemo, useState } from 'react';
import { WhatsAppDialog } from './whatsapp-dialog';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';


interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  type: 'booking' | 'donation';
  record: OfferingBooking | Donation | null;
}

export function ConfirmationDialog({ isOpen, onClose, amount, type, record }: ConfirmationDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  
  const templeDetailsRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'templeDetails') : null, [firestore]);
  const { data: templeDetails } = useDoc<TempleDetails>(templeDetailsRef);
  
  const isBooking = type === 'booking' && record && 'price' in record;
  const isDonation = type === 'donation' && record && 'amount' in record;

  const formatDate = (dateString?: string, includeTime = false) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
        }
        
        return date.toLocaleString('en-GB', options).replace(',', '');

    } catch (e) {
        return dateString;
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create PDF.' });
        return;
    }
    try {
        const canvas = await html2canvas(receiptRef.current, { scale: 3 });
        const imgData = canvas.toDataURL('image/png');
        
        // A5 size in mm is 148 x 210
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a5' // 210 x 148 mm
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 148);
        pdf.save(`Indilayappan-Temple-Receipt-${record?.id?.substring(0, 8) || 'download'}.pdf`);
    } catch (error) {
        console.error("Error generating PDF: ", error instanceof Error ? error.message : String(error));
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate PDF.' });
    }
  };

  const handleSendToTemple = () => {
    if (!templeDetails?.phone1) {
        toast({ variant: 'destructive', title: 'Error', description: 'Temple phone number not configured.' });
        return;
    }
    setShowWhatsAppDialog(true);
  }
  
  const t = {
    en: {
        title: "Your Receipt is Ready",
        description: "Please take a photo of the receipt and share it to the temple's WhatsApp number.",
    },
    ml: {
        title: "നിങ്ങളുടെ രസീത് തയ്യാറാണ്",
        description: "ദയവായി രസീതിന്റെ ഫോട്ടോയെടുത്ത് ക്ഷേത്രത്തിന്റെ വാട്ട്‌സ്ആപ്പ് നമ്പറിലേക്ക് അയക്കുക.",
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent onInteractOutside={(e) => { e.preventDefault(); }} className="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh] flex flex-col">
               <DialogHeader className="p-6 pb-4 text-left">
                  <DialogTitle className="text-xl">{t[language].title}</DialogTitle>
                  <DialogDescription>
                    {t[language].description}
                  </DialogDescription>
              </DialogHeader>
              <ScrollArea className="px-6 pb-4">
                 <div ref={receiptRef} className="border rounded-lg p-4 bg-background text-sm text-foreground shadow-inner">
                     {record && (
                         <div className="space-y-3">
                             <div className="grid grid-cols-[max-content_5px_1fr] items-baseline gap-x-2">
                                  <span className="text-muted-foreground">ഭക്തന്റെ പേര് / Devotee Name</span><span>:</span><span className="font-medium">{record.userName}</span>
                                  <span className="text-muted-foreground">വിലാസം / Address</span><span>:</span><span>{record.address || '-'}</span>
                                  <span className="text-muted-foreground">ഫോൺ നമ്പർ / Phone No</span><span>:</span><span>{record.phone || '-'}</span>
                                  <span className="text-muted-foreground">ഇമെയിൽ / Email</span><span>:</span><span>{record.userEmail}</span>
                             </div>
                             <Separator />
                             <div className="grid grid-cols-[max-content_5px_1fr] items-baseline gap-x-2">
                                  <span className="text-muted-foreground">നക്ഷത്രം / Star</span><span>:</span><span>{record.star}</span>
                                  {isBooking && <><span className="text-muted-foreground">വഴിപാട് / Vazhipadu</span><span>:</span><span className="font-medium">{language === 'en' ? (record as OfferingBooking).offeringNameEn : (record as OfferingBooking).offeringNameMl}</span></>}
                                  {isBooking && <><span className="text-muted-foreground">വഴിപാട് തീയതി / Offering Date</span><span>:</span><span>{formatDate((record as OfferingBooking).bookingDate)}</span></>}
                                  {isDonation && <><span className="text-muted-foreground">ഉദ്ദേശ്യം / Purpose</span><span>:</span><span>{(record as Donation).purpose || '-'}</span></>}
                             </div>
                             <Separator />
                              <div className="grid grid-cols-[max-content_5px_1fr] items-baseline gap-x-2">
                                  <span className="text-muted-foreground font-bold">തുക / Amount</span><span>:</span><span className="font-bold">₹{amount.toFixed(2)}</span>
                                  <span className="text-muted-foreground">പേയ്മെന്റ് / Payment</span><span>:</span><span>UPI</span>
                                  <span className="text-muted-foreground">തീയതി & സമയം / Date & Time</span><span>:</span><span>{formatDate(isBooking ? (record as OfferingBooking).submissionDate : (record as Donation).donationDate, true)}</span>
                                  <span className="text-muted-foreground">റഫറൻസ് / Reference</span><span>:</span><span>Payment screenshot attached</span>
                             </div>
                             <Separator />
                             <div className="text-center text-[9px] leading-tight text-muted-foreground pt-2 flex items-center justify-center gap-1">
                                  <TempleIcon className="w-3 h-3" />
                                  <p>വഴിപാടിന് നന്ദി / Thank you for your offering</p>
                             </div>
                         </div>
                     )}
                 </div>
              </ScrollArea>
              <DialogFooter className="p-6 pt-4 flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="sm:order-1 text-xs">
                      {language === 'en' ? 'Close' : 'അടയ്ക്കുക'}
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 sm:order-2 w-full sm:w-auto">
                      <Button type="button" variant="outline" onClick={handleDownload} className="w-full whitespace-normal h-auto py-1 px-2 text-xs">
                          {language === 'en' ? 'Download' : 'ഡൗൺലോഡ് ചെയ്യുക'}
                      </Button>
                      <Button type="button" onClick={handleSendToTemple} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full whitespace-normal h-auto py-1 px-2 text-xs">
                          {language === 'en' ? 'Send to Temple' : 'രസീത് ക്ഷേത്രത്തിലേക്ക് അയക്കുക'}
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
            isReceipt={true}
        />
      )}
    </>
  );
}
