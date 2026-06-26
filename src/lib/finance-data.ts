
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
}

export const INCOME_CATEGORIES: FinanceCategory[] = [
  {
    id: 'inc-vazhipadu',
    nameEn: 'Pooja Seva & Offerings',
    nameMl: 'വഴിപാടുകൾ',
    descriptionEn: 'Receipts from general vazhipadus, special rituals, and daily poojas booked by devotees.',
    descriptionMl: 'ഭക്തർ ബുക്ക് ചെയ്യുന്ന വിവിധ വഴിപാടുകൾ, പ്രത്യേക പൂജകൾ, നിത്യപൂജകൾ എന്നിവയിൽ നിന്നുള്ള വരുമാനം.',
    iconName: 'Flame',
    subcategories: [
      {
        nameEn: 'Daily Pujas',
        nameMl: 'നിത്യപൂജകൾ',
        descriptionEn: 'Daily morning and evening rituals including Archana, Pushpanjali, and Nivedyam.',
        descriptionMl: 'അർച്ചന, പുഷ്പാഞ്ജലി, നിവേദ്യം തുടങ്ങിയ നിത്യേനയുള്ള പ്രഭാത-സായന്തന പൂജകൾ.'
      },
      {
        nameEn: 'Special Offerings',
        nameMl: 'പ്രത്യേക വഴിപാടുകൾ',
        descriptionEn: 'High-value auspicious offerings like Neyyabhishekam, Ganapathi Homam, and Payasams.',
        descriptionMl: 'നെയ്യഭിഷേകം, ഗണപതി ഹോമം, പായസങ്ങൾ തുടങ്ങിയ പ്രധാന വഴിപാടുകൾ.'
      },
      {
        nameEn: 'Monthly & Star Pujas',
        nameMl: 'മാസ/നക്ഷത്ര പൂജകൾ',
        descriptionEn: 'Special pujas on specific asterisms or days like Ayilyam Puja, Shashti Puja, and Pradosham.',
        descriptionMl: 'ആയില്യം പൂജ, ഷഷ്ഠി പൂജ, പ്രദോഷം തുടങ്ങിയ വിശേഷ ദിവസങ്ങളിലെ പ്രത്യേക പൂജകൾ.'
      }
    ]
  },
  {
    id: 'inc-donations',
    nameEn: 'Donations & Sponsorships',
    nameMl: 'സംഭാവനകളും സ്പോൺസർഷിപ്പുകളും',
    descriptionEn: 'Contributions made by devotees for temple upkeep, asset creation, and noble causes.',
    descriptionMl: 'ക്ഷേത്ര സംരക്ഷണം, വികസനം, കാരുണ്യപ്രവർത്തനങ്ങൾ എന്നിവയ്ക്കായി ഭക്തർ നൽകുന്ന സംഭാവനകൾ.',
    iconName: 'HeartHandshake',
    subcategories: [
      {
        nameEn: 'General Donations',
        nameMl: 'പൊതു സംഭാവനകൾ',
        descriptionEn: 'Unrestricted contributions towards the general maintenance and operation of the temple.',
        descriptionMl: 'ക്ഷേത്രത്തിന്റെ പൊതുവായ ആവശ്യങ്ങൾക്കും നടത്തിപ്പിനുമായി നൽകുന്ന സംഭാവനകൾ.'
      },
      {
        nameEn: 'Annadanam Fund',
        nameMl: 'അന്നദാന നിധി',
        descriptionEn: 'Dedicated funds allocated for cooking and serving meals (Sadhya) to visiting pilgrims.',
        descriptionMl: 'ക്ഷേത്രത്തിലെത്തുന്ന ഭക്തർക്ക് അന്നദാനം നൽകുന്നതിനായി നീക്കിവച്ചിട്ടുള്ള ഫണ്ട്.'
      },
      {
        nameEn: 'Vessel & Ornament Sponsorships',
        nameMl: 'വസ്തു/സ്വർണ്ണ സ്പോൺസർഷിപ്പുകൾ',
        descriptionEn: 'Donations in the form of deepams (lamps), gold/silver ornaments, or pooja utensils for the deities.',
        descriptionMl: 'വിഗ്രഹങ്ങളിലേക്ക് ചാർത്താനുള്ള സ്വർണ്ണ/വെള്ളി ആഭരണങ്ങൾ, വിളക്കുകൾ, പൂജാപാത്രങ്ങൾ എന്നിവയുടെ സ്പോൺസർഷിപ്പ്.'
      }
    ]
  },
  {
    id: 'inc-festivals',
    nameEn: 'Festivals & Special Celebrations',
    nameMl: 'ഉത്സവങ്ങളും വിശേഷ ദിവസങ്ങളും',
    descriptionEn: 'Collections received specifically for seasonal festivals, annual events, and spiritual gatherings.',
    descriptionMl: 'വിശേഷാൽ ഉത്സവങ്ങൾ, വാർഷിക ആഘോഷങ്ങൾ, ആത്മീയ കൂട്ടായ്മകൾ എന്നിവയ്ക്കായി ലഭിക്കുന്ന സംഭാവനകൾ.',
    iconName: 'PartyPopper',
    subcategories: [
      {
        nameEn: 'Annual Festival Contributions',
        nameMl: 'വാർഷിക ഉത്സവ വിഹിതം',
        descriptionEn: 'Contributions and local collection receipts for the annual multi-day temple festival (Utsavam).',
        descriptionMl: 'ക്ഷേത്രത്തിലെ വാർഷിക ഉത്സവത്തിന്റെ നടത്തിപ്പിനായി ലഭിക്കുന്ന വിഹിതങ്ങൾ.'
      },
      {
        nameEn: 'Special Feast Sponsorships',
        nameMl: 'വിശേഷാൽ സദ്യ സ്പോൺസർഷിപ്പ്',
        descriptionEn: 'Sponsorships for grand traditional feasts served during auspicious days like Vishu, Onam, and Thrikkarthika.',
        descriptionMl: 'വിഷു, ഓണം, തൃക്കാർത്തിക തുടങ്ങിയ ദിവസങ്ങളിലെ വിഭവസമൃദ്ധമായ സദ്യകളുടെ സ്പോൺസർഷിപ്പ്.'
      },
      {
        nameEn: 'Cultural Programs',
        nameMl: 'സാംസ്കാരിക പരിപാടികൾ',
        descriptionEn: 'Contributions to promote traditional temple arts, percussion ensembles (Melam), and classical music.',
        descriptionMl: 'ക്ഷേത്ര കലകൾ, മേളങ്ങൾ, ശാസ്ത്രീയ സംഗീത പരിപാടികൾ എന്നിവയെ പ്രോത്സാഹിപ്പിക്കുന്നതിനുള്ള ഫണ്ട്.'
      }
    ]
  },
  {
    id: 'inc-dev',
    nameEn: 'Development & Capital Funds',
    nameMl: 'ക്ഷേത്ര വികസനവും പുനരുദ്ധാരണവും',
    descriptionEn: 'Capital received for infrastructure enlargement, shrine construction, and historical preservation projects.',
    descriptionMl: 'ക്ഷേത്ര നിർമ്മാണ പ്രവർത്തനങ്ങൾ, ചുറ്റമ്പല നവീകരണം, അടിസ്ഥാന സൗകര്യ വികസനം എന്നിവയ്ക്കായി ലഭിക്കുന്ന മൂലധനം.',
    iconName: 'Building',
    subcategories: [
      {
        nameEn: 'Temple Renovation Funds',
        nameMl: 'ക്ഷേത്ര പുനരുദ്ധാരണം',
        descriptionEn: 'Dedicated construction and renovation accounts for the main sanctum (Sreekovil) and outer structure (Chuttuambalam).',
        descriptionMl: 'ശ്രീകോവിൽ, നാലമ്പലം എന്നിവയുടെ പുനരുദ്ധാരണത്തിനും നിർമ്മാണത്തിനുമായി പ്രത്യേകം മാറ്റിവച്ചിട്ടുള്ള ഫണ്ട്.'
      },
      {
        nameEn: 'Land & Infrastructure',
        nameMl: 'സ്ഥലവും അടിസ്ഥാന സൗകര്യങ്ങളും',
        descriptionEn: 'Funds collected to acquire adjoining land, build auditorium halls, and upgrade pilgrim amenities.',
        descriptionMl: 'ക്ഷേത്ര ഭൂമി വിപുലീകരണം, ഓഡിറ്റോറിയം നിർമ്മാണം, ഭക്തജന സൗകര്യങ്ങൾ വർദ്ധിപ്പിക്കൽ എന്നിവയ്ക്കുള്ള ഫണ്ടുകൾ.'
      }
    ]
  }
];

