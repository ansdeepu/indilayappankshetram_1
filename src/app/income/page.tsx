'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useFirestore, useUser } from '@/firebase';
import { useState, useMemo } from 'react';
import { collection, query, orderBy, addDoc, where, deleteDoc, doc } from 'firebase/firestore';
import type { Offering, OfferingBooking, Donation, Income } from '@/lib/types';
import { stars } from '@/lib/nakshatra';
import { useCollection } from '@/firebase';
import { PaymentDialog } from '@/components/payment/payment-dialog';
import { ConfirmationDialog } from '@/components/payment/confirmation-dialog';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ShieldAlert, Loader2, Calendar, Clock, Heart, PlusCircle, List, TrendingUp, Trash2, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addDays } from 'date-fns';
import { useFinanceCategories } from '@/hooks/use-finance-categories';

export default function IncomePage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const firestore = useFirestore();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, isManager } = useUser();
  const canManage = isAdmin || isManager;
  const { incomeCategories } = useFinanceCategories();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'booking' | 'donation'>('booking');
  const [activeRecord, setActiveRecord] = useState<OfferingBooking | Donation | null>(null);

  // Queries
  const offeringsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'offerings'), orderBy('price'));
  }, [firestore]);

  const { data: offeringsList, loading: offeringsLoading } = useCollection<Offering>(offeringsQuery);

  const bookingsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    if (canManage) {
      return query(collection(firestore, 'offeringBookings'), orderBy('bookingDate', 'asc'));
    }
    return query(collection(firestore, 'offeringBookings'), where('userEmail', '==', user.email), orderBy('bookingDate', 'asc'));
  }, [firestore, user, canManage]);

  const donationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    if (canManage) {
      return query(collection(firestore, 'donations'), orderBy('donationDate', 'desc'));
    }
    return query(collection(firestore, 'donations'), where('userEmail', '==', user.email), orderBy('donationDate', 'desc'));
  }, [firestore, user, canManage]);

  const directIncomeQuery = useMemo(() => {
    if (!firestore || !user || !canManage) return null;
    return query(collection(firestore, 'income'), orderBy('date', 'desc'));
  }, [firestore, user, canManage]);

  const { data: allBookings, loading: bookingsLoading } = useCollection<OfferingBooking>(bookingsQuery);
  const { data: allDonations, loading: donationsLoading } = useCollection<Donation>(donationsQuery);
  const { data: allDirectIncome, loading: directIncomeLoading } = useCollection<Income>(directIncomeQuery);

  const todayBookings = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return (allBookings || []).filter(b => b.bookingDate === today);
  }, [allBookings]);

  // Forms
  const todayFormSchema = z.object({
    offeringId: z.string().min(1, 'Please select an offering'),
    bookingDate: z.string(),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    star: z.string().min(1, 'Please select a star'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    email: z.string().email('Please enter a valid email'),
    address: z.string().min(5, 'Please enter your address'),
  });

  const todayForm = useForm<z.infer<typeof todayFormSchema>>({
    resolver: zodResolver(todayFormSchema),
    defaultValues: {
      offeringId: '',
      bookingDate: format(new Date(), 'yyyy-MM-dd'),
      name: '',
      star: '',
      phone: '',
      email: user?.email || '',
      address: '',
    },
  });

  const donationFormSchema = z.object({
    amount: z.coerce.number().min(1, 'Amount must be at least 1'),
    donationDate: z.string(),
    purpose: z.string().optional(),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    star: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Please enter a valid email'),
    address: z.string().optional(),
  });

  const donationForm = useForm<z.infer<typeof donationFormSchema>>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      amount: 0,
      donationDate: format(new Date(), 'yyyy-MM-dd'),
      purpose: '',
      name: '',
      star: '',
      phone: '',
      email: user?.email || '',
      address: '',
    },
  });

  const manualIncomeSchema = z.object({
    categoryId: z.string().min(1, 'Category is required'),
    subCategoryIndex: z.string().min(1, 'Sub-category is required'),
    amount: z.coerce.number().min(1, 'Amount must be at least 1'),
    date: z.string(),
    receivedFrom: z.string().min(3, 'Received from is required'),
    descriptionEn: z.string().min(3, 'Description is required'),
    descriptionMl: z.string().optional(),
    paymentMethod: z.string().default('Cash'),
    receiptNo: z.string().optional(),
  });

  const manualForm = useForm<z.infer<typeof manualIncomeSchema>>({
    resolver: zodResolver(manualIncomeSchema),
    defaultValues: {
      categoryId: '',
      subCategoryIndex: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      receivedFrom: '',
      descriptionEn: '',
      descriptionMl: '',
      paymentMethod: 'Cash',
      receiptNo: '',
    },
  });

  const selectedManualCatId = manualForm.watch('categoryId');
  const selectedManualCategory = incomeCategories.find(c => c.id === selectedManualCatId);

  // Submissions
  async function onOfferingSubmit(values: z.infer<typeof todayFormSchema>) {
    if (!firestore || !user) {
      setIsLoginOpen(true);
      return;
    }

    const selectedOffering = offeringsList?.find(o => o.id === values.offeringId);
    if (!selectedOffering) return;

    try {
      const bookingData: Omit<OfferingBooking, 'id'> = {
        offeringId: selectedOffering.id,
        offeringNameEn: selectedOffering.nameEn,
        offeringNameMl: selectedOffering.name,
        price: selectedOffering.price,
        userName: values.name,
        userEmail: values.email,
        bookingDate: values.bookingDate,
        submissionDate: new Date().toISOString(),
        star: values.star,
        phone: values.phone,
        address: values.address,
        paymentStatus: 'Pending',
        language: language,
      };

      const docRef = await addDoc(collection(firestore, 'offeringBookings'), bookingData);
      const newRecord = { id: docRef.id, ...bookingData } as OfferingBooking;
      
      setActiveRecord(newRecord);
      setPaymentAmount(selectedOffering.price);
      setPaymentType('booking');
      setPaymentDialogOpen(true);
      
      todayForm.reset();
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit booking. Please try again.',
      });
    }
  }

  async function onDonationSubmit(values: z.infer<typeof donationFormSchema>) {
    if (!firestore || !user) {
      setIsLoginOpen(true);
      return;
    }

    try {
      const donationData: Omit<Donation, 'id'> = {
        amount: values.amount,
        donationDate: values.donationDate,
        purpose: values.purpose,
        userName: values.name,
        star: values.star || '',
        userEmail: values.email,
        phone: values.phone,
        address: values.address,
        paymentStatus: 'Pending',
        language: language,
      };

      const docRef = await addDoc(collection(firestore, 'donations'), donationData);
      const newRecord = { id: docRef.id, ...donationData } as Donation;

      setActiveRecord(newRecord);
      setPaymentAmount(values.amount);
      setPaymentType('donation');
      setPaymentDialogOpen(true);

      donationForm.reset();
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit donation. Please try again.',
      });
    }
  }

  async function onManualIncomeSubmit(values: z.infer<typeof manualIncomeSchema>) {
    if (!firestore || !canManage) return;

    try {
      const cat = incomeCategories.find(c => c.id === values.categoryId);
      const subCat = cat?.subcategories[parseInt(values.subCategoryIndex)];

      if (!cat || !subCat) throw new Error('Invalid category');

      const incomeData = {
        categoryEn: cat.nameEn,
        categoryMl: cat.nameMl,
        subCategoryEn: subCat.nameEn,
        subCategoryMl: subCat.nameMl,
        amount: values.amount,
        date: values.date,
        receivedFrom: values.receivedFrom,
        descriptionEn: values.descriptionEn,
        descriptionMl: values.descriptionMl || values.descriptionEn,
        paymentMethod: values.paymentMethod,
        receiptNo: values.receiptNo || `R-${Date.now().toString().slice(-6)}`,
        createdByUser: user?.email,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'income'), incomeData);
      
      toast({
        title: 'Income Logged',
        description: 'Income record has been successfully added.',
      });

      manualForm.reset({
        categoryId: '',
        subCategoryIndex: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        receivedFrom: '',
        descriptionEn: '',
        descriptionMl: '',
        paymentMethod: 'Cash',
        receiptNo: '',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to log income.',
      });
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setConfirmationDialogOpen(true);
  };

  const handleCloseAll = () => {
    setConfirmationDialogOpen(false);
    setActiveRecord(null);
  };

  const handleDeleteManualIncome = async (id: string) => {
    if (!firestore || !canManage) return;
    if (!confirm('Are you sure you want to delete this income record?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'income', id));
      toast({ title: 'Record deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting record' });
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <SiteHeader />
      
      <main className="flex-1 container py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
              {language === 'en' ? 'Temple Income' : 'ക്ഷേത്ര വരുമാനം'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === 'en' 
                ? 'Offerings, donations, and other financial receipts.' 
                : 'വഴിപാടുകൾ, സംഭാവനകൾ, മറ്റ് വരുമാനങ്ങൾ എന്നിവ ഇവിടെ രേഖപ്പെടുത്താം.'}
            </p>
          </div>

          <Tabs defaultValue="offerings" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-3 md:w-[600px] h-12">
                <TabsTrigger value="offerings" className="text-sm font-semibold">
                  <Flame className="mr-2 h-4 w-4" />
                  {language === 'en' ? 'Offerings' : 'വഴിപാടുകൾ'}
                </TabsTrigger>
                <TabsTrigger value="donations" className="text-sm font-semibold">
                  <Heart className="mr-2 h-4 w-4" />
                  {language === 'en' ? 'Donations' : 'സംഭാവനകൾ'}
                </TabsTrigger>
                {canManage && (
                  <TabsTrigger value="manual" className="text-sm font-semibold">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {language === 'en' ? 'Admin Entry' : 'അഡ്മിൻ എൻട്രി'}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="offerings" className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-md border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-primary" />
                      {language === 'en' ? 'Book an Offering' : 'വഴിപാട് ബുക്ക് ചെയ്യുക'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'en' 
                        ? 'Select an offering to be performed in your name.' 
                        : 'നിങ്ങളുടെ പേരിൽ നടത്തേണ്ട വഴിപാട് തിരഞ്ഞെടുക്കുക.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...todayForm}>
                      <form onSubmit={todayForm.handleSubmit(onOfferingSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={todayForm.control}
                            name="offeringId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Offering' : 'വഴിപാട്'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select offering" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {offeringsList && offeringsList.map(offering => (
                                      <SelectItem key={offering.id} value={offering.id}>
                                        {language === 'en' ? offering.nameEn : offering.name} (₹{offering.price})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={todayForm.control}
                            name="bookingDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Date' : 'തീയതി'}</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={todayForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Name' : 'പേര്'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={todayForm.control}
                            name="star"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Star' : 'നക്ഷത്രം'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select star" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {stars.map(star => (
                                      <SelectItem key={star.en} value={language === 'en' ? star.en : star.ml}>
                                        {language === 'en' ? star.en : star.ml}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <FormField
                            control={todayForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Phone' : 'ഫോൺ'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={todayForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Email' : 'ഇമെയിൽ'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Email address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={todayForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'en' ? 'Address' : 'വിലാസം'}</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Full address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full h-12 text-lg font-bold">
                          {language === 'en' ? 'Book Offering' : 'വഴിപാട് ബുക്ക് ചെയ്യുക'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="shadow-md border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {language === 'en' ? "Today's Schedule" : 'ഇന്നത്തെ വഴിപാടുകൾ'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        { (todayBookings || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No bookings for today.</p>
                        ) : (
                          todayBookings.map(b => (
                            <div key={b.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                              <div>
                                <p className="font-bold">{b.userName}</p>
                                <p className="text-xs text-muted-foreground">{language === 'en' ? b.offeringNameEn : b.offeringNameMl}</p>
                              </div>
                              <Badge variant="secondary">₹{b.price}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="donations" className="space-y-8">
              <Card className="max-w-3xl mx-auto shadow-md border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    {language === 'en' ? 'General Donations' : 'സംഭാവനകൾ'}
                  </CardTitle>
                  <CardDescription>Support temple activities and maintenance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...donationForm}>
                    <form onSubmit={donationForm.handleSubmit(onDonationSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={donationForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={donationForm.control}
                          name="purpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purpose</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Annadanam, Renovation" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={donationForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={donationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-lg font-bold bg-rose-600 hover:bg-rose-700">
                        {language === 'en' ? 'Donate Now' : 'സംഭാവന നൽകുക'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {canManage && (
              <TabsContent value="manual" className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 shadow-md border-none">
                    <CardHeader>
                      <CardTitle>{language === 'en' ? 'Direct Income Entry' : 'നേരിട്ടുള്ള വരുമാനം'}</CardTitle>
                      <CardDescription>Log income according to standardized categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...manualForm}>
                        <form onSubmit={manualForm.handleSubmit(onManualIncomeSubmit)} className="space-y-4">
                          <FormField
                            control={manualForm.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {incomeCategories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>{language === 'en' ? cat.nameEn : cat.nameMl}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={manualForm.control}
                            name="subCategoryIndex"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sub-category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedManualCategory}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Sub-category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {selectedManualCategory?.subcategories.map((sub, idx) => (
                                      <SelectItem key={idx} value={idx.toString()}>{language === 'en' ? sub.nameEn : sub.nameMl}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={manualForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount (₹)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={manualForm.control}
                            name="receivedFrom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Received From</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={manualForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full">Log Income</Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 shadow-md border-none">
                    <CardHeader>
                      <CardTitle>Recent Categorized Income</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          { (allDirectIncome || []).length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
                          ) : (
                            (allDirectIncome || []).map(inc => (
                              <TableRow key={inc.id}>
                                <TableCell className="text-xs">{inc.date}</TableCell>
                                <TableCell>
                                  <div className="text-sm font-bold">{language === 'en' ? inc.categoryEn : inc.categoryMl}</div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'en' ? inc.subCategoryEn : inc.subCategoryMl}</div>
                                </TableCell>
                                <TableCell className="text-sm">{inc.receivedFrom}</TableCell>
                                <TableCell className="text-right font-bold">₹{inc.amount}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteManualIncome(inc.id)} className="h-8 w-8 text-rose-500">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          record={activeRecord}
          type={paymentType}
          amount={paymentAmount}
          onPaymentSuccess={handlePaymentSuccess}
        />
        
        <ConfirmationDialog 
          isOpen={isConfirmationDialogOpen}
          onClose={handleCloseAll}
          record={activeRecord}
          type={paymentType}
          amount={paymentAmount}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
