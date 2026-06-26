'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Printer, 
  Download, 
  Filter, 
  FileText, 
  Building,
  ArrowRight,
  ShieldAlert,
  Loader2,
  PieChart as PieIcon,
  ChevronDown,
  LayoutGrid,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  History,
  FileCheck,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { LoginDialog } from '@/components/auth/login-dialog';
import { cn } from '@/lib/utils';
import { Expenditure, OfferingBooking, Donation } from '@/lib/types';

import { 
  INCOME_CATEGORIES, 
  EXPENDITURE_CATEGORIES,
  type FinanceCategory,
  type SubCategory
} from '@/lib/finance-data';

// Constants for charts colors
const COLORS = ['#d97706', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];

export default function ReportPage() {
  const { language } = useLanguage();
  const { user, isAdmin, isManager, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Queries to fetch the actual Firestore data
  const bookingsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'offeringBookings'), orderBy('submissionDate', 'desc'));
  }, [firestore, user]);

  const donationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'donations'), orderBy('donationDate', 'desc'));
  }, [firestore, user]);

  const expendituresQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'expenditures'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: dbBookings, loading: bookingsLoading } = useCollection<OfferingBooking>(bookingsQuery);
  const { data: dbDonations, loading: donationsLoading } = useCollection<Donation>(donationsQuery);
  const { data: dbExpenditures, loading: expendituresLoading } = useCollection<Expenditure>(expendituresQuery);

  const dataLoading = bookingsLoading || donationsLoading || expendituresLoading;

  // Predefined seed fallback data for elegant presentation when firestore data is empty
  const fallbackBookings: any[] = useMemo(() => [
    { id: 'b1', price: 1500, bookingDate: '2026-01-10', submissionDate: '2026-01-09T10:00:00Z', offeringNameEn: 'Neyyabhishekam', offeringNameMl: 'നെയ്യഭിഷേകം', userName: 'Anil Kumar', paymentStatus: 'Paid' },
    { id: 'b2', price: 500, bookingDate: '2026-01-12', submissionDate: '2026-01-11T11:30:00Z', offeringNameEn: 'Ganapathi Homam', offeringNameMl: 'ഗണപതി ഹോമം', userName: 'Sunitha Nair', paymentStatus: 'Paid' },
    { id: 'b3', price: 3000, bookingDate: '2026-02-15', submissionDate: '2026-02-14T09:15:00Z', offeringNameEn: 'Muzhukaapu', offeringNameMl: 'മുഴുക്കാപ്പ്', userName: 'Rajesh Pillai', paymentStatus: 'Paid' },
    { id: 'b4', price: 150, bookingDate: '2026-02-20', submissionDate: '2026-02-20T08:00:00Z', offeringNameEn: 'Archana', offeringNameMl: 'അർച്ചന', userName: 'Sreejith S.', paymentStatus: 'Paid' },
    { id: 'b5', price: 2000, bookingDate: '2026-03-01', submissionDate: '2026-02-28T16:45:00Z', offeringNameEn: 'Bhagavathi Seva', offeringNameMl: 'ഭഗവതി സേവ', userName: 'Radhika Amma', paymentStatus: 'Paid' },
    { id: 'b6', price: 500, bookingDate: '2026-03-11', submissionDate: '2026-03-10T14:20:00Z', offeringNameEn: 'Ganapathi Homam', offeringNameMl: 'ഗണപതി ഹോമം', userName: 'Gopalakrishnan', paymentStatus: 'Paid' },
    { id: 'b7', price: 1500, bookingDate: '2026-04-05', submissionDate: '2026-04-04T10:00:00Z', offeringNameEn: 'Neyyabhishekam', offeringNameMl: 'നെയ്യഭിഷേകം', userName: 'Vijay Shankar', paymentStatus: 'Paid' },
    { id: 'b8', price: 150, bookingDate: '2026-04-12', submissionDate: '2026-04-12T07:30:00Z', offeringNameEn: 'Archana', offeringNameMl: 'അർച്ചന', userName: 'Mini Mohan', paymentStatus: 'Paid' },
    { id: 'b9', price: 3000, bookingDate: '2026-05-10', submissionDate: '2026-05-09T09:10:00Z', offeringNameEn: 'Muzhukaapu', offeringNameMl: 'മുഴുക്കാപ്പ്', userName: 'Harikrishnan', paymentStatus: 'Paid' },
    { id: 'b10', price: 1200, bookingDate: '2026-06-01', submissionDate: '2026-05-31T15:00:00Z', offeringNameEn: 'Payasa Nivedyam', offeringNameMl: 'പായസ നിവേദ്യം', userName: 'Devika Nair', paymentStatus: 'Paid' },
  ], []);

  const fallbackDonations: any[] = useMemo(() => [
    { id: 'd1', amount: 5000, donationDate: '2026-01-05T08:00:00Z', userName: 'Narayana Kurup', purpose: 'Annadanam Sponsorship', paymentStatus: 'Paid' },
    { id: 'd2', amount: 10000, donationDate: '2026-02-14T10:30:00Z', userName: 'Sivasankara Pillai', purpose: 'Temple Gold Plate Fund', paymentStatus: 'Paid' },
    { id: 'd3', amount: 2500, donationDate: '2026-03-15T14:00:00Z', userName: 'Madhavan Unni', purpose: 'Sivarathri Feast Contribution', paymentStatus: 'Paid' },
    { id: 'd4', amount: 5000, donationDate: '2026-04-10T11:00:00Z', userName: 'Sreedevi Antharjanam', purpose: 'Vishu Sadhya Donation', paymentStatus: 'Paid' },
    { id: 'd5', amount: 20000, donationDate: '2026-05-12T15:20:00Z', userName: 'Indira Balakrishnan', purpose: 'General Maintenance Support', paymentStatus: 'Paid' },
    { id: 'd6', amount: 3500, donationDate: '2026-06-18T09:15:00Z', userName: 'Raman Namboothiri', purpose: 'Pradosha Pooja Sponsorship', paymentStatus: 'Paid' },
  ], []);

  const fallbackExpenditures: any[] = useMemo(() => [
    { id: 'e1', amount: 4500, date: '2026-01-15', categoryEn: 'Daily Rituals & Pooja Expenses', categoryMl: 'നിത്യപൂജാ ചെലവുകൾ', subCategoryEn: 'Pooja Materials & Consumables', subCategoryMl: 'പൂജാ സാധനങ്ങൾ', descriptionEn: 'Sandalwood paste, incense, oil and camphor', descriptionMl: 'ചന്ദനം, കുന്തിരിക്കം, എണ്ണ, കർപ്പൂരം' },
    { id: 'e2', amount: 8000, date: '2026-01-28', categoryEn: 'Administration & Staff Wages', categoryMl: 'ശമ്പളവും മറ്റ് ചെലവുകളും', subCategoryEn: 'Staff Honorarium & Salaries', subCategoryMl: 'ശമ്പളം', descriptionEn: 'Monthly salary advance for Santhikar & Assistants', descriptionMl: 'ശാന്തിമാർക്കുള്ള ശമ്പള അഡ്വാൻസ്' },
    { id: 'e3', amount: 3500, date: '2026-02-12', categoryEn: 'Daily Rituals & Pooja Expenses', categoryMl: 'നിത്യപൂജാ ചെലവുകൾ', subCategoryEn: 'Prasadam & Nivedyam Preparation', subCategoryMl: 'പ്രസാദവും നിവേദ്യവും', descriptionEn: 'Rice and jaggery purchase for Payasam', descriptionMl: 'പായസത്തിന് ആവശ്യമായ അരിയും ശർക്കരയും' },
    { id: 'e4', amount: 15000, date: '2026-02-18', categoryEn: 'Festival & Special Event Costs', categoryMl: 'ഉത്സവ ചെലവുകൾ', subCategoryEn: 'Decorations & Audio Settings', subCategoryMl: 'അലങ്കാരങ്ങളും ശബ്ദസംവിധാനവും', descriptionEn: 'Sivarathri festival light setup deposit', descriptionMl: 'ശിവരാത്രി അലങ്കാര വിളക്കുകൾ അഡ്വാൻസ്' },
    { id: 'e5', amount: 5000, date: '2026-03-10', categoryEn: 'Infrastructure & Maintenance', categoryMl: 'അടിസ്ഥാന സൗകര്യ വികസനം', subCategoryEn: 'Temple Compound Cleaning', subCategoryMl: 'വൃത്തിയാക്കൽ ജോലികൾ', descriptionEn: 'Pre-festival cleanup and water tank wash', descriptionMl: 'ക്ഷേത്ര വളപ്പ് വൃത്തിയാക്കലും ടാങ്ക് കഴുകലും' },
    { id: 'e6', amount: 6000, date: '2026-03-25', categoryEn: 'Charity & Community Welfare', categoryMl: 'ജീവകാരുണ്യ പ്രവർത്തനങ്ങൾ', subCategoryEn: 'Medical Aid for Needy', subCategoryMl: 'ചികിത്സാ സഹായം', descriptionEn: 'Financial assistance for treatment of local devotee', descriptionMl: 'ചികിത്സാ ധനസഹായം' },
    { id: 'e7', amount: 12000, date: '2026-04-15', categoryEn: 'Festival & Special Event Costs', categoryMl: 'ഉത്സവ ചെലവുകൾ', subCategoryEn: 'Traditional Music (Chenda Melam)', subCategoryMl: 'മേളപ്രമാണം', descriptionEn: 'Vishu special chendamelam artists honorarium', descriptionMl: 'വിഷു മേള കലാകാരന്മാർക്കുള്ള ദക്ഷിണ' },
    { id: 'e8', amount: 2200, date: '2026-04-20', categoryEn: 'Daily Rituals & Pooja Expenses', categoryMl: 'നിത്യപൂജാ ചെലവുകൾ', subCategoryEn: 'Pooja Materials & Consumables', subCategoryMl: 'പൂജാ സാധനങ്ങൾ', descriptionEn: 'Fresh lotus flower suppliers payment', descriptionMl: 'താമരപ്പൂവ് നൽകുന്നവർക്കുള്ള തുക' },
    { id: 'e9', amount: 14000, date: '2026-05-18', categoryEn: 'Infrastructure & Maintenance', categoryMl: 'അടിസ്ഥാന സൗകര്യ വികസനം', subCategoryEn: 'Electrical Maintenance', subCategoryMl: 'വൈദ്യുതീകരണം', descriptionEn: 'Rewiring of temple chuttu-vilakku area', descriptionMl: 'ചുറ്റുവിളക്ക് വൈദ്യുതീകരണ പണികൾ' },
    { id: 'e10', amount: 8000, date: '2026-06-10', categoryEn: 'Administration & Staff Wages', categoryMl: 'ശമ്പളവും മറ്റ് ചെലവുകളും', subCategoryEn: 'Office Administration', subCategoryMl: 'ഓഫീസ് ചെലവുകൾ', descriptionEn: 'Accountant monthly allowance & stationary', descriptionMl: 'അക്കൗണ്ടന്റ് ശമ്പളവും സ്റ്റേഷനറിയും' },
  ], []);

  // Use DB data if populated, otherwise merge fallback
  const bookings = useMemo(() => {
    const list = dbBookings && dbBookings.length > 0 ? dbBookings : fallbackBookings;
    return list.filter((b: any) => b.paymentStatus === 'Paid');
  }, [dbBookings, fallbackBookings]);

  const donations = useMemo(() => {
    const list = dbDonations && dbDonations.length > 0 ? dbDonations : fallbackDonations;
    return list.filter((d: any) => d.paymentStatus === 'Paid' || !d.paymentStatus);
  }, [dbDonations, fallbackDonations]);

  const expenditures = useMemo(() => {
    return dbExpenditures && dbExpenditures.length > 0 ? dbExpenditures : fallbackExpenditures;
  }, [dbExpenditures, fallbackExpenditures]);

  // Aggregate and Filter Data based on selected calendar criteria
  const { filteredBookings, filteredDonations, filteredExpendituresList, unifiedLedger } = useMemo(() => {
    const filterFn = (item: any, dateField: string) => {
      const dStr = item[dateField];
      if (!dStr) return false;
      const date = new Date(dStr);
      const y = date.getFullYear().toString();
      const m = (date.getMonth() + 1).toString(); // 1-12
      
      const yearMatches = y === selectedYear;
      const monthMatches = selectedMonth === 'all' || m === selectedMonth;
      return yearMatches && monthMatches;
    };

    const fBookings = bookings.filter((b: any) => filterFn(b, b.bookingDate || b.submissionDate));
    const fDonations = donations.filter((d: any) => filterFn(d, d.donationDate));
    const fExpenditures = expenditures.filter((e: any) => filterFn(e, e.date));

    // Create a unified chronological ledger
    const ledger = [
      ...fBookings.map(b => ({
        id: b.id,
        date: b.bookingDate || b.submissionDate,
        type: 'Income',
        category: language === 'en' ? INCOME_CATEGORIES[0].nameEn : INCOME_CATEGORIES[0].nameMl,
        description: language === 'en' ? b.offeringNameEn : b.offeringNameMl || b.offeringNameEn,
        name: b.userName,
        amount: Number(b.price || 0),
        status: 'Plus'
      })),
      ...fDonations.map(d => ({
        id: d.id,
        date: d.donationDate,
        type: 'Income',
        category: language === 'en' ? INCOME_CATEGORIES[1].nameEn : INCOME_CATEGORIES[1].nameMl,
        description: d.purpose || (language === 'en' ? 'General Donation' : 'പൊതു സംഭാവന'),
        name: d.userName,
        amount: Number(d.amount || 0),
        status: 'Plus'
      })),
      ...fExpenditures.map(e => ({
        id: e.id,
        date: e.date,
        type: 'Expenditure',
        category: language === 'en' ? e.categoryEn : e.categoryMl || e.categoryEn,
        description: language === 'en' ? e.descriptionEn : e.descriptionMl || e.descriptionEn,
        name: language === 'en' ? e.subCategoryEn : e.subCategoryMl || e.subCategoryEn,
        amount: Number(e.amount || 0),
        status: 'Minus'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      filteredBookings: fBookings,
      filteredDonations: fDonations,
      filteredExpendituresList: fExpenditures,
      unifiedLedger: ledger
    };
  }, [bookings, donations, expenditures, selectedYear, selectedMonth, language]);

  // Calculations
  const { totalBookingsAmount, totalDonationsAmount, totalIncome, totalExpenditure, netBalance } = useMemo(() => {
    const bAmt = filteredBookings.reduce((sum: number, b: any) => sum + (Number(b.price) || 0), 0);
    const dAmt = filteredDonations.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
    const inc = bAmt + dAmt;
    const exp = filteredExpendituresList.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    
    return {
      totalBookingsAmount: bAmt,
      totalDonationsAmount: dAmt,
      totalIncome: inc,
      totalExpenditure: exp,
      netBalance: inc - exp
    };
  }, [filteredBookings, filteredDonations, filteredExpendituresList]);

  // Monthly breakdown for Income vs Expenditure chart
  const monthlyBarChartData = useMemo(() => {
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesMl = ['ജനു', 'ഫെബ്രു', 'മാർ', 'ഏപ്രി', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗ', 'സെപ്റ്റ', 'ഒക്ടോ', 'നവം', 'ഡിസം'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const mBookings = bookings.filter((b: any) => {
        const d = new Date(b.bookingDate || b.submissionDate);
        return d.getFullYear().toString() === selectedYear && (d.getMonth() + 1) === monthNum;
      });
      const mDonations = donations.filter((d: any) => {
        const date = new Date(d.donationDate);
        return date.getFullYear().toString() === selectedYear && (date.getMonth() + 1) === monthNum;
      });
      const mExpenditures = expenditures.filter((e: any) => {
        const d = new Date(e.date);
        return d.getFullYear().toString() === selectedYear && (d.getMonth() + 1) === monthNum;
      });

      const inc = mBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0) + 
                  mDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const exp = mExpenditures.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return {
        month: language === 'ml' ? monthNamesMl[i] : monthNamesEn[i],
        Income: inc,
        Expenditure: exp,
        Balance: inc - exp,
      };
    }).filter(data => selectedMonth === 'all' || selectedMonth === (monthNamesEn.indexOf(data.month) + 1).toString() || selectedMonth === (monthNamesMl.indexOf(data.month) + 1).toString() || data.Income > 0 || data.Expenditure > 0);
  }, [bookings, donations, expenditures, selectedYear, selectedMonth, language]);

  // Pie chart data: Income Breakdown by shared categories
  const incomePieData = useMemo(() => {
    const categoriesMap: { [key: string]: number } = {};
    
    // Default mappings for existing data
    const ritualsCat = language === 'en' ? INCOME_CATEGORIES[0].nameEn : INCOME_CATEGORIES[0].nameMl;
    const donationsCat = language === 'en' ? INCOME_CATEGORIES[1].nameEn : INCOME_CATEGORIES[1].nameMl;

    categoriesMap[ritualsCat] = totalBookingsAmount;
    categoriesMap[donationsCat] = totalDonationsAmount;

    return Object.entries(categoriesMap).map(([name, value]) => ({
      name,
      value
    })).filter(d => d.value > 0);
  }, [totalBookingsAmount, totalDonationsAmount, language]);

  // Pie chart data: Expenditure Breakdown by Category
  const expenditurePieData = useMemo(() => {
    const categoriesMap: { [key: string]: number } = {};
    filteredExpendituresList.forEach((e: any) => {
      const categoryName = language === 'en' ? e.categoryEn : e.categoryMl || e.categoryEn;
      categoriesMap[categoryName] = (categoriesMap[categoryName] || 0) + Number(e.amount);
    });

    return Object.entries(categoriesMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpendituresList, language]);

  // Handle printing of the financial statements
  const handlePrint = () => {
    window.print();
  };

  // Guard routing based on authorization
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect standard/non-logged users or visitors gracefully
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
                ? 'Only registered devotees with account credentials can view accounts, financial reports, and records.'
                : 'അക്കൗണ്ട് വിവരങ്ങളുള്ള രജിസ്റ്റർ ചെയ്ത ഭക്തർക്ക് മാത്രമേ ധനകാര്യ റിപ്പോർട്ടുകളും വിവരങ്ങളും കാണാൻ സാധിക്കൂ.'}
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

  // Set months list
  const months = [
    { value: 'all', labelEn: 'All Months', labelMl: 'എല്ലാ മാസങ്ങളും' },
    { value: '1', labelEn: 'January', labelMl: 'ജനുവരി' },
    { value: '2', labelEn: 'February', labelMl: 'ഫെബ്രുവരി' },
    { value: '3', labelEn: 'March', labelMl: 'മാർച്ച്' },
    { value: '4', labelEn: 'April', labelMl: 'ഏപ്രിൽ' },
    { value: '5', labelEn: 'May', labelMl: 'മേയ്' },
    { value: '6', labelEn: 'June', labelMl: 'ജൂൺ' },
    { value: '7', labelEn: 'July', labelMl: 'ജൂലൈ' },
    { value: '8', labelEn: 'August', labelMl: 'ഓഗസ്റ്റ്' },
    { value: '9', labelEn: 'September', labelMl: 'സെപ്റ്റംബർ' },
    { value: '10', labelEn: 'October', labelMl: 'ഒക്ടോബർ' },
    { value: '11', labelEn: 'November', labelMl: 'നവംബർ' },
    { value: '12', labelEn: 'December', labelMl: 'ഡിസംബർ' },
  ];

  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <main className="flex-1 bg-background py-8 md:py-16 print:py-0 print:bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header Block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border/60 pb-6 print:mb-6 print:pb-4 print:border-neutral-300">
            <div>
              <div className="flex items-center gap-2 mb-1 print:hidden">
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {language === 'en' ? 'Financial Audit Statement' : 'ധനകാര്യ ഓഡിറ്റ് റിപ്പോർട്ട്'}
                </Badge>
                {isAdmin && (
                  <Badge className="bg-emerald-600 text-white">Admin Access Granted</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-wide print:text-2xl print:text-neutral-900">
                {language === 'en' ? 'Temple Financial Reports' : 'ക്ഷേത്ര കണക്കുകളും റിപ്പോർട്ടുകളും'}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm print:text-neutral-500">
                {language === 'en'
                  ? `Detailed audit ledger and income-expenditure statement for Indilayappan Kshetram.`
                  : `ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലെ വരവ്-ചെലവ് വിവരങ്ങളും സമഗ്രമായ ഓഡിറ്റ് റിപ്പോർട്ടും.`}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2 border-primary/20 hover:bg-primary/5">
                <Printer className="h-4 w-4 text-primary" />
                {language === 'en' ? 'Print Statement' : 'പ്രിന്റ് റിപ്പോർട്ട്'}
              </Button>
            </div>
          </div>

          {/* Audit / Print Header - Only shown during printing */}
          <div className="hidden print:block mb-8 text-center border-b pb-4 border-neutral-300">
            <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-800">Indilayappan Temple Devastanam</h2>
            <p className="text-sm text-neutral-600 font-serif">Official Financial Audit Statement & Balanced ledger</p>
            <div className="flex justify-between items-center text-xs text-neutral-500 mt-4">
              <span><strong>Fiscal Year:</strong> {selectedYear}</span>
              <span><strong>Reporting Criteria:</strong> {months.find(m => m.value === selectedMonth)?.[language === 'ml' ? 'labelMl' : 'labelEn']}</span>
              <span><strong>Generated At:</strong> {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-card border border-border/80 rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {language === 'en' ? 'Filter Ledger' : 'ഫിൽട്ടർ ചെയ്യുക'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Year Select */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-medium">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {/* Month Select */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-medium">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {language === 'ml' ? m.labelMl : m.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Tabs defaultValue="dashboard" className="w-full">
                 <TabsList className="bg-muted border border-border w-full flex justify-start rounded-xl p-1 gap-1 overflow-x-auto print:hidden mb-8">
                <TabsTrigger value="dashboard" className="rounded-lg text-sm px-4 py-2">
                  <PieIcon className="h-4 w-4 mr-1.5" />
                  {language === 'en' ? 'Summary' : 'സംഗ്രഹം'}
                </TabsTrigger>
                <TabsTrigger value="ledger" className="rounded-lg text-sm px-4 py-2">
                  <History className="h-4 w-4 mr-1.5" />
                  {language === 'en' ? 'Daily Ledger' : 'പ്രതിദിന കണക്ക്'}
                </TabsTrigger>
                <TabsTrigger value="income" className="rounded-lg text-sm px-4 py-2">
                  <ArrowUpCircle className="h-4 w-4 mr-1.5" />
                  {language === 'en' ? 'Income' : 'വരവ്'}
                </TabsTrigger>
                <TabsTrigger value="expenditure" className="rounded-lg text-sm px-4 py-2">
                  <ArrowDownCircle className="h-4 w-4 mr-1.5" />
                  {language === 'en' ? 'Expenditure' : 'ചെലവ്'}
                </TabsTrigger>
              </TabsList>

              {/* DASHBOARD TAB CONTENT */}
              <TabsContent value="dashboard" className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-accent" />
                        {language === 'en' ? 'Monthly Cash Flow' : 'പ്രതിമാസ പണമൊഴുക്ക്'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyBarChartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Amount']} 
                          />
                          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 20 }} iconType="circle" />
                          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} name={language === 'en' ? 'Income' : 'വരവ്'} />
                          <Bar dataKey="Expenditure" fill="#ef4444" radius={[4, 4, 0, 0]} name={language === 'en' ? 'Expenditure' : 'ചെലവ്'} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-primary">
                        {language === 'en' ? 'Financial Position' : 'സാമ്പത്തിക സ്ഥിതി'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Gross Income</p>
                            <p className="text-2xl font-bold text-emerald-600 font-mono">₹{totalIncome.toLocaleString()}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Expenses</p>
                            <p className="text-2xl font-bold text-rose-600 font-mono">₹{totalExpenditure.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                                Expense Ratio
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-primary">
                                {totalIncome > 0 ? ((totalExpenditure / totalIncome) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${totalIncome > 0 ? (totalExpenditure / totalIncome) * 100 : 0}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500"
                            />
                          </div>
                        </div>

                        <div className={cn(
                          "p-4 rounded-xl border flex items-center justify-between",
                          netBalance >= 0 ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50/30 border-rose-100"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              netBalance >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                              {netBalance >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase">Net Surplus</p>
                              <p className={cn("text-lg font-bold font-mono", netBalance >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                ₹{netBalance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                             "font-bold",
                             netBalance >= 0 ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700"
                           )}>
                             {netBalance >= 0 ? 'HEALTHY' : 'DEFICIT'}
                           </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-foreground">
                        {language === 'en' ? 'Revenue Streams' : 'വരുമാന സ്രോതസ്സുകൾ'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-center items-center">
                      {incomePieData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                              <Pie
                                data={incomePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {incomePieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Amount']} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="grid grid-cols-1 gap-2 w-full mt-4 px-6">
                            {incomePieData.map((item, index) => (
                              <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <span className="text-muted-foreground font-medium">{item.name}</span>
                                </div>
                                <span className="font-bold text-foreground font-mono">₹{item.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data recorded</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-foreground">
                        {language === 'en' ? 'Expenditure Analysis' : 'ചെലവ് വിശകലനം'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-center items-center">
                      {expenditurePieData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                              <Pie
                                data={expenditurePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {expenditurePieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Amount']} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="grid grid-cols-1 gap-2 w-full mt-4 px-6 max-h-[80px] overflow-y-auto custom-scrollbar">
                            {expenditurePieData.map((item, index) => (
                              <div key={item.name} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-2 truncate max-w-[70%]">
                                  <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                                  <span className="text-muted-foreground truncate font-medium">{item.name}</span>
                                </div>
                                <span className="font-bold text-foreground font-mono">₹{item.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* DAILY LEDGER TAB CONTENT */}
              <TabsContent value="ledger" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <Card className="border border-border shadow-md overflow-hidden">
                   <CardHeader className="bg-primary/5 border-b py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                          <History className="h-5 w-5 text-accent" />
                          {language === 'en' ? 'Daily Income & Expenditure Statement' : 'പ്രതിദിന വരവ് - ചെലവ് കണക്ക്'}
                        </CardTitle>
                        <CardDescription>
                          {language === 'en' ? 'Unified chronological ledger for the selected period' : 'തിരഞ്ഞെടുത്ത മാസത്തിലെ എല്ലാ പണമിടപാടുകളും തീയതി ക്രമത്തിൽ.'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4 bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-primary/10 font-mono text-sm">
                         <div className="text-center px-4 border-r">
                           <p className="text-[10px] text-muted-foreground font-bold uppercase">Income</p>
                           <p className="font-bold text-emerald-600">₹{totalIncome.toLocaleString()}</p>
                         </div>
                         <div className="text-center px-4 border-r">
                           <p className="text-[10px] text-muted-foreground font-bold uppercase">Expense</p>
                           <p className="font-bold text-rose-600">₹{totalExpenditure.toLocaleString()}</p>
                         </div>
                         <div className="text-center px-4">
                           <p className="text-[10px] text-muted-foreground font-bold uppercase">Balance</p>
                           <p className="font-bold text-primary">₹{netBalance.toLocaleString()}</p>
                         </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="w-[100px] font-bold text-xs uppercase">{language === 'en' ? 'Date' : 'തീയതി'}</TableHead>
                            <TableHead className="w-[120px] font-bold text-xs uppercase">{language === 'en' ? 'Type' : 'വിഭാഗം'}</TableHead>
                            <TableHead className="font-bold text-xs uppercase">{language === 'en' ? 'Description & Name' : 'വിശദാംശം'}</TableHead>
                            <TableHead className="text-right w-[150px] font-bold text-xs uppercase">{language === 'en' ? 'Income (+)' : 'വരവ് (+)'}</TableHead>
                            <TableHead className="text-right w-[150px] font-bold text-xs uppercase">{language === 'en' ? 'Expense (-)' : 'ചെലവ് (-)'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unifiedLedger.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2 opacity-40">
                                  <LayoutGrid className="h-10 w-10" />
                                  <p>{language === 'en' ? 'No transactions found for the selected criteria.' : 'വിവരങ്ങൾ ലഭ്യമല്ല.'}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            unifiedLedger.map((item, idx) => (
                              <TableRow key={`${item.id}-${idx}`} className="hover:bg-muted/10 group transition-colors">
                                <TableCell className="font-mono text-xs font-medium">
                                  {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-[10px] px-1.5 h-5",
                                      item.type === 'Income' 
                                        ? "border-emerald-200 text-emerald-700 bg-emerald-50/50" 
                                        : "border-rose-200 text-rose-700 bg-rose-50/50"
                                    )}
                                  >
                                    {item.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground">{item.description}</span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Building className="h-2.5 w-2.5" />
                                      {item.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-emerald-600 text-sm">
                                  {item.status === 'Plus' ? `₹${item.amount.toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-rose-600 text-sm">
                                  {item.status === 'Minus' ? `₹${item.amount.toLocaleString()}` : '—'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* INCOME TAB CONTENT */}
              <TabsContent value="income" className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <Card className="border border-border shadow-sm">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                      <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                      {language === 'en' ? 'Income Analysis Report' : 'വരവ് വിശകലന റിപ്പോർട്ട്'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="w-[120px] font-bold text-xs">{language === 'en' ? 'Date' : 'തീയതി'}</TableHead>
                          <TableHead className="font-bold text-xs">{language === 'en' ? 'Devotee' : 'ഭക്തൻ'}</TableHead>
                          <TableHead className="font-bold text-xs">{language === 'en' ? 'Purpose' : 'ആവശ്യം'}</TableHead>
                          <TableHead className="text-right font-bold text-xs">{language === 'en' ? 'Amount' : 'തുക'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {[...filteredBookings, ...filteredDonations].sort((a, b) => new Date(b.bookingDate || b.submissionDate || b.donationDate).getTime() - new Date(a.bookingDate || a.submissionDate || a.donationDate).getTime()).map((item: any, idx: number) => (
                           <TableRow key={idx}>
                             <TableCell className="font-mono text-xs">
                                {new Date(item.bookingDate || item.submissionDate || item.donationDate).toLocaleDateString('en-GB')}
                             </TableCell>
                             <TableCell className="text-sm font-medium">{item.userName}</TableCell>
                             <TableCell className="text-sm text-muted-foreground">
                                {item.offeringNameEn || item.purpose || 'General Contribution'}
                             </TableCell>
                             <TableCell className="text-right font-bold text-emerald-600">
                               ₹{(item.price || item.amount || 0).toLocaleString()}
                             </TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPENDITURE TAB CONTENT */}
              <TabsContent value="expenditure" className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <Card className="border border-border shadow-sm">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                      <ArrowDownCircle className="h-5 w-5 text-rose-600" />
                      {language === 'en' ? 'Expenditure Analysis Report' : 'ചെലവ് വിശകലന റിപ്പോർട്ട്'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="w-[120px] font-bold text-xs">{language === 'en' ? 'Date' : 'തീയതി'}</TableHead>
                          <TableHead className="font-bold text-xs">{language === 'en' ? 'Category' : 'വിഭാഗം'}</TableHead>
                          <TableHead className="font-bold text-xs">{language === 'en' ? 'Description' : 'വിവരണം'}</TableHead>
                          <TableHead className="text-right font-bold text-xs">{language === 'en' ? 'Amount' : 'തുക'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredExpendituresList.map((item: any, idx: number) => (
                           <TableRow key={idx}>
                             <TableCell className="font-mono text-xs">
                                {new Date(item.date).toLocaleDateString('en-GB')}
                             </TableCell>
                             <TableCell className="text-sm font-medium">
                               {language === 'en' ? item.categoryEn : item.categoryMl || item.categoryEn}
                             </TableCell>
                             <TableCell className="text-sm text-muted-foreground">
                                {language === 'en' ? item.descriptionEn : item.descriptionMl || item.descriptionEn}
                             </TableCell>
                             <TableCell className="text-right font-bold text-rose-600">
                               ₹{Number(item.amount || 0).toLocaleString()}
                             </TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </>
  );
}
