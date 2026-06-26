'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { PaymentDialog } from '@/components/payment/payment-dialog';
import type { OfferingBooking, Donation } from '@/lib/types';


function PaymentPageContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') as 'booking' | 'donation' | null;
    const amount = Number(searchParams.get('price') || searchParams.get('amount') || 0);

    const record = useMemo(() => {
        const data: { [key: string]: string } = {};
        searchParams.forEach((value, key) => {
            data[key] = value;
        });
        return data as unknown as (OfferingBooking | Donation);
    }, [searchParams]);

    if (!type || !record) {
        return <div className="p-8">Invalid payment details.</div>
    }

    return (
        <PaymentDialog 
            isOpen={true}
            onClose={() => {}}
            amount={amount}
            type={type}
            record={record}
        />
    )
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div>Loading Payment Details...</div>}>
            <PaymentPageContent />
        </Suspense>
    )
}
