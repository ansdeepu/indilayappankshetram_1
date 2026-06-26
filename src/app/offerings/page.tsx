
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useFirestore } from '@/firebase';
import { useState, useMemo } from 'react';
import { collection, query, orderBy, addDoc } from 'firebase/firestore';
import type { Offering, OfferingBooking, Donation } from '@/lib/types';
import { stars } from '@/lib/nakshatra';
import { useCollection } from '@/firebase';
import { PaymentDialog } from '@/components/payment/payment-dialog';
import { ConfirmationDialog } from '@/components/payment/confirmation-dialog';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';

export default function OfferingsPage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const firestore = useFirestore();
  const router = useRouter();

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


  const offeringForm = useForm<z.infer<typeof offeringFormSchema>>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: {
      offeringId: '',
      bookingDate: '',
      name: '',
      email: '',
      star: '',
      phone: '',
      address: '',
    },
  });

  const donationForm = useForm<z.infer<typeof donationFormSchema>>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      amount: '' as any,
      name: '',
      star: '',
      email: '',
      phone: '',
      address: '',
      purpose: '',
    },
  });

  async function onOfferingSubmit(values: z.infer<typeof offeringFormSchema>) {
    if (!firestore || !offeringsList || offeringsList.length === 0) {
       toast({ variant: 'destructive', title: 'Error', description: 'Offerings not loaded yet. Please try again in a moment.' });
       offeringForm.reset(values, { keepIsSubmitting: false });
      return;
    }

    const selectedOffering = offeringsList.find(o => o.id === values.offeringId);
    if (!selectedOffering) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected offering not found.' });
      offeringForm.reset(values, { keepIsSubmitting: false });
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
    offeringForm.reset({}, { keepIsSubmitting: false, keepValues: false });
  }

  async function onDonationSubmit(values: z.infer<typeof donationFormSchema>) {
     if (!firestore) return;
     
     const tempId = `temp_${Date.now()}`;
     const donationData: Donation = {
       id: tempId,
       amount: values.amount,
       userName: values.name,
       star: values.star,
       userEmail: values.email,
       donationDate: new Date().toISOString(),
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

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section id="offerings" className="container mx-auto px-4 py-8 md:py-16 scroll-mt-16 relative group">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
              {language === 'en' ? 'Online Seva' : 'ഓൺലൈൻ സേവനം'}
            </h2>
            <p className="text-lg text-muted-foreground mt-2">
              {language === 'en'
                ? 'Make your offerings and donations online'
                : 'നിങ്ങളുടെ വഴിപാടുകളും സംഭാവനകളും ഓൺലൈനായി സമർപ്പിക്കുക'}
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="offerings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-primary/10">
                <TabsTrigger
                  value="offerings"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {language === 'en' ? 'Offerings' : 'വഴിപാട്'}
                </TabsTrigger>
                <TabsTrigger
                  value="donations"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {language === 'en' ? 'Donations' : 'സംഭാവന'}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="offerings">
                <Card className="border-accent/30">
                  <CardHeader>
                    <CardTitle>
                      {language === 'en'
                        ? 'Book an Offering'
                        : 'ഒരു വഴിപാട് ബുക്ക് ചെയ്യുക'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'en'
                        ? 'Select a vazhipadu to offer to the deity.'
                        : 'ദേവന് സമർപ്പിക്കാൻ ഒരു വഴിപാട് തിരഞ്ഞെടുക്കുക.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...offeringForm}>
                      <form
                        onSubmit={offeringForm.handleSubmit(onOfferingSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={offeringForm.control}
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
                                  disabled={loading || !offeringsList}
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
                            control={offeringForm.control}
                            name="bookingDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'en' ? 'Date of Offering' : 'വഴിപാട് നടത്തേണ്ട തീയതി'}</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={offeringForm.control}
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
                            control={offeringForm.control}
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
                            control={offeringForm.control}
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
                            control={offeringForm.control}
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
                          control={offeringForm.control}
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
                          disabled={offeringForm.formState.isSubmitting || loading || !offeringsList || offeringsList.length === 0}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {language === 'en'
                            ? 'Submit'
                            : 'സമർപ്പിക്കുക'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="donations">
                <Card className="border-accent/30">
                  <CardHeader>
                    <CardTitle>
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
                          {language === 'en' ? 'Submit' : 'സമർപ്പിക്കുക'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
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

    

    
