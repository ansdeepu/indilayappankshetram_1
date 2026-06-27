'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
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
  Calendar, 
  Printer, 
  Filter, 
  ShieldAlert,
  Loader2,
  PieChart as PieIcon,
  LayoutGrid,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
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
import { Expenditure, OfferingBooking, Donation, Income } from '@/lib/types';
import { INCOME_CATEGORIES, EXPENDITURE_CATEGORIES } from '@/lib/finance-categories';
import { format } from 'date-fns';

const COLORS = ['#d97706', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];

export default function ReportPage() {
  const { language } = useLanguage();
  const { user, isAdmin, isManager, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Queries
  const bookingsQuery = useMemo(() => {
    if (!firestore || !user || (!isAdmin && !isManager)) return null;
    return query(collection(firestore, 'offeringBookings'), orderBy('bookingDate', 'desc'));
  }, [firestore, user, isAdmin, isManager]);

  const donationsQuery = useMemo(() => {
    if (!firestore || !user || (!isAdmin && !isManager)) return null;
    return query(collection(firestore, 'donations'), orderBy('donationDate', 'desc'));
  }, [firestore, user, isAdmin, isManager]);

  const expendituresQuery = useMemo(() => {
    if (!firestore || !user || (!isAdmin && !isManager)) return null;
    return query(collection(firestore, 'expenditures'), orderBy('date', 'desc'));
  }, [firestore, user, isAdmin, isManager]);

  const manualIncomeQuery = useMemo(() => {
    if (!firestore || !user || (!isAdmin && !isManager)) return null;
    return query(collection(firestore, 'income'), orderBy('date', 'desc'));
  }, [firestore, user, isAdmin, isManager]);

  const { data: dbBookings, loading: bookingsLoading } = useCollection<OfferingBooking>(bookingsQuery);
  const { data: dbDonations, loading: donationsLoading } = useCollection<Donation>(donationsQuery);
  const { data: dbExpenditures, loading: expendituresLoading } = useCollection<Expenditure>(expendituresQuery);
  const { data: dbManualIncome, loading: manualIncomeLoading } = useCollection<Income>(manualIncomeQuery);

  const dataLoading = bookingsLoading || donationsLoading || expendituresLoading || manualIncomeLoading;

  // Process data for reports
  const { filteredIncome, filteredExpenditure, unifiedLedger, stats } = useMemo(() => {
    if (!dbBookings && !dbDonations && !dbExpenditures && !dbManualIncome) {
      return { 
        filteredIncome: [], 
        filteredExpenditure: [], 
        unifiedLedger: [], 
        stats: { totalIncome: 0, totalExpenditure: 0, incomeByCategory: [], expByCategory: [] } 
      };
    }
    const year = parseInt(selectedYear);
    const month = selectedMonth === 'all' ? null : parseInt(selectedMonth);

    const checkDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      return y === year && (month === null || m === month);
    };

    // Map all income sources to a unified structure
    const allIncome: any[] = [
      ...(dbBookings || []).filter(b => checkDate(b.bookingDate)).map(b => ({
        id: b.id,
        date: b.bookingDate,
        amount: b.price,
        categoryEn: 'Pooja Seva & Offerings',
        categoryMl: 'വഴിപാട് ബുക്കിംഗ്',
        subCategoryEn: b.offeringNameEn,
        subCategoryMl: b.offeringNameMl,
        source: 'Booking',
        name: b.userName
      })),
      ...(dbDonations || []).filter(d => checkDate(d.donationDate)).map(d => ({
        id: d.id,
        date: d.donationDate,
        amount: d.amount,
        categoryEn: 'Donations & Sponsorships',
        categoryMl: 'സംഭാവനകൾ',
        subCategoryEn: d.purpose || 'General Donation',
        subCategoryMl: d.purpose || 'പൊതു സംഭാവന',
        source: 'Donation',
        name: d.userName
      })),
      ...(dbManualIncome || []).filter(i => checkDate(i.date)).map(i => ({
        ...i,
        source: 'Manual'
      }))
    ];

    const allExpenditure = (dbExpenditures || []).filter(e => checkDate(e.date));

    // Stats aggregation
    const incomeByCategory: any = {};
    allIncome.forEach(inc => {
      const key = inc.categoryEn;
      if (!incomeByCategory[key]) incomeByCategory[key] = { nameEn: inc.categoryEn, nameMl: inc.categoryMl, amount: 0 };
      incomeByCategory[key].amount += inc.amount;
    });

    const expByCategory: any = {};
    allExpenditure.forEach(exp => {
      const key = exp.categoryEn;
      if (!expByCategory[key]) expByCategory[key] = { nameEn: exp.categoryEn, nameMl: exp.categoryMl, amount: 0 };
      expByCategory[key].amount += exp.amount;
    });

    const totalIncome = allIncome.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenditure = allExpenditure.reduce((sum, e) => sum + e.amount, 0);

    // Ledger for table
    const ledger = [
      ...allIncome.map(i => ({ ...i, type: 'Income' })),
      ...allExpenditure.map(e => ({ ...e, type: 'Expenditure' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      filteredIncome: allIncome,
      filteredExpenditure: allExpenditure,
      unifiedLedger: ledger,
      stats: {
        totalIncome,
        totalExpenditure,
        incomeByCategory: Object.values(incomeByCategory),
        expByCategory: Object.values(expByCategory)
      }
    };
  }, [dbBookings, dbDonations, dbExpenditures, dbManualIncome, selectedYear, selectedMonth]);

  // Chart data
  const monthlyBarData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, idx) => {
      const monthNum = idx + 1;
      const inc = filteredIncome.filter(i => new Date(i.date).getMonth() + 1 === monthNum).reduce((s, i) => s + i.amount, 0);
      const exp = filteredExpenditure.filter(e => new Date(e.date).getMonth() + 1 === monthNum).reduce((s, e) => s + e.amount, 0);
      return { month: m, Income: inc, Expenditure: exp };
    });
  }, [filteredIncome, filteredExpenditure]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isManager)) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-slate-50">
          <ShieldAlert className="h-16 w-16 text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-muted-foreground mt-2 mb-6">
            {!user ? 'Please login to view financial reports.' : 'You do not have permission to view financial reports.'}
          </p>
          {!user && <Button onClick={() => setIsLoginOpen(true)}>Login</Button>}
          <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50/50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary font-headline">Financial Reports</h1>
              <p className="text-muted-foreground">Comprehensive audit statement by categories.</p>
            </div>
            <div className="flex gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(2026, i, 1), 'MMMM')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => window.print()} className="bg-white">
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Income</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-1">₹{stats.totalIncome.toLocaleString()}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Confirmed receipts</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Expenditure</p>
                <h3 className="text-3xl font-bold text-rose-600 mt-1">₹{stats.totalExpenditure.toLocaleString()}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Verified vouchers</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Net Surplus</p>
                <h3 className="text-3xl font-bold mt-1">₹{(stats.totalIncome - stats.totalExpenditure).toLocaleString()}</h3>
                <p className="text-[10px] opacity-70 mt-1">Available in temple fund</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-8">
            <TabsList className="bg-white border p-1 rounded-xl">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="ledger">Detailed Ledger</TabsTrigger>
              <TabsTrigger value="categories">Category Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle>Cash Flow Trend</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyBarData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenditure" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle>Income Breakdown</CardTitle></CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.incomeByCategory}
                          dataKey="amount"
                          nameKey={language === 'en' ? 'nameEn' : 'nameMl'}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          paddingAngle={5}
                        >
                          {stats.incomeByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ledger">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle>Transaction Ledger</CardTitle>
                  <CardDescription>Chronological list of all financial movements.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unifiedLedger.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-mono">{item.date}</TableCell>
                          <TableCell>
                            <Badge variant={item.type === 'Income' ? 'success' : 'destructive'} className="text-[10px]">
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {language === 'en' ? item.categoryEn : item.categoryMl}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {language === 'en' ? item.descriptionEn : item.descriptionMl}
                            {item.name && <span className="block italic opacity-70">By: {item.name}</span>}
                          </TableCell>
                          <TableCell className={cn("text-right font-bold", item.type === 'Income' ? "text-emerald-600" : "text-rose-600")}>
                            {item.type === 'Income' ? '+' : '-'}₹{item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle>Income by Category</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {stats.incomeByCategory.map((cat, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold">{language === 'en' ? cat.nameEn : cat.nameMl}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">₹{cat.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle>Expenditure by Category</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {stats.expByCategory.map((cat, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold">{language === 'en' ? cat.nameEn : cat.nameMl}</TableCell>
                            <TableCell className="text-right font-bold text-rose-600">₹{cat.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// Add Shadcn UI component aliases if missing in this scope or import properly
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
