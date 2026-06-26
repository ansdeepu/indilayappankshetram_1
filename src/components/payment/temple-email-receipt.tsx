'use client';

import React from 'react';
import type { ReceiptProps } from '@/lib/types';

// This component is specifically for the email receipt generation in the admin panel.
export const TempleEmailReceipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ receiptData, backgroundImageUrl }, ref) => {
    const {
        date,
        receiptNo,
        description,
        name,
        star,
        quantity,
        rate,
        amount,
        bookingDate,
    } = receiptData;

    return (
        <div
            ref={ref} // Attach the ref here
            className="receipt-container bg-white text-black font-sans"
            style={{
                fontFamily: "'Noto Sans Malayalam', sans-serif",
                width: '210mm',
                height: '99mm',
                position: 'relative',
                margin: '0 auto',
                boxSizing: 'border-box',
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
             <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');
                `}</style>
            <div className="relative z-10">
                {/* Header Row */}
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '26mm', left: '130mm' }}>{date}</div>
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '31mm', left: '130mm' }}>{receiptNo}</div>
                
                {/* Vazhipadu / Offering Name */}
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '31mm', left: '40mm', width: '100mm' }}>{description}</div>

                {/* Main Content Table */}
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '51.5mm', left: '57mm', width: '90mm' }}>{name}</div>
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '51.5mm', left: '123mm', width: '35mm' }}>{star || '-'}</div>

                 {quantity !== undefined && (
                    <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '51.5mm', left: '150mm', textAlign: 'center', width: '10mm' }}>{quantity}</div>
                )}
                {rate !== undefined && (
                    <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '51.5mm', left: '163mm', width: '20mm' }}>{`₹${rate.toFixed(0)}`}</div>
                )}
                 <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '51.5mm', left: '175mm', width: '25mm' }}>{`₹${amount.toFixed(2)}`}</div>


                {/* Footer */}
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '71mm', left: '165mm', width: '25mm', fontWeight: 'bold' }}>{`₹${amount.toFixed(2)}`}</div>
                <div className="receipt-field" style={{ position: 'absolute', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', top: '78mm', left: '58mm' }}>{bookingDate || '-'}</div>

                {/* Sender Details */}
                <div
                    className="receipt-field"
                    style={{
                        position: 'absolute',
                        fontSize: '12px',
                        lineHeight: '1.2',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'center',
                        top: '80mm',
                        left: '150mm',
                        width: '45mm',
                    }}
                >
                    <p style={{ margin: 0 }}>മാനേജർ</p>
                    <p style={{ margin: 0 }}>ഇണ്ടിളയപ്പൻ ക്ഷേത്രം</p>
                </div>
            </div>
        </div>
    );
});

TempleEmailReceipt.displayName = 'TempleEmailReceipt';
