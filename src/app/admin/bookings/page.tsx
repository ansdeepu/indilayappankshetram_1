'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, DocumentSnapshot, Query, deleteDoc, setDoc, getCountFromServer, where, startAt, endAt } from 'firebase/firestore';
import type { OfferingBooking, Donation, TempleDetails } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Eye, Mail, Trash2 } from 'lucide-react';
import { EditBookingDonationDialog } from './edit-dialog';
import { DeleteConfirmationDialog } from './delete-dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TempleEmailReceipt } from '@/components/payment/temple-email-receipt';
import html2canvas from 'html2canvas';
import ReactPaginate from 'react-paginate';
import { Pagination } from '@/components/ui/pagination';


const PAGE_SIZE = 50;

type PaginatedData<T> = {
  data: (T & { id: string })[];
  loading: boolean;
  error: string | null;
  pageCount: number;
};

function usePaginatedCollection<T>(
    baseQuery: Query | null, 
    currentPage: number,
    refreshToggle: boolean,
    isManager: boolean
): PaginatedData<T> {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseQuery) {
      setData([]);
      setPageCount(0);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // First, get the total count for pagination
        const countSnapshot = await getDocs(baseQuery);
        const allDocs = countSnapshot.docs.map(d => ({ ...(d.data() as T), id: d.id }));
        
        // Apply manager filter on the client side
        const filteredDocs = isManager ? allDocs.filter((d: any) => !d.receiptSentAt) : allDocs;
        
        setPageCount(Math.ceil(filteredDocs.length / PAGE_SIZE));
        
        // Get the data for the current page
        const startIndex = currentPage * PAGE_SIZE;
        const pagedDocs = filteredDocs.slice(startIndex, startIndex + PAGE_SIZE);

        setData(pagedDocs);

      } catch (err: any) {
         if (err.code === 'permission-denied') {
            // Safely determine the collection path for error reporting
            let collectionPath = 'unknown';
            try {
              // Try to get path safely without private member access
              if ('_query' in (baseQuery as any) && (baseQuery as any)._query.path) {
                collectionPath = (baseQuery as any)._query.path.segments.join('/');
              }
            } catch (e) {
              collectionPath = 'bookings/donations';
            }

            const permissionError = new FirestorePermissionError({
              path: collectionPath,
              operation: 'list',
            } satisfies SecurityRuleContext, err);
            errorEmitter.emit('permission-error', permissionError);
        }
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseQuery, currentPage, refreshToggle, isManager]);

  return { data, loading, error, pageCount };
}


const BookingDonationContext = React.createContext<{
  refreshData: (type: 'bookings' | 'donations') => void;
  refreshToggle: { bookings: boolean; donations: boolean };
} | null>(null);

function useBookingDonationContext() {
    const context = React.useContext(BookingDonationContext);
    if (!context) {
        throw new Error('useBookingDonationContext must be used within a BookingDonationProvider');
    }
    return context;
}

