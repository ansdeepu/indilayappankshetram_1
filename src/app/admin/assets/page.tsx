'use client';

import { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Package, Gift, LandPlot, Home, Gem, Wrench, HelpCircle } from 'lucide-react';
import type { TempleAsset } from '@/lib/types';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';

const assetSchema = z.object({
  nameEn: z.string().min(2, 'Name (English) is required'),
  nameMl: z.string().min(2, 'Name (Malayalam) is required'),
  descriptionEn: z.string().min(2, 'Description (English) is required'),
  descriptionMl: z.string().min(2, 'Description (Malayalam) is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  categoryEn: z.string().min(1, 'Category is required'),
  categoryMl: z.string().min(1, 'Category (Malayalam) is required'),
  isDonated: z.boolean().default(false),
  donatedByEn: z.string().optional(),
  donatedByMl: z.string().optional(),
  donationDate: z.string().optional(),
  value: z.coerce.number().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function AdminAssetsPage() {
  const { user, isAdmin, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TempleAsset | null>(null);

  const assetsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assets'), orderBy('categoryEn'));
  }, [firestore]);

  const { data: assetsList, loading: assetsLoading } = useCollection<TempleAsset>(assetsQuery);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      nameEn: '',
      nameMl: '',
      descriptionEn: '',
      descriptionMl: '',
      quantity: '1',
      categoryEn: 'Other',
      categoryMl: 'മറ്റുള്ളവ',
      isDonated: false,
      donatedByEn: '',
      donatedByMl: '',
      donationDate: '',
      value: 0,
    },
  });

  const isDonated = form.watch('isDonated');

  const categories = [
    { en: 'Land', ml: 'ഭൂമി', icon: LandPlot },
    { en: 'Building', ml: 'കെട്ടിടം', icon: Home },
    { en: 'Ornament', ml: 'ആഭരണങ്ങൾ', icon: Gem },
    { en: 'Equipment', ml: 'ഉപകരണങ്ങൾ', icon: Wrench },
    { en: 'Other', ml: 'മറ്റുള്ളവ', icon: HelpCircle },
  ];

  const onSubmit = async (values: AssetFormValues) => {
    if (!firestore) return;

    try {
      if (editingAsset) {
        await updateDoc(doc(firestore, 'assets', editingAsset.id), values);
        toast({ title: 'Success', description: 'Asset updated successfully' });
      } else {
        await addDoc(collection(firestore, 'assets'), values);
        toast({ title: 'Success', description: 'Asset added successfully' });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingAsset(null);
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to save asset. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (asset: TempleAsset) => {
    setEditingAsset(asset);
    form.reset({
      nameEn: asset.nameEn,
      nameMl: asset.nameMl,
      descriptionEn: asset.descriptionEn,
      descriptionMl: asset.descriptionMl,
      quantity: asset.quantity,
      categoryEn: asset.categoryEn,
      categoryMl: asset.categoryMl,
      isDonated: asset.isDonated,
      donatedByEn: asset.donatedByEn || '',
      donatedByMl: asset.donatedByMl || '',
      donationDate: asset.donationDate || '',
      value: asset.value || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      await deleteDoc(doc(firestore, 'assets', id));
      toast({ title: 'Success', description: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete asset.',
        variant: 'destructive'
      });
    }
  };

  if (userLoading) return null;
  if (!isAdmin) return <div className="container py-20 text-center">Unauthorized Access</div>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Temple Asset Management</h1>
            <p className="text-muted-foreground mt-1">Manage temple properties and donated assets.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAsset(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add New Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
                <DialogDescription>
                  Enter the details of the temple asset or donated item.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Name (English)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Gold Chain" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nameMl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Name (Malayalam)</FormLabel>
                          <FormControl>
                            <Input placeholder="സ്വർണ്ണ മാല" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={(val) => {
                              field.onChange(val);
                              const cat = categories.find(c => c.en === val);
                              if (cat) form.setValue('categoryMl', cat.ml);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.en} value={cat.en}>{cat.en}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity / Measure</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 1 Unit, 5 Grams, 10 Cents" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (English)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Details about the asset" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descriptionMl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Malayalam)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="വിവരണം" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="isDonated"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Is this a donation from a devotee?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {isDonated && (
                    <Card className="bg-accent/5 border-accent/20">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Gift className="h-4 w-4" /> Donor Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="donatedByEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Donor Name (English)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="donatedByMl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Donor Name (Malayalam)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="donationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Donation Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}

                  <DialogFooter>
                    <Button type="submit">{editingAsset ? 'Update Asset' : 'Add Asset'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Asset Register</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assetsLoading ? (
              <div className="p-10 text-center">Loading assets...</div>
            ) : !assetsList || assetsList.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No assets found. Add your first asset.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetsList.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          {asset.categoryEn}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{asset.nameEn}</div>
                        <div className="text-xs text-muted-foreground">{asset.nameMl}</div>
                      </TableCell>
                      <TableCell>{asset.quantity}</TableCell>
                      <TableCell>
                        {asset.isDonated ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-accent">Donated By</span>
                            <span className="text-sm">{asset.donatedByEn}</span>
                          </div>
                        ) : (
                          <span className="text-xs uppercase text-muted-foreground font-semibold">Temple Property</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(asset)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(asset.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
