'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { INCOME_CATEGORIES, EXPENDITURE_CATEGORIES } from '@/lib/finance-categories';

export interface SubCategory {
  nameEn: string;
  nameMl: string;
  descriptionEn: string;
  descriptionMl: string;
}

export interface FinanceCategory {
  id: string;
  nameEn: string;
  nameMl: string;
  descriptionEn: string;
  descriptionMl: string;
  subcategories: SubCategory[];
  iconName: string;
  type: 'income' | 'expenditure';
  isCustom?: boolean;
}

export interface CustomCategory {
  id: string;
  type: 'income' | 'expenditure';
  nameEn?: string;
  nameMl?: string;
  descriptionEn?: string;
  descriptionMl?: string;
  iconName?: string;
  subcategories?: SubCategory[];
  isDeleted?: boolean;
}

export function useFinanceCategories() {
  const firestore = useFirestore();
  
  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'financeCategories'));
  }, [firestore]);

  const { data: dbCategories, loading, error } = useCollection<CustomCategory>(categoriesQuery);

  const incomeCategories = useMemo(() => {
    let list: FinanceCategory[] = INCOME_CATEGORIES.map(c => ({ 
      ...c, 
      type: 'income' as const,
      isCustom: false
    }));
    
    if (!dbCategories) return list;
    
    dbCategories.forEach(dbCat => {
      if (dbCat.type !== 'income') return;
      
      const hardcodedIndex = list.findIndex(h => h.id === dbCat.id);
      if (hardcodedIndex !== -1) {
        if (dbCat.isDeleted) {
          list.splice(hardcodedIndex, 1);
        } else {
          list[hardcodedIndex] = {
            ...list[hardcodedIndex],
            nameEn: dbCat.nameEn || list[hardcodedIndex].nameEn,
            nameMl: dbCat.nameMl || list[hardcodedIndex].nameMl,
            descriptionEn: dbCat.descriptionEn || list[hardcodedIndex].descriptionEn,
            descriptionMl: dbCat.descriptionMl || list[hardcodedIndex].descriptionMl,
            iconName: dbCat.iconName || list[hardcodedIndex].iconName,
            subcategories: dbCat.subcategories || [],
            isCustom: false
          };
        }
      } else {
        if (!dbCat.isDeleted) {
          list.push({
            id: dbCat.id,
            nameEn: dbCat.nameEn || '',
            nameMl: dbCat.nameMl || '',
            descriptionEn: dbCat.descriptionEn || '',
            descriptionMl: dbCat.descriptionMl || '',
            iconName: dbCat.iconName || 'BookOpen',
            subcategories: dbCat.subcategories || [],
            type: 'income' as const,
            isCustom: true
          });
        }
      }
    });
    
    return list;
  }, [dbCategories]);

  const expenditureCategories = useMemo(() => {
    let list: FinanceCategory[] = EXPENDITURE_CATEGORIES.map(c => ({ 
      ...c, 
      type: 'expenditure' as const,
      isCustom: false
    }));
    
    if (!dbCategories) return list;
    
    dbCategories.forEach(dbCat => {
      if (dbCat.type !== 'expenditure') return;
      
      const hardcodedIndex = list.findIndex(h => h.id === dbCat.id);
      if (hardcodedIndex !== -1) {
        if (dbCat.isDeleted) {
          list.splice(hardcodedIndex, 1);
        } else {
          list[hardcodedIndex] = {
            ...list[hardcodedIndex],
            nameEn: dbCat.nameEn || list[hardcodedIndex].nameEn,
            nameMl: dbCat.nameMl || list[hardcodedIndex].nameMl,
            descriptionEn: dbCat.descriptionEn || list[hardcodedIndex].descriptionEn,
            descriptionMl: dbCat.descriptionMl || list[hardcodedIndex].descriptionMl,
            iconName: dbCat.iconName || list[hardcodedIndex].iconName,
            subcategories: dbCat.subcategories || [],
            isCustom: false
          };
        }
      } else {
        if (!dbCat.isDeleted) {
          list.push({
            id: dbCat.id,
            nameEn: dbCat.nameEn || '',
            nameMl: dbCat.nameMl || '',
            descriptionEn: dbCat.descriptionEn || '',
            descriptionMl: dbCat.descriptionMl || '',
            iconName: dbCat.iconName || 'BookOpen',
            subcategories: dbCat.subcategories || [],
            type: 'expenditure' as const,
            isCustom: true
          });
        }
      }
    });
    
    return list;
  }, [dbCategories]);

  return {
    incomeCategories,
    expenditureCategories,
    loading: loading,
    error
  };
}