function BookingsPageContent() {
  const firestore = useFirestore();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, isManager } = useUser();
  const { refreshData, refreshToggle } = useBookingDonationContext();
  
  const [bookingsCount, setBookingsCount] = useState<number | null>(null);
  const [donationsCount, setDonationsCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'donations'>('bookings');

  const templeDetailsRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'templeDetails') : null, [firestore]);
  const { data: templeDetails } = useDoc<TempleDetails>(templeDetailsRef);

  const paymentDetailsRef = useMemo(() => firestore ? doc(firestore, 'content', 'paymentDetails') : null, [firestore]);
  const { data: paymentDetails } = useDoc<any>(paymentDetailsRef);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  const [editingItem, setEditingItem] = useState<OfferingBooking | Donation | null>(null);
  const [editingType, setEditingType] = useState<'booking' | 'donation' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{item: OfferingBooking | Donation, type: 'booking' | 'donation'} | null>(null);
  const [itemToEmail, setItemToEmail] = useState<{item: OfferingBooking | Donation, type: 'booking' | 'donation'} | null>(null);
  const [isGmailConfirmOpen, setGmailConfirmOpen] = useState(false);
  
  const fetchCounts = useCallback(async () => {
    if (!firestore || !user) return;

    try {
        const bookingsColl = collection(firestore, 'offeringBookings');
        const bookingsSnapshot = await getDocs(bookingsColl);
        const allBookings = bookingsSnapshot.docs.map(d => d.data() as OfferingBooking);
        
        if (isManager) {
            const pendingBookings = allBookings.filter(b => !b.receiptSentAt);
            setBookingsCount(pendingBookings.length);
        } else {
            setBookingsCount(allBookings.length);
        }

    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: 'offeringBookings',
              operation: 'list',
            } satisfies SecurityRuleContext, error);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("Error fetching bookings count:", error?.message || String(error));
        }
    }
    
    try {
        const donationsColl = collection(firestore, 'donations');
        const donationsSnapshot = await getDocs(donationsColl);
        const allDonations = donationsSnapshot.docs.map(d => d.data() as Donation);
        
        if (isManager) {
            const pendingDonations = allDonations.filter(d => !d.receiptSentAt);
            setDonationsCount(pendingDonations.length);
        } else {
            setDonationsCount(allDonations.length);
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: 'donations',
              operation: 'list',
            } satisfies SecurityRuleContext, error);
            errorEmitter.emit('permission-error', permissionError);
        } else {
             console.error("Error fetching donations count:", error?.message || String(error));
        }
    }
  }, [firestore, user, isManager]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, refreshToggle.bookings, refreshToggle.donations]);


  const handleEditClick = (item: OfferingBooking | Donation, type: 'booking' | 'donation') => {
    setEditingItem(item);
    setEditingType(type);
  }

  const handleDeleteClick = (item: OfferingBooking | Donation, type: 'booking' | 'donation') => {
    setItemToDelete({ item, type });
  }

 const handleEmailClick = async (item: OfferingBooking | Donation, type: 'booking' | 'donation') => {
    if (item.paymentStatus !== 'Paid' || !item.receiptNo) {
      toast({
          variant: 'destructive',
          title: 'Cannot Send Receipt',
          description: 'A receipt can only be sent if payment is "Paid" and a Receipt No. has been entered.',
      });
      return;
    }
    
    setItemToEmail({item, type});

    // We need to wait for the state to update and the hidden receipt to render
    setTimeout(async () => {
        if (receiptRef.current) {
            try {
                const canvas = await html2canvas(receiptRef.current, {
                    scale: 2, // Higher scale for better quality
                    useCORS: true,
                });
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                           await navigator.clipboard.write([
                                new ClipboardItem({ 'image/png': blob })
                            ]);
                           setGmailConfirmOpen(true);
                        } catch (err) {
                           console.error('Failed to copy image: ', (err as any)?.message || String(err));
                           toast({
                               variant: "destructive",
                               title: "Failed to copy receipt",
                               description: "Could not copy receipt image to clipboard.",
                           });
                        }
                    }
                });
            } catch (error) {
                 console.error('Error generating canvas: ', (error as any)?.message || String(error));
                 toast({
                    variant: "destructive",
                    title: "Failed to generate receipt",
                    description: "An error occurred while creating the receipt image.",
                });
            }
        }
    }, 100);
  };
  
  const openGmail = () => {
     if (!itemToEmail) return;

     const { item, type } = itemToEmail;

      const subject = language === 'en'
        ? `Receipt for your ${type} at Indilayappan Temple`
        : `ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലെ നിങ്ങളുടെ ${type === 'booking' ? 'വഴിപാടിന്റെ' : 'സംഭാവനയുടെ'} രസീത്`;

      const body = language === 'en'
        ? `Dear ${item.userName},\n\nPlease find your receipt attached.\n\nThank you for your support.\n\nSincerely,\nIndilayappan Temple Administration`
        : `പ്രിയപ്പെട്ട ${item.userName},\n\nനിങ്ങളുടെ രസീത് ഇതോടൊപ്പം ചേർക്കുന്നു.\n\nനിങ്ങളുടെ പിന്തുണയ്ക്ക് നന്ദി.\n\nവിശ്വസ്തതയോടെ,\nമാനേജർ\nഇണ്ടിളയപ്പൻ ക്ഷേത്രം`;

      const composeParams = new URLSearchParams({
          view: 'cm',
          fs: '1',
          to: item.userEmail,
          su: subject,
          body: body,
        }).toString();
        
      const templeAdminEmail = templeDetails?.email;

      let gmailUrl;

      if (templeAdminEmail) {
         gmailUrl = `https://mail.google.com/mail/u/${templeAdminEmail}/?${composeParams}`;
      } else {
        const gmailBaseUrl = 'https://mail.google.com/mail/';
        const gmailComposeUrl = `${gmailBaseUrl}?${composeParams}`;
        const chooserUrl = new URL('https://accounts.google.com/AccountChooser');
        chooserUrl.searchParams.set('continue', gmailComposeUrl);
        chooserUrl.searchParams.set('service', 'mail');
        gmailUrl = chooserUrl.toString();
      }

      window.open(gmailUrl, '_blank');
      
      if (firestore && item.id) {
          const collectionName = type === 'booking' ? 'offeringBookings' : 'donations';
          const docRef = doc(firestore, collectionName, item.id);
          setDoc(docRef, { receiptSentAt: new Date().toISOString() }, { merge: true })
            .then(() => {
                refreshData(type === 'booking' ? 'bookings' : 'donations'); 
            })
            .catch(e => console.error("Error updating receiptSentAt: ", e?.message || String(e)));
      }

      setGmailConfirmOpen(false);
      setItemToEmail(null); 
  }

  const handleConfirmDelete = (item: OfferingBooking | Donation, type: 'booking' | 'donation') => {
    if (!firestore || !item.id) return;
    const collectionName = type === 'booking' ? 'offeringBookings' : 'donations';
    const docRef = doc(firestore, collectionName, item.id);
    
    deleteDoc(docRef)
        .then(() => {
            toast({
                title: language === 'en' ? 'Success' : 'വിജയിച്ചു',
                description: language === 'en' ? 'The record has been deleted.' : 'രേഖ ഇല്ലാതാക്കി.',
            });
            refreshData(type === 'booking' ? 'bookings' : 'donations');
            fetchCounts();
        })
        .catch((serverError: any) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext, serverError);
            
            errorEmitter.emit('permission-error', permissionError);

            toast({
                variant: 'destructive',
                title: language === 'en' ? 'Error Deleting' : 'ഇല്ലാതാക്കുന്നതിൽ പിശക്',
                description: language === 'en' ? "You don't have permission to delete this record." : 'ഈ രേഖ ഇല്ലാതാക്കാൻ നിങ്ങൾക്ക് അനുവാദമില്ല.',
            });
        });
  };
  
  const formatForReceipt = (item: OfferingBooking | Donation, type: 'booking' | 'donation') => {
    const isBooking = type === 'booking';
    const bookingItem = item as OfferingBooking;
    const donationItem = item as Donation;

    return {
        date: formatDate(isBooking ? bookingItem.submissionDate : donationItem.donationDate),
        receiptNo: item.receiptNo || 'N/A',
        description: isBooking 
            ? (language === 'en' ? bookingItem.offeringNameEn : bookingItem.offeringNameMl)
            : (language === 'en' ? `Donation - ${donationItem.purpose || ''}` : `സംഭാവന - ${donationItem.purpose || ''}`),
        name: item.userName,
        star: item.star || '-',
        quantity: isBooking ? 1 : undefined,
        rate: isBooking ? bookingItem.price : undefined,
        amount: isBooking ? bookingItem.price : donationItem.amount,
        bookingDate: isBooking ? formatDate(bookingItem.bookingDate) : undefined,
        senderName: language === 'en' ? "Manager" : "മാനേജർ",
        senderDesignation: language === 'en' ? "Indilayappan Temple" : "ഇണ്ടിളയപ്പൻ ക്ഷേത്രം"
    };
  }


  return (
    <>
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className={cn("font-bold", language === 'en' ? 'text-2xl' : 'text-xl')}>
            {t[language].title}
          </CardTitle>
          <CardDescription>
            {t[language].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bookings" onValueChange={(value) => setActiveTab(value as 'bookings' | 'donations')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookings">
                {t[language].offeringsTab}
                {bookingsCount !== null && <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">{bookingsCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="donations">
                {t[language].donationsTab}
                {donationsCount !== null && <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">{donationsCount}</span>}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings" className="mt-4">
                <BookingsTable 
                  onEditClick={(item) => handleEditClick(item, 'booking')}
                  onDeleteClick={(item) => handleDeleteClick(item, 'booking')}
                  onEmailClick={(item) => handleEmailClick(item, 'booking')}
                />
            </TabsContent>
            <TabsContent value="donations" className="mt-4">
                <DonationsTable 
                  onEditClick={(item) => handleEditClick(item, 'donation')}
                  onDeleteClick={(item) => handleDeleteClick(item, 'donation')}
                  onEmailClick={(item) => handleEmailClick(item, 'donation')}
                />
            </TabsContent>
            
          </Tabs>
        </CardContent>
      </Card>
      
      {editingItem && editingType && (
        <EditBookingDonationDialog
            item={editingItem}
            type={editingType}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSave={() => {
              refreshData(editingType);
              fetchCounts();
            }}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationDialog
            item={itemToDelete.item}
            type={itemToDelete.type}
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirmDelete={handleConfirmDelete}
        />
      )}
      
      <AlertDialog open={isGmailConfirmOpen} onOpenChange={setGmailConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                   {language === 'en' ? 'Receipt Copied!' : 'രസീത് പകർത്തി!'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {language === 'en' 
                        ? 'The receipt image has been copied to your clipboard. Click "Continue" to open Gmail, where you can paste it (using Ctrl+V or right-click > Paste) into the email body.'
                        : 'രസീത് ചിത്രം നിങ്ങളുടെ ക്ലിപ്പ്ബോർഡിലേക്ക് പകർത്തി. Gmail തുറക്കാൻ "തുടരുക" ക്ലിക്ക് ചെയ്യുക, അവിടെ നിങ്ങൾക്ക് ഇമെയിലിൽ ഒട്ടിക്കാം (Ctrl+V അല്ലെങ്കിൽ റൈറ്റ് ക്ലിക്ക് > ഒട്ടിക്കുക ഉപയോഗിച്ച്).'}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                 <AlertDialogCancel onClick={() => setGmailConfirmOpen(false)}>
                    {language === 'en' ? 'Cancel' : 'റദ്ദാക്കുക'}
                </AlertDialogCancel>
                <AlertDialogAction onClick={openGmail}>
                     {language === 'en' ? 'Continue' : 'തുടരുക'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden receipt for rendering to canvas */}
      {itemToEmail && paymentDetails?.receiptImageUrl && (
          <div style={{ position: 'fixed', left: '-200vw', top: 0, zIndex: -1 }}>
             <TempleEmailReceipt
                ref={receiptRef}
                receiptData={formatForReceipt(itemToEmail.item, itemToEmail.type)}
                backgroundImageUrl={paymentDetails.receiptImageUrl}
             />
          </div>
      )}
      
    </div>
    </>
  );
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

const t = {
      en: {
        title: 'Bookings & Donations',
        description: 'View and manage all online offerings and donations submitted by devotees.',
        offeringsTab: 'Offerings Booked',
        donationsTab: 'Donations Received',
        slNo: 'Sl. No.',
        offeringDate: 'Offering Date',
        offering: 'Offering',
        devoteeName: 'Devotee Name',
        star: 'Star',
        payment: 'Payment',
        amount: 'Amount (INR)',
        actions: 'Actions',
        loading: 'Loading...',
        noOfferings: 'No offerings have been booked yet.',
        donationDate: 'Donation Date',
        donorName: 'Donor Name',
        purpose: 'Purpose',
        noDonations: 'No donations have been received yet.',
        view: 'View Details',
        delete: 'Delete',
        email: 'Email Receipt',
        receiptSent: 'Receipt Sent',
      },
      ml: {
        title: 'ബുക്കിംഗുകളും സംഭാവനകളും',
        description: 'ഭക്തർ സമർപ്പിച്ച എല്ലാ ഓൺലൈൻ വഴിപാടുകളും സംഭാവനകളും കാണുക, നിയന്ത്രിക്കുക.',
        offeringsTab: 'ബുക്ക് ചെയ്ത വഴിപാടുകൾ',
        donationsTab: 'ലഭിച്ച സംഭാവനകൾ',
        slNo: 'ക്രമ നമ്പർ',
        offeringDate: 'വഴിപാട് തീയതി',
        offering: 'വഴിപാട്',
        devoteeName: 'ഭക്തന്റെ പേര്',
        star: 'നക്ഷത്രം',
        payment: 'പേയ്‌മെന്റ്',
        amount: 'തുക (INR)',
        actions: 'പ്രവർത്തനങ്ങൾ',
        loading: 'ലോഡ് ചെയ്യുന്നു...',
        noOfferings: 'ഇതുവരെ വഴിപാടുകളൊന്നും ബുക്ക് ചെയ്തിട്ടില്ല.',
        donationDate: 'സംഭാവന തീയതി',
        donorName: 'ദായകന്റെ പേര്',
        purpose: 'ഉദ്ദേശ്യം',
        noDonations: 'ഇതുവരെ സംഭാവനകളൊന്നും ലഭിച്ചിട്ടില്ല.',
        view: 'വിശദാംശങ്ങൾ കാണുക',
        delete: 'ഇല്ലാതാക്കുക',
        email: 'രസീത് ഇമെയിൽ ചെയ്യുക',
        receiptSent: 'രസീത് അയച്ചു',
      }
};

interface BookingsTableProps {
  onEditClick: (item: OfferingBooking) => void;
  onDeleteClick: (item: OfferingBooking) => void;
  onEmailClick: (item: OfferingBooking, type: 'booking') => void;
}

function useFirestoreUser() {
    return {
        ...useUser(),
        firestore: useFirestore()
    };
}

function BookingsTable({ onEditClick, onDeleteClick, onEmailClick }: BookingsTableProps) {
    const { user, firestore, isAdmin, isManager } = useFirestoreUser();
    const { language } = useLanguage();
    const { refreshToggle } = useBookingDonationContext();
    const [currentPage, setCurrentPage] = useState(0);

    const baseQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(firestore!, 'offeringBookings'), orderBy('submissionDate', 'desc'));
    }, [firestore, user]);

    const { data: bookings, loading, pageCount } = usePaginatedCollection<OfferingBooking>(baseQuery, currentPage, refreshToggle.bookings, isManager);

    const handlePageClick = (event: { selected: number }) => {
        setCurrentPage(event.selected);
    };

    return (
        <>
            <div className="border rounded-md">
                 <div className="grid grid-cols-[50px_1fr_1.5fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 bg-muted/50 font-semibold text-muted-foreground text-sm border-b">
                    <div className="text-left">{t[language].slNo}</div>
                    <div className="text-left">{t[language].offeringDate}</div>
                    <div className="text-left">{t[language].offering}</div>
                    <div className="text-left">{t[language].devoteeName}</div>
                    <div className="text-left">{t[language].star}</div>
                    <div className="text-left">{t[language].payment}</div>
                    <div className="text-right">{t[language].amount}</div>
                    <div className="text-center">{t[language].actions}</div>
                </div>
                <ScrollArea className="w-full" style={{ height: '55vh' }}>
                    <Table>
                        <TableBody>
                        {loading ? (
                            <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground py-8">
                                {t[language].loading}
                            </TableCell>
                            </TableRow>
                        ) : bookings && bookings.length > 0 ? (
                            bookings.map((booking, index) => (
                            <TableRow key={booking.id} className="grid grid-cols-[50px_1fr_1.5fr_1.5fr_1fr_1fr_1fr_auto] gap-4 text-sm">
                                <TableCell>{currentPage * PAGE_SIZE + index + 1}</TableCell>
                                <TableCell>{formatDate(booking.bookingDate)}</TableCell>
                                <TableCell className="whitespace-normal">{language === 'en' ? booking.offeringNameEn : booking.offeringNameMl}</TableCell>
                                <TableCell className="whitespace-normal">{booking.userName}</TableCell>
                                <TableCell>{booking.star}</TableCell>
                                <TableCell>{booking.paymentStatus || 'Pending'}</TableCell>
                                <TableCell className="text-right">{booking.price.toFixed(2)}</TableCell>
                                <TableCell>
                                <div className="flex justify-center gap-1">
                                    <Button variant="ghost" size="icon" title={t[language].view} onClick={() => onEditClick(booking)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {(isAdmin || isManager) && booking.paymentStatus === 'Paid' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => onEmailClick(booking, 'booking')}>
                                            <Mail className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{booking.receiptSentAt ? `${t[language].receiptSent} on ${new Date(booking.receiptSentAt).toLocaleDateString('en-GB')}` : t[language].email}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    )}
                                    {isAdmin && (
                                    <Button variant="ghost" size="icon" title={t[language].delete} onClick={() => onDeleteClick(booking)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground py-8">
                                {t[language].noOfferings}
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            <Pagination pageCount={pageCount} onPageChange={handlePageClick} />
        </>
    )
}

interface DonationsTableProps {
  onEditClick: (item: Donation) => void;
  onDeleteClick: (item: Donation) => void;
  onEmailClick: (item: Donation, type: 'donation') => void;
}

function DonationsTable({ onEditClick, onDeleteClick, onEmailClick }: DonationsTableProps) {
    const { user, firestore, isAdmin, isManager } = useFirestoreUser();
    const { language } = useLanguage();
    const { refreshToggle } = useBookingDonationContext();
    const [currentPage, setCurrentPage] = useState(0);

    const baseQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(firestore!, 'donations'), orderBy('donationDate', 'desc'));
    }, [firestore, user]);

    const { data: donations, loading, pageCount } = usePaginatedCollection<Donation>(baseQuery, currentPage, refreshToggle.donations, isManager);

    const handlePageClick = (event: { selected: number }) => {
        setCurrentPage(event.selected);
    };

     return (
        <>
            <div className="border rounded-md">
                 <div className="grid grid-cols-[50px_1fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-2 bg-muted/50 font-semibold text-muted-foreground text-sm border-b">
                    <div className="text-left">{t[language].slNo}</div>
                    <div className="text-left">{t[language].donationDate}</div>
                    <div className="text-left">{t[language].donorName}</div>
                    <div className="text-left">{t[language].purpose}</div>
                    <div className="text-left">{t[language].payment}</div>
                    <div className="text-right">{t[language].amount}</div>
                    <div className="text-center">{t[language].actions}</div>
                </div>
                <ScrollArea className="w-full" style={{ height: '55vh' }}>
                    <Table>
                        <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground py-8">
                                    {t[language].loading}
                                </TableCell>
                            </TableRow>
                        ) : donations && donations.length > 0 ? (
                            donations.map((donation, index) => (
                            <TableRow key={donation.id} className="grid grid-cols-[50px_1fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 text-sm">
                                <TableCell>{currentPage * PAGE_SIZE + index + 1}</TableCell>
                                <TableCell>{formatDate(donation.donationDate)}</TableCell>
                                <TableCell className="whitespace-normal">{donation.userName}</TableCell>
                                <TableCell className="whitespace-normal max-w-[150px] truncate">{donation.purpose || '-'}</TableCell>
                                <TableCell>{donation.paymentStatus || 'Pending'}</TableCell>
                                <TableCell className="text-right">{donation.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                <div className="flex justify-center gap-1">
                                    <Button variant="ghost" size="icon" title={t[language].view} onClick={() => onEditClick(donation)}>
                                    <Eye className="h-4 w-4" />
                                    </Button>
                                    {(isAdmin || isManager) && donation.paymentStatus === 'Paid' && (
                                     <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => onEmailClick(donation, 'donation')}>
                                            <Mail className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{donation.receiptSentAt ? `${t[language].receiptSent} on ${new Date(donation.receiptSentAt).toLocaleDateString('en-GB')}`: t[language].email}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    )}
                                    {isAdmin && (
                                    <Button variant="ghost" size="icon" title={t[language].delete} onClick={() => onDeleteClick(donation)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground py-8">
                                    {t[language].noDonations}
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            <Pagination pageCount={pageCount} onPageChange={handlePageClick} />
        </>
    )
}

export default function BookingsPage() {
    const [refreshToggle, setRefreshToggle] = useState({ bookings: false, donations: false });
    
    const refreshData = useCallback((type: 'bookings' | 'donations') => {
        setRefreshToggle(prev => ({ ...prev, [type]: !prev[type] }));
    }, []);
    
    return (
        <BookingDonationContext.Provider value={{ refreshData, refreshToggle }}>
            <BookingsPageContent />
        </BookingDonationContext.Provider>
    )
}
