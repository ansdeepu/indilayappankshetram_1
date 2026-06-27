

export type NewsArticle = {
  id: string;
  title: string;
  titleEn: string;
  date: string; // Should be ISO date string
  summary: string;
  summaryEn: string;
  imageUrl?: string;
  youtubeUrl?: string;
};

export type HistoryContent = {
  en: {
    title: string;
    subtitle: string;
    paragraphs: string[];
  };
  ml: {
    title: string;
    subtitle: string;
    paragraphs: string[];
  };
};

export type Ritual = {
  id: string;
  time: string;
  name: string;
  nameEn: string;
};

export type RitualsPageContent = {
  en: {
    title: string;
    subtitle: string;
  };
  ml: {
    title: string;
    subtitle: string;
  };
};

export type VazhipaduPageContent = {
  en: {
    title: string;
    subtitle: string;
  };
  ml: {
    title: string;
    subtitle: string;
  };
};

export type Offering = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  slNo?: number;
};

export type HeroSlide = {
  id: string;
  imageUrl: string;
  descriptionEn: string;
  descriptionMl: string;
  order: number;
};

export type GalleryItem = {
    id: string;
    type: 'image' | 'video';
    url: string;
    descriptionEn: string;
    descriptionMl: string;
    order: number;
    year?: number;
};

export type GalleryPageContent = {
    en: {
        title: string;
        subtitle: string;
    };
    ml: {
        title: string;
        subtitle: string;
    };
};


export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export type HeroContent = {
  titleEn: string;
  titleMl: string;
  descriptionEn: string;
  descriptionMl: string;
};

export type OfferingBooking = {
  id: string;
  offeringId: string;
  offeringNameEn: string;
  offeringNameMl: string;
  price: number;
  userName: string;
  userEmail: string;
  bookingDate: string;
  submissionDate: string;
  star: string;
  phone?: string;
  address?: string;
  language?: 'en' | 'ml';
  paymentStatus?: 'Paid' | 'Pending';
  paymentDate?: string;
  receiptNo?: string;
  remarks?: string;
  receiptSentAt?: string | null;
};

export type Donation = {
    id: string;
    amount: number;
    userName: string;
    star: string;
    userEmail: string;
    donationDate: string;
    phone?: string;
    address?: string;
    purpose?: string;
    language?: 'en' | 'ml';
    paymentStatus?: 'Paid' | 'Pending';
    paymentDate?: string;
    receiptNo?: string;
    remarks?: string;
    receiptSentAt?: string | null;
}

export type PaymentDetails = {
    upiId: string;
    qrCodeUrl: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    receiptImageUrl?: string;
}

export type TempleDetails = {
    nameEn: string;
    nameMl: string;
    addressEn: string;
    addressMl: string;
    phone1: string;
    phone2: string;
    email: string;
    whatsappUrl?: string;
    youtubeUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
}

export type AdminMember = {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export type Income = {
  id: string;
  categoryEn: string;
  categoryMl: string;
  subCategoryEn: string;
  subCategoryMl: string;
  amount: number;
  date: string;
  descriptionEn: string;
  descriptionMl: string;
  paymentMethod: string;
  receivedFrom: string;
  receiptNo?: string;
  createdByUser?: string;
  createdAt?: string;
};

export type Expenditure = {
  id: string;
  categoryEn: string;
  categoryMl: string;
  subCategoryEn: string;
  subCategoryMl: string;
  amount: number;
  date: string;
  descriptionEn: string;
  descriptionMl: string;
  paymentMethod: string;
  voucherNo: string;
  createdByUser?: string;
  createdAt?: string;
};

export type ExpenditureCategory = {
  nameEn: string;
  nameMl: string;
  subcategories: {
    nameEn: string;
    nameMl: string;
  }[];
};

export type TempleAsset = {
  id: string;
  nameEn: string;
  nameMl: string;
  descriptionEn: string;
  descriptionMl: string;
  value?: number;
  donatedByEn?: string;
  donatedByMl?: string;
  donationDate?: string;
  quantity: string;
  categoryEn: string;
  categoryMl: string;
  imageUrl?: string;
  isDonated: boolean;
};

export type ReceiptProps = {
  receiptData: {
    id: string;
    date: string;
    receiptNo: string;
    description: string;
    name: string;
    star: string;
    quantity?: number;
    rate?: number;
    amount: number;
    bookingDate?: string;
    senderName?: string;
    senderDesignation?: string;
  };
  backgroundImageUrl: string;
}
    
