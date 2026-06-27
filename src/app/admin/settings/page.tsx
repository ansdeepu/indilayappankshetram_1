'use client';

import { useFirestore, useDoc, useCollection, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { TempleDetails, AdminMember } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';

const defaultTempleDetails: TempleDetails = {
  nameEn: 'Indilayappan Temple',
  nameMl: 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രം',
  addressEn: 'Temple Road, Kerala, India',
  addressMl: 'ക്ഷേത്രം റോഡ്, കേരള, ഇന്ത്യ',
  phone1: '',
  phone2: '',
  email: 'indilayappankshetram@gmail.com',
  whatsappUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  instagramUrl: ''
};

export default function SettingsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isAdmin, isManager, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, userLoading, router]);

  // Temple Details state and Firestore hooks
  const templeDetailsRef = useMemo(() => (firestore && (isAdmin || isManager)) ? doc(firestore, 'siteSettings', 'templeDetails') : null, [firestore, isAdmin, isManager]);
  const { data: templeDetails, loading: detailsLoading } = useDoc<TempleDetails>(templeDetailsRef);
  const [localDetails, setLocalDetails] = useState<TempleDetails>(defaultTempleDetails);

  // Admin Members state and Firestore hooks
  const membersCollectionRef = useMemo(() => (firestore && (isAdmin || isManager)) ? collection(firestore, 'adminMembers') : null, [firestore, isAdmin, isManager]);
  const { data: adminMembers, loading: membersLoading } = useCollection<AdminMember>(membersCollectionRef);
  const [localMembers, setLocalMembers] = useState<AdminMember[]>([]);

  useEffect(() => {
    if (templeDetails) {
      setLocalDetails(templeDetails);
    }
  }, [templeDetails]);

  useEffect(() => {
    if (adminMembers) {
      setLocalMembers(adminMembers);
    }
  }, [adminMembers]);

  const handleDetailsChange = (field: keyof TempleDetails, value: string) => {
    setLocalDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleMemberChange = (id: string, field: keyof AdminMember, value: string) => {
    setLocalMembers(prev => prev.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const addNewMember = () => {
    const newMember: AdminMember = {
      id: uuidv4(),
      name: '',
      address: '',
      phone: '',
    };
    setLocalMembers(prev => [...prev, newMember]);
  };

  const removeMember = async (id: string) => {
    // If the member exists in the database, delete it from Firestore
    if (firestore && adminMembers?.some(m => m.id === id)) {
      try {
        await deleteDoc(doc(firestore, 'adminMembers', id));
        toast({ title: "Member removed from database." });
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Error removing member", description: error.message });
      }
    }
    // Always remove from local state immediately
    setLocalMembers(prev => prev.filter(m => m.id !== id));
  };


  const handleSave = async () => {
    if (!firestore) return;

    try {
      // Save temple details
      if(templeDetailsRef) {
          await setDoc(templeDetailsRef, localDetails, { merge: true });
      }

      // Save admin members
      for (const member of localMembers) {
        if (!member.name) {
          toast({ variant: 'destructive', title: 'Validation Error', description: `Member name cannot be empty.` });
          return;
        }
        const memberRef = doc(firestore, 'adminMembers', member.id);
        await setDoc(memberRef, member, { merge: true });
      }
      
      // Clean up deleted members from Firestore that might not have been caught
      const currentDbIds = adminMembers?.map(m => m.id) || [];
      const localIds = new Set(localMembers.map(m => m.id));
      const idsToDelete = currentDbIds.filter(id => !localIds.has(id));
      for (const id of idsToDelete) {
          await deleteDoc(doc(firestore, 'adminMembers', id));
      }


      toast({
        title: 'Settings Saved',
        description: 'Your changes have been successfully saved.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Settings',
        description: error.message,
      });
    }
  };

  const isLoading = detailsLoading || membersLoading || userLoading;

  if (userLoading) return null;
  if (!isAdmin && !isManager) return <div className="container py-20 text-center">Unauthorized Access</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Temple Settings</CardTitle>
          <CardDescription>
            Manage general temple information and administrative contacts. Go to <Button variant="link" asChild className="p-0"><Link href="/admin/payment-settings">Payment Settings</Link></Button> to manage payment details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              {/* Temple Details Form */}
              <div className="space-y-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Temple Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="temple-name-en">Name of Temple (English)</Label>
                      <Input id="temple-name-en" value={localDetails.nameEn || ''} onChange={e => handleDetailsChange('nameEn', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="temple-name-ml">Name of Temple (Malayalam)</Label>
                      <Input id="temple-name-ml" value={localDetails.nameMl || ''} onChange={e => handleDetailsChange('nameMl', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="temple-address-en">Address (English)</Label>
                        <Textarea id="temple-address-en" value={localDetails.addressEn || ''} onChange={e => handleDetailsChange('addressEn', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="temple-address-ml">Address (Malayalam)</Label>
                        <Textarea id="temple-address-ml" value={localDetails.addressMl || ''} onChange={e => handleDetailsChange('addressMl', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temple-phone1">Primary Phone No.</Label>
                      <Input id="temple-phone1" value={localDetails.phone1 || ''} onChange={e => handleDetailsChange('phone1', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="temple-phone2">Secondary Phone No.</Label>
                      <Input id="temple-phone2" value={localDetails.phone2 || ''} onChange={e => handleDetailsChange('phone2', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="temple-email">Email Address</Label>
                    <Input id="temple-email" type="email" value={localDetails.email || ''} onChange={e => handleDetailsChange('email', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                     <div>
                      <Label htmlFor="temple-whatsapp">WhatsApp URL</Label>
                      <Input id="temple-whatsapp" value={localDetails.whatsappUrl || ''} onChange={e => handleDetailsChange('whatsappUrl', e.target.value)} placeholder="https://wa.me/91..." />
                    </div>
                     <div>
                      <Label htmlFor="temple-youtube">YouTube Channel URL</Label>
                      <Input id="temple-youtube" value={localDetails.youtubeUrl || ''} onChange={e => handleDetailsChange('youtubeUrl', e.target.value)} />
                    </div>
                     <div>
                      <Label htmlFor="temple-facebook">Facebook Page URL</Label>
                      <Input id="temple-facebook" value={localDetails.facebookUrl || ''} onChange={e => handleDetailsChange('facebookUrl', e.target.value)} />
                    </div>
                     <div>
                      <Label htmlFor="temple-instagram">Instagram Page URL</Label>
                      <Input id="temple-instagram" value={localDetails.instagramUrl || ''} onChange={e => handleDetailsChange('instagramUrl', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Members Form */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Administrative Members</h3>
                <div className="space-y-4">
                  {localMembers.map(member => (
                    <div key={member.id} className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                      <div className="space-y-2">
                        <Label htmlFor={`member-name-${member.id}`}>Name</Label>
                        <Input id={`member-name-${member.id}`} value={member.name || ''} onChange={e => handleMemberChange(member.id, 'name', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`member-address-${member.id}`}>Address</Label>
                        <Input id={`member-address-${member.id}`} value={member.address || ''} onChange={e => handleMemberChange(member.id, 'address', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`member-phone-${member.id}`}>Phone No.</Label>
                        <Input id={`member-phone-${member.id}`} value={member.phone || ''} onChange={e => handleMemberChange(member.id, 'phone', e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeMember(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={addNewMember} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Member
                </Button>
              </div>
              
              <div className="flex justify-end gap-4 mt-8">
                <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button onClick={handleSave}>Save All Settings</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
