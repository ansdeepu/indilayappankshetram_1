'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/context/language-context';
import { Button } from '../ui/button';

interface WhatsAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  amount: number;
  type: 'booking' | 'donation';
  userName: string;
  isReceipt: boolean;
}

export function WhatsAppDialog({ isOpen, onClose, phoneNumber, amount, type, userName, isReceipt }: WhatsAppDialogProps) {
  const { language } = useLanguage();

  const handleSendWhatsApp = () => {
    let message: string;

    if (isReceipt) {
        message = language === 'en'
            ? `🙏 Namaskaram\n\nPlease find the offering details receipt attached.\nPayment screenshot already shared earlier.\n\n🙏`
            : `🙏 നമസ്കാരം\n\nവഴിപാട് വിവരങ്ങൾ അടങ്ങിയ രസീത് ഇതോടൊപ്പം ചേർക്കുന്നു.\nപേയ്മെന്റ് സ്ക്രീൻഷോട്ട് നേരത്തെ പങ്കുവെച്ചിട്ടുണ്ട്.\n\n🙏`;
    } else {
        const paymentTypeEn = type === 'booking' ? 'an Offering' : 'a Donation';
        const paymentTypeMl = type === 'booking' ? 'ഒരു വഴിപാട്' : 'ഒരു സംഭാവന';
        
        message = language === 'en' 
          ? `🙏 Namaskaram\n\nI have completed the offering payment of ₹${amount.toFixed(2)} for ${paymentTypeEn} via UPI.\nPayment success screenshot attached.\nKindly verify.\n\n🙏`
          : `🙏 നമസ്കാരം\n\n${userName} എന്ന ഞാൻ ${paymentTypeMl} ഇനത്തിൽ ₹${amount.toFixed(2)} രൂപയുടെ ഒരു പേയ്മെന്റ് UPI വഴി നടത്തിയിട്ടുണ്ട്.\nഅതിന്റെ വിജയകരമായ സ്ക്രീൻഷോട്ട് ഇതോടൊപ്പം ചേർക്കുന്നു.\nദയവായി പരിശോധിക്കുക.\n\n🙏`;
    }


    const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    // Use country code for India if not present
    const finalPhoneNumber = cleanPhoneNumber.length > 10 ? cleanPhoneNumber : `91${cleanPhoneNumber}`;
    
    const whatsappUrl = `https://wa.me/${finalPhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const t = {
    en: {
        title: "Send to WhatsApp",
        description: "This will open WhatsApp with a pre-filled message. Please attach the screenshot or receipt before sending.",
        cancel: "Cancel",
        continue: "Continue to WhatsApp",
    },
    ml: {
        title: "വാട്ട്‌സ്ആപ്പിലേക്ക് അയക്കുക",
        description: "ഇത് വാട്ട്‌സ്ആപ്പ് തുറന്ന് സന്ദേശം നിറയ്ക്കും. അയക്കുന്നതിന് മുമ്പ് ദയവായി സ്ക്രീൻഷോട്ട് അല്ലെങ്കിൽ രസീത് അറ്റാച്ചുചെയ്യുക.",
        cancel: "റദ്ദാക്കുക",
        continue: "വാട്ട്‌സ്ആപ്പിലേക്ക് തുടരുക",
    }
  }


  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent onInteractOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t[language].title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t[language].description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {t[language].cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            handleSendWhatsApp();
            onClose();
          }}>
            {t[language].continue}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