export const EXPENDITURE_CATEGORIES: FinanceCategory[] = [
  {
    id: 'exp-daily',
    nameEn: 'Daily Rituals & Pooja Expenses',
    nameMl: 'നിത്യപൂജാ ചെലവുകൾ',
    descriptionEn: 'Ongoing material costs, consumables, and honorariums required to conduct daily pujas.',
    descriptionMl: 'ദൈനംദിന പൂജകൾ മുടക്കംകൂടാതെ നടത്തുന്നതിന് ആവശ്യമായ സാമഗ്രികളുടെയും ജീവനക്കാരുടെയും ചെലവുകൾ.',
    iconName: 'Flame',
    subcategories: [
      {
        nameEn: 'Pooja Materials & Consumables',
        nameMl: 'പൂജാ സാധനങ്ങൾ',
        descriptionEn: 'Procurement of flowers, oil, ghee, camphor, incense, sandalwood, and offering items.',
        descriptionMl: 'നിത്യേന ആവശ്യമായ പൂക്കൾ, എണ്ണ, നെയ്യ്, കർപ്പൂരം, കുന്തിരിക്കം, ചന്ദനം എന്നിവ വാങ്ങുന്നതിനുള്ള ചെലവ്.'
      },
      {
        nameEn: 'Prasadam & Nivedyam Preparation',
        nameMl: 'പ്രസാദവും നിവേദ്യവും',
        descriptionEn: 'Sourcing ingredients like raw rice, jaggery, coconut, and cardamom for making temple prasadam.',
        descriptionMl: 'നിവേദ്യങ്ങൾ, അപ്പം, അരവണ, പായസം എന്നിവ തയ്യാറാക്കാൻ ആവശ്യമായ അരി, ശർക്കര, നാളികേരം എന്നിവയുടെ ചെലവ്.'
      },
      {
        nameEn: 'Priests & Assistants Honorariums',
        nameMl: 'പൂജാരിമാരുടെയും സഹായികളുടെയും ചെലവുകൾ',
        descriptionEn: 'Dakshina and honorariums disbursed to the Chief Priest (Melshanthi) and assistant priests.',
        descriptionMl: 'മേൽശാന്തി, കീഴ്ശാന്തിമാർ, മറ്റ് ആചാര കർമ്മികൾ എന്നിവർക്ക് നൽകുന്ന ദക്ഷിണകളും വേതനങ്ങളും.'
      }
    ]
  },
  {
    id: 'exp-festivals',
    nameEn: 'Festivals & Celebration Costs',
    nameMl: 'ഉത്സവങ്ങളും വിശേഷ ദിവസങ്ങളിലെ ചെലവുകൾ',
    descriptionEn: 'Direct expenses for arranging processions, arts, feasts, and decorations during festival days.',
    descriptionMl: 'ഉത്സവങ്ങളോടനുബന്ധിച്ച് ഘോഷയാത്രകൾ, കലാപരിപാടികൾ, സദ്യകൾ, ഡെക്കറേഷൻ എന്നിവയ്ക്കായി വരുന്ന ചെലവുകൾ.',
    iconName: 'PartyPopper',
    subcategories: [
      {
        nameEn: 'Elephant & Caparison Rent',
        nameMl: 'ആനയും കോലവും',
        descriptionEn: 'Expense of hiring temple elephants, caparisons, parasols, and ceremonial ornaments.',
        descriptionMl: 'ഉത്സവ എഴുന്നള്ളിപ്പിനായി ആനകളെ എത്തിക്കുന്നതിനും നെറ്റിപ്പട്ടം, മുത്തുക്കുടകൾ എന്നിവയ്ക്കുമായി വരുന്ന ചെലവ്.'
      },
      {
        nameEn: 'Percussion & Melam Ensembles',
        nameMl: 'മേളവും വാദ്യങ്ങളും',
        descriptionEn: 'Artist fees for Panchari Melam, Thayambaka, Panchavadyam, and temple music artists.',
        descriptionMl: 'പഞ്ചാരിമേളം, തായമ്പക, പഞ്ചവാദ്യം തുടങ്ങിയ വാദ്യകലാകാരന്മാർക്ക് നൽകുന്ന പ്രതിഫലം.'
      },
      {
        nameEn: 'Lighting, Audio & Stages',
        nameMl: 'ഡെക്കറേഷനും ലൈറ്റും',
        descriptionEn: 'Rental of sound reinforcement systems, artistic LED illuminations, stages, and pandals.',
        descriptionMl: 'ക്ഷേത്രവും പരിസരവും അലങ്കരിക്കുന്നതിനുള്ള വൈദ്യുതദീപങ്ങൾ, താല്ക്കാലിക പന്തലുകൾ, സൗണ്ട് സിസ്റ്റം ചെലവുകൾ.'
      },
      {
        nameEn: 'Annadanam & Sadhya Expenditures',
        nameMl: 'അന്നദാന വിതരണ ചെലവുകൾ',
        descriptionEn: 'Cost of ingredients, firewood, cooks, and serving helpers for providing meals to devotees.',
        descriptionMl: 'ഉത്സവദിവസങ്ങളിൽ പതിനായിരങ്ങൾക്ക് വിളമ്പുന്ന അന്നദാനത്തിനുള്ള പലചരക്ക് സാധനങ്ങൾ, പാചകക്കാരുടെ കൂലി.'
      }
    ]
  },
  {
    id: 'exp-admin',
    nameEn: 'Administration & Maintenance',
    nameMl: 'ഭരണച്ചെലവുകളും ശമ്പളവും',
    descriptionEn: 'Salaries of non-priest personnel, utility bills, maintenance overheads, and administrative stationery.',
    descriptionMl: 'അഡ്മിനിസ്ട്രേറ്റീവ് ജീവനക്കാരുടെ ശമ്പളം, പൊതു ബില്ലുകൾ, ക്ഷേത്ര പരിപാലന ചെലവുകൾ.',
    iconName: 'UserCheck',
    subcategories: [
      {
        nameEn: 'Office & Cleaning Staff Salaries',
        nameMl: 'ജീവനക്കാരുടെ ശമ്പളം',
        descriptionEn: 'Wages of office managers, accountants, security personnel, sweepers, and temple cleaners.',
        descriptionMl: 'ഓഫീസ് മാനേജർ, അക്കൗണ്ടന്റ്, സെക്യൂരിറ്റി ജീവനക്കാർ, അടിച്ചുതളിക്കാർ, തൂപ്പുകാർ എന്നിവരുടെ മാസ ശമ്പളം.'
      },
      {
        nameEn: 'Electricity, Water & Utilities',
        nameMl: 'കറന്റ്, വെള്ളം ബില്ലുകൾ',
        descriptionEn: 'Monthly recurring payments for electric connections, water supply, sewage, and communication networks.',
        descriptionMl: 'വൈദ്യുതി ബില്ലുകൾ, വാട്ടർ ചാർജ്ജ്, ടെലിഫോൺ, ഇൻ്റർനെറ്റ് ചെലവുകൾ.'
      },
      {
        nameEn: 'Repairs & Property Upkeep',
        nameMl: 'അറ്റകുറ്റപ്പണികളും ശുചീകരണവും',
        descriptionEn: 'Plumbing repairs, electrical maintenance, pond cleaning, and periodic whitewashing of temple walls.',
        descriptionMl: 'പ്ലംബിംഗ് ജോലികൾ, വയറിംഗ് മാറ്റങ്ങൾ, ക്ഷേത്രക്കുളം വൃത്തിയാക്കൽ, വട്ടശ്രീകോവിൽ പെയിന്റിംഗ്.'
      }
    ]
  },
  {
    id: 'exp-charity',
    nameEn: 'Charity & Community Welfare',
    nameMl: 'കാരുണ്യ പ്രവർത്തനങ്ങൾ',
    descriptionEn: 'Humanitarian welfare disbursements, educational aid, and healthcare support for the marginalized local community.',
    descriptionMl: 'സാമൂഹിക നന്മയ്ക്കായി അശരണർക്കും രോഗികൾക്കും വിദ്യാർത്ഥികൾക്കും നൽകുന്ന വിവിധ ധനസഹായങ്ങൾ.',
    iconName: 'Activity',
    subcategories: [
      {
        nameEn: 'Medical & Healthcare Aid',
        nameMl: 'ചികിത്സാ സഹായം',
        descriptionEn: 'Financial assistance for complex surgeries, critical illness treatments, and purchasing regular life-saving medicines.',
        descriptionMl: 'ഗുരുതര രോഗബാധിതരായ പാവപ്പെട്ട പ്രാദേശികവാസികൾക്ക് നൽകുന്ന അടിയന്തിര ചികിത്സാ സഹായങ്ങൾ.'
      },
      {
        nameEn: 'Educational Scholarships',
        nameMl: 'വിദ്യാഭ്യാസ ധനസഹായം',
        descriptionEn: 'Sponsoring books, uniform items, or academic tuition fees for highly talented but financially weak children.',
        descriptionMl: 'സാമ്പത്തികമായി പിന്നോക്കം നിൽക്കുന്ന മിടുക്കരായ കുട്ടികൾക്ക് പഠനോപകരണങ്ങൾ വാങ്ങുന്നതിനും ഫീസ് നൽകുന്നതിനുമുള്ള സഹായം.'
      },
      {
        nameEn: 'Social Security & Relief',
        nameMl: 'സാമൂഹിക സുരക്ഷയും ആശ്വാസവും',
        descriptionEn: 'Distributing dry ration kits, clothing for orphans, and relief materials during environmental crises.',
        descriptionMl: 'ദുരിതാശ്വാസ കിറ്റുകളുടെ വിതരണം, വസ്ത്രദാനം, പ്രാദേശിക ദുരന്തങ്ങൾ നേരിടുന്നവർക്കുള്ള സഹായങ്ങൾ.'
      }
    ]
  }
];
