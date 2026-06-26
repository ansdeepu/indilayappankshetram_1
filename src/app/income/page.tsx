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
import { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy, addDoc, where } from 'firebase/firestore';
import type { Offering, OfferingBooking, Donation } from '@/lib/types';
import { stars } from '@/lib/nakshatra';
import { useCollection } from '@/firebase';
import { PaymentDialog } from '@/components/payment/payment-dialog';
import { ConfirmationDialog } from '@/components/payment/confirmation-dialog';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ShieldAlert, Loader2, Calendar, Clock, Heart, PlusCircle, List } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addDays } from 'date-fns';
import { 
  INCOME_CATEGORIES, 
  type FinanceCategory, 
  type SubCategory 
} from '@/lib/finance-data';

export default function IncomePage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const firestore = useFirestore();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, isManager } = useUser();
  const canViewAll = isAdmin || isManager;

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'booking' | 'donation'>('booking');
  const [activeRecord, setActiveRecord] = useState<OfferingBooking | Donation | null>(null);

  const offeringsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'offerings'), orderBy('price'));
  }, [firestore]);

  const { data: offeringsList, loading } = useCollection<Offering>(offeringsQuery);

  const bookingsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    if (canViewAll) {
      return query(collection(firestore, 'offeringBookings'), orderBy('bookingDate', 'asc'));
    }
    return query(collection(firestore, 'offeringBookings'), where('userEmail', '==', user.email), orderBy('bookingDate', 'asc'));
  }, [firestore, user, canViewAll]);

  const donationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    if (canViewAll) {
      return query(collection(firestore, 'donations'), orderBy('donationDate', 'desc'));
    }
    return query(collection(firestore, 'donations'), where('userEmail', '==', user.email), orderBy('donationDate', 'desc'));
  }, [firestore, user, canViewAll]);

  const { data: allBookings, loading: bookingsLoading } = useCollection<OfferingBooking>(bookingsQuery);
  const { data: allDonations, loading: donationsLoading } = useCollection<Donation>(donationsQuery);

  const { todayBookings } = useMemo(() => {
    if (!allBookings) return { todayBookings: [] };
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = format(now, 'yyyy-MM-dd');
    
    return {
      todayBookings: allBookings.filter(b => {
        const bDate = new Date(b.bookingDate);
        return format(bDate, 'yyyy-MM-dd') === todayStr;
      })
    };
  }, [allBookings]);
  
  const offeringFormSchema = useMemo(() => z.object({
    offeringId: z.string({
      required_error: language === 'en' ? 'Please select an offering.' : 'ദയവായി ഒരു വഴിപാട് തിരഞ്ഞെടുക്കുക.',
    }),
    bookingDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
      message: language === 'en' ? "A valid date for the offering is required." : "വഴിപാടിന് സാധുവായ ഒരു തീയതി ആവശ്യമാണ്.",
    }),
    name: z.string().min(2, {
      message: language === 'en' ? 'Name must be at least 2 characters.' : 'പേരിൽ കുറഞ്ഞത് 2 അക്ഷരങ്ങളെങ്കിലും വേണം.',
    }),
    email: z.string().email({
      message: language === 'en' ? 'Please enter a valid email address.' : 'ദയവായി ശരിയായ ഒരു ഇമെയിൽ വിലാസം നൽകുക.',
    }),
    star: z.string({ required_error: language === 'en' ? 'Please select your star.' : 'ദയവായി നിങ്ങളുടെ നക്ഷത്രം തിരഞ്ഞെടുക്കുക.' }),
    phone: z.string().optional(),
    address: z.string().optional(),
  }), [language]);

  const donationFormSchema = useMemo(() => z.object({
    amount: z.coerce.number().positive({
      message: language === 'en' ? 'Please enter a valid amount.' : 'ദയവായി ശരിയായ ഒരു തുക നൽകുക.',
    }),
    donationDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
      message: language === 'en' ? "A valid date is required." : "സാധുവായ ഒരു തീയതി ആവശ്യമാണ്.",
    }),
    name: z.string().min(2, {
      message: language === 'en' ? 'Name must be at least 2 characters.' : 'പേരിൽ കുറഞ്ഞത് 2 അക്ഷരങ്ങളെങ്കിലും വേണം.',
    }),
    star: z.string({ required_error: language === 'en' ? 'Please select your star.' : 'ദയവായി നിങ്ങളുടെ നക്ഷത്രം തിരഞ്ഞെടുക്കുക.' }),
    email: z.string().email({
      message: language === 'en' ? 'Please enter a valid email address.' : 'ദയവായി ശരിയായ ഒരു ഇമെയിൽ വിലാസം നൽകുക.',
    }),
    purpose: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }), [language]);


  const todayForm = useForm<z.infer<typeof offeringFormSchema>>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: {
      offeringId: '',
      bookingDate: format(new Date(), 'yyyy-MM-dd'),
      name: user?.displayName || '',
      email: user?.email || '',
      star: '',
      phone: '',
      address: '',
    },
  });

  const futureForm = useForm<z.infer<typeof offeringFormSchema>>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: {
      offeringId: '',
      bookingDate: format(new Date(), 'yyyy-MM-dd'),
      name: user?.displayName || '',
      email: user?.email || '',
      star: '',
      phone: '',
      address: '',
    },
  });

  const donationForm = useForm<z.infer<typeof donationFormSchema>>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      amount: '' as any,
      donationDate: format(new Date(), 'yyyy-MM-dd'),
      name: user?.displayName || '',
      star: '',
      email: user?.email || '',
      phone: '',
      address: '',
      purpose: '',
    },
  });

  // Update form defaults when user loads
  useEffect(() => {
    const userValues = {
      name: user?.displayName || '',
      email: user?.email || '',
    };
    todayForm.reset({ 
      ...todayForm.getValues(), 
      ...userValues,
      bookingDate: format(new Date(), 'yyyy-MM-dd')
    });
    futureForm.reset({ 
      ...futureForm.getValues(), 
      ...userValues,
      bookingDate: format(new Date(), 'yyyy-MM-dd')
    });
    donationForm.reset({ 
      ...donationForm.getValues(), 
      ...userValues,
      donationDate: format(new Date(), 'yyyy-MM-dd')
    });
  }, [user]);

  async function handleOfferingSubmit(values: z.infer<typeof offeringFormSchema>, form: any) {
    if (!firestore || !offeringsList || offeringsList.length === 0) {
       toast({ variant: 'destructive', title: 'Error', description: 'Offerings not loaded yet. Please try again in a moment.' });
       form.reset(values, { keepIsSubmitting: false });
      return;
    }

    const selectedOffering = offeringsList.find(o => o.id === values.offeringId);
    if (!selectedOffering) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected offering not found.' });
      form.reset(values, { keepIsSubmitting: false });
      return;
    }
    
    const tempId = `temp_${Date.now()}`;

    const bookingData: OfferingBooking = {
      id: tempId,
      offeringId: selectedOffering.id,
      offeringNameEn: selectedOffering.nameEn,
      offeringNameMl: selectedOffering.name,
      price: selectedOffering.price,
      userName: values.name,
      userEmail: values.email,
      bookingDate: new Date(values.bookingDate).toISOString(),
      submissionDate: new Date().toISOString(),
      star: values.star,
      phone: values.phone,
      language: language,
      paymentStatus: 'Pending',
      address: values.address,
      receiptSentAt: null,
    };
    
    setActiveRecord(bookingData);
    setPaymentAmount(selectedOffering.price);
    setPaymentType('booking');
    setPaymentDialogOpen(true);
    form.reset({}, { keepIsSubmitting: false, keepValues: false });
  }

  const onTodaySubmit = (values: z.infer<typeof offeringFormSchema>) => handleOfferingSubmit(values, todayForm);
  const onFutureSubmit = (values: z.infer<typeof offeringFormSchema>) => handleOfferingSubmit(values, futureForm);

  async function onDonationSubmit(values: z.infer<typeof donationFormSchema>) {
     if (!firestore) return;
     
     const tempId = `temp_${Date.now()}`;
     const donationData: Donation = {
       id: tempId,
       amount: values.amount,
       userName: values.name,
       star: values.star,
       userEmail: values.email,
       donationDate: new Date(values.donationDate).toISOString(),
       phone: values.phone,
       address: values.address,
       purpose: values.purpose,
       language: language,
       paymentStatus: 'Pending',
       receiptSentAt: null,
     };

      setActiveRecord(donationData);
      setPaymentAmount(values.amount);
      setPaymentType('donation');
      setPaymentDialogOpen(true);
      donationForm.reset({}, { keepIsSubmitting: false, keepValues: false });
  }

  const handlePaymentSuccess = async (savedRecord: OfferingBooking | Donation) => {
    setPaymentDialogOpen(false);
    setActiveRecord(savedRecord);
    setConfirmationDialogOpen(true);
  };

  const handleCloseAll = () => {
    setConfirmationDialogOpen(false);
    setActiveRecord(null);
    router.push('/');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 bg-background flex flex-col items-center justify-center py-20 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md p-8 bg-card border border-border rounded-xl shadow-lg"
          >
            <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-headline font-bold text-foreground mb-2">
              {language === 'en' ? 'Access Restricted' : 'പ്രവേശനം പരിമിതപ്പെടുത്തിയിരിക്കുന്നു'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === 'en' 
                ? 'Only registered devotees with account credentials can submit bookings, donations, or view records.'
                : 'അക്കൗണ്ട് വിവരങ്ങളുള്ള രജിസ്റ്റർ ചെയ്ത ഭക്തർക്ക് മാത്രമേ വഴിപാട് ബുക്കിംഗുകൾ, സംഭാവനകൾ അല്ലെങ്കിൽ മറ്റ് വിവരങ്ങൾ കാണാൻ സാധിക്കൂ.'}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setIsLoginOpen(true)} className="flex items-center gap-2">
                Login / Register
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                {language === 'en' ? 'Back to Home' : 'പ്രധാന പേജിലേക്ക്'}
              </Button>
            </div>
          </motion.div>
          <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <section id="income" className="container mx-auto px-4 py-8 md:py-16 scroll-mt-16 relative group">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
              {language === 'en' ? 'Temple Income Services' : 'ക്ഷേത്ര വരുമാന സേവനങ്ങൾ'}
            </h2>
            <p className="text-lg text-muted-foreground mt-2">
              {language === 'en'
                ? 'Support the temple through offerings, poojas, and generous donations'
                : 'വഴിപാടുകൾ, പൂജകൾ, ഉദാരമായ സംഭാവനകൾ എന്നിവയിലൂടെ ക്ഷേത്രത്തെ പിന്തുണയ്ക്കുക'}
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="today" className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className="flex w-max md:w-full bg-primary/10 p-1 mb-6">
                  <TabsTrigger
                    value="today"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === 'en' ? "Today's Booking" : "ഇന്നത്തെ വഴിപാട്"}</span>
                    <span className="sm:hidden">{language === 'en' ? 'Today' : 'ഇന്ന്'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="offerings"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Future Booking' : 'ഭാവിയിലെ വഴിപാട്'}</span>
                    <span className="sm:hidden">{language === 'en' ? 'Future' : 'ഭാവി'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="donations"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4"
                  >
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Donations' : 'സംഭാവനകൾ'}</span>
                    <span className="sm:hidden">{language === 'en' ? 'Donation' : 'സംഭാവന'}</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="offerings">
                <Card className="border-accent/30 max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle>
                      {language === 'en'
                        ? 'Book Offering for Future Date'
                        : 'ഭാവി തീയതിയിലേക്കായി വഴിപാട് ബുക്ക് ചെയ്യുക'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'en'
                        ? 'Select a future date for your offerings and poojas.'
                        : 'ഭാവിയിലെ വഴിപാടുകൾക്കും പൂജകൾക്കുമായി ഒരു തീയതി തിരഞ്ഞെടുക്കുക.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...futureForm}>
                      <form
                        onSubmit={futureForm.handleSubmit(onFutureSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={futureForm.control}
                            name="offeringId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'en'
                                    ? 'Select Offering'
                                    : 'വഴിപാട് തിരഞ്ഞെടുക്കുക'}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={loading || !offeringsList || offeringsList.length === 0}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={
                                          loading 
                                          ? (language === 'en' ? "Loading offerings..." : "വഴിപാടുകൾ ലോഡ് ചെയ്യുന്നു...")
                                          : language === 'en'
                                            ? 'Select a vazhipadu'
                                            : 'ഒരു വഴിപാട് തിരഞ്ഞെടുക്കുക'
                                        }
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {offeringsList && offeringsList.map((offering) => (
                                      <SelectItem
                                        key={offering.id}
                                        value={offering.id}
                                      >
                                        {language === 'en'
                                          ? `${offering.nameEn} (₹${offering.price})`
                                          : `${offering.name} (₹${offering.price})`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={futureForm.control}
                            name="bookingDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Date of Offering' : 'വഴിപാട് നടത്തേണ്ട തീയതി'}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    className="w-full" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={futureForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'en' ? 'Name' : 'പേര്'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      language === 'en'
                                        ? 'Your full name'
                                        : 'നിങ്ങളുടെ മുഴുവൻ പേര്'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={futureForm.control}
                            name="star"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Star' : 'നക്ഷത്രം'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={language === 'en' ? 'Select your birth star' : 'നിങ്ങളുടെ നക്ഷത്രം തിരഞ്ഞെടുക്കുക'} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {stars.map((star) => (
                                      <SelectItem key={star.ml} value={language === 'en' ? star.en : star.ml}>
                                        {language === 'en' ? star.en : star.ml}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={futureForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'en' ? 'Phone No' : 'ഫോൺ നമ്പർ'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      language === 'en'
                                        ? 'Your contact number'
                                        : 'നിങ്ങളുടെ ഫോൺ നമ്പർ'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={futureForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'en' ? 'Email' : 'ഇമെയിൽ'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      language === 'en'
                                        ? 'Your email address'
                                        : 'നിങ്ങളുടെ ഇമെയിൽ വിലാസം'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  {language === 'en'
                                    ? 'Your receipt will be sent to this email.'
                                    : 'രസീത് ഈ ഇമെയിലിലേക്ക് അയക്കും.'}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                         <FormField
                          control={futureForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === 'en' ? 'Address' : 'വിലാസം'}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={
                                    language === 'en'
                                      ? 'Your full address'
                                      : 'നിങ്ങളുടെ മുഴുവൻ വിലാസം'
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          disabled={futureForm.formState.isSubmitting || loading || !offeringsList || offeringsList.length === 0}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {language === 'en'
                            ? 'Submit Future Booking'
                            : 'ഭാവിയിലേക്ക് ബുക്ക് ചെയ്യുക'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="today">
                <div className="space-y-8">
                  <Card className="border-accent/30 max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-primary" />
                        {language === 'en' ? "Book Offering for Today" : "ഇന്നത്തേക്ക് വഴിപാട് ബുക്ക് ചെയ്യുക"}
                      </CardTitle>
                      <CardDescription>
                        {language === 'en'
                          ? `Submit an offering for today, ${format(new Date(), 'PP')}`
                          : `ഇന്നത്തെ (${format(new Date(), 'PP')}) വഴിപാടുകൾ സമർപ്പിക്കുക.`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...todayForm}>
                        <form
                          onSubmit={todayForm.handleSubmit(onTodaySubmit)}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={todayForm.control}
                                name="offeringId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {language === 'en' ? 'Select Offering' : 'വഴിപാട് തിരഞ്ഞെടുക്കുക'}
                                    </FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      value={field.value}
                                      disabled={loading || !offeringsList || offeringsList.length === 0}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={
                                              loading 
                                              ? (language === 'en' ? "Loading offerings..." : "വഴിപാടുകൾ ലോഡ് ചെയ്യുന്നു...")
                                              : language === 'en'
                                                ? 'Select an offering'
                                                : 'വഴിപാട് തിരഞ്ഞെടുക്കുക'
                                            }
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {offeringsList?.map((offering) => (
                                          <SelectItem key={offering.id} value={offering.id}>
                                            {language === 'en'
                                              ? `${offering.nameEn} (₹${offering.price})`
                                              : `${offering.name} (₹${offering.price})`}
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
                                  <FormLabel>
                                    {language === 'en' ? 'Date of Offering' : 'വഴിപാട് നടത്തേണ്ട തീയതി'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} disabled className="bg-muted" />
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
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'Your full name'
                                          : 'നിങ്ങളുടെ മുഴുവൻ പേര്'
                                      }
                                      {...field}
                                    />
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
                                        <SelectValue
                                          placeholder={
                                            language === 'en'
                                              ? 'Select your birth star'
                                              : 'നിങ്ങളുടെ നക്ഷത്രം തിരഞ്ഞെടുക്കുക'
                                          }
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {stars.map((star) => (
                                        <SelectItem
                                          key={star.ml}
                                          value={language === 'en' ? star.en : star.ml}
                                        >
                                          {language === 'en' ? star.en : star.ml}
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
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === 'en' ? 'Phone No' : 'ഫോൺ നമ്പർ'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'Your contact number'
                                          : 'നിങ്ങളുടെ ഫോൺ നമ്പർ'
                                      }
                                      {...field}
                                    />
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
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'Your email address'
                                          : 'നിങ്ങളുടെ ഇമെയിൽ വിലാസം'
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    {language === 'en'
                                      ? 'Your receipt will be sent to this email.'
                                      : 'രസീത് ഈ ഇമെയിലിലേക്ക് അയക്കും.'}
                                  </FormDescription>
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
                                  <Textarea
                                    placeholder={
                                      language === 'en'
                                        ? 'Your full address'
                                        : 'നിങ്ങളുടെ മുഴുവൻ വിലാസം'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={todayForm.formState.isSubmitting}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {language === 'en' ? 'Submit Offering' : 'വഴിപാട് സമർപ്പിക്കുക'}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card className="border-accent/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {language === 'en' ? "Today's Offering List" : "ഇന്നത്തെ വഴിപാട് പട്ടിക"}
                      </CardTitle>
                      <CardDescription>
                        {language === 'en' 
                          ? `List of offerings scheduled for today, ${format(new Date(), 'PP')}`
                          : `ഇന്നത്തെ (${format(new Date(), 'PP')}) വഴിപാടുകളുടെ പട്ടിക`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {bookingsLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : todayBookings.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                          <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            {language === 'en' ? 'No offerings booked for today.' : 'ഇന്നത്തേക്ക് വഴിപാടുകൾ ഒന്നും ബുക്ക് ചെയ്തിട്ടില്ല.'}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead>{language === 'en' ? 'Name' : 'പേര്'}</TableHead>
                                <TableHead>{language === 'en' ? 'Star' : 'നക്ഷത്രം'}</TableHead>
                                <TableHead>{language === 'en' ? 'Offering' : 'വഴിപാട്'}</TableHead>
                                <TableHead className="text-right">{language === 'en' ? 'Amount' : 'തുക'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {todayBookings.map((booking) => (
                                <TableRow key={booking.id}>
                                  <TableCell className="font-medium">{booking.userName}</TableCell>
                                  <TableCell>{booking.star}</TableCell>
                                  <TableCell>
                                    {language === 'en' ? booking.offeringNameEn : booking.offeringNameMl}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">₹{booking.price}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="donations">
                <div className="space-y-8">
                  <Card className="border-accent/30 max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-primary" />
                        {language === 'en' ? 'Make a Donation' : 'സംഭാവന ചെയ്യുക'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'en'
                          ? 'Your generous contribution helps maintain the temple.'
                          : 'നിങ്ങളുടെ ഉദാരമായ സംഭാവന ക്ഷേത്രം പരിപാലിക്കാൻ സഹായിക്കുന്നു.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...donationForm}>
                        <form
                          onSubmit={donationForm.handleSubmit(onDonationSubmit)}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={donationForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === 'en' ? 'Amount (INR)' : 'തുക (INR)'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder={
                                        language === 'en'
                                          ? 'Enter amount'
                                          : 'തുക നൽകുക'
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={donationForm.control}
                              name="donationDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{language === 'en' ? 'Date of Donation' : 'സംഭാവന തീയതി'}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      className="w-full" 
                                    />
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
                                  <FormLabel>
                                    {language === 'en' ? 'Purpose' : 'ഉദ്ദേശ്യം'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'e.g., Temple renovation'
                                          : 'ഉദാ: ക്ഷേത്ര നവീകരണം'
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={donationForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === 'en' ? 'Name' : 'പേര്'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'Your full name'
                                          : 'നിങ്ങളുടെ മുഴുവൻ പേര്'
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={donationForm.control}
                              name="star"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{language === 'en' ? 'Star' : 'നക്ഷത്രം'}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={language === 'en' ? 'Select your birth star' : 'നിങ്ങളുടെ നക്ഷത്രം തിരഞ്ഞെടുക്കുക'} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {stars.map((star) => (
                                        <SelectItem key={star.ml} value={language === 'en' ? star.en : star.ml}>
                                          {language === 'en' ? star.en : star.ml}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={donationForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === 'en' ? 'Phone No' : 'ഫോൺ നമ്പർ'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'Your contact number'
                                          : 'നിങ്ങളുടെ ഫോൺ നമ്പർ'
                                      }
                                      {...field}
                                    />
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
                                  <FormLabel>
                                    {language === 'en' ? 'Email' : 'ഇമെയിൽ'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={
                                        language === 'en'
                                          ? 'Your email address'
                                          : 'നിങ്ങളുടെ ഇമെയിൽ വിലാസം'
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    {language === 'en'
                                      ? 'Your receipt will be sent to this email.'
                                      : 'രസീത് ഈ ഇമെയിലിലേക്ക് അയക്കും.'}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={donationForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'en' ? 'Address' : 'വിലാസം'}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={
                                      language === 'en'
                                        ? 'Your full address'
                                        : 'നിങ്ങളുടെ മുഴുവൻ വിലാസം'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                         
                          <Button
                            type="submit"
                            disabled={donationForm.formState.isSubmitting}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {language === 'en' ? 'Submit Donation' : 'സംഭാവന സമർപ്പിക്കുക'}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card className="border-accent/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        {language === 'en' ? 'Recent Donations' : 'സമീപകാലത്തെ സംഭാവനകൾ'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'en' 
                          ? 'History of contributions received'
                          : 'ലഭിച്ച സംഭാവനകളുടെ ചരിത്രം'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {donationsLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : allDonations.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                          <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            {language === 'en' ? 'No donations found.' : 'സംഭാവനകൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead>{language === 'en' ? 'Date' : 'തീയതി'}</TableHead>
                                <TableHead>{language === 'en' ? 'Name' : 'പേര്'}</TableHead>
                                <TableHead>{language === 'en' ? 'Purpose' : 'ഉദ്ദേശ്യം'}</TableHead>
                                <TableHead className="text-right">{language === 'en' ? 'Amount' : 'തുക'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allDonations.map((donation) => (
                                <TableRow key={donation.id}>
                                  <TableCell className="text-sm font-mono whitespace-nowrap">
                                    {format(new Date(donation.donationDate), 'dd/MM/yyyy')}
                                  </TableCell>
                                  <TableCell className="font-medium">{donation.userName}</TableCell>
                                  <TableCell className="text-sm italic">
                                    {donation.purpose || (language === 'en' ? 'General' : 'പൊതുവായത്')}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-bold text-emerald-600">₹{donation.amount}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
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
    </>
  );
}
