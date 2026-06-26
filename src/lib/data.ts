import type { Ritual, Offering } from './types';

export const dailyRituals: Ritual[] = [
  { id: 'r1', time: '5:00 AM', name: 'പള്ളിയുണർത്തൽ', nameEn: 'Palliyunarthal' },
  { id: 'r2', time: '5:30 AM', name: 'നിർമ്മാല്യ ദർശനം', nameEn: 'Nirmalya Darshanam' },
  { id: 'r3', time: '6:00 AM', name: 'അഭിഷേകം', nameEn: 'Abhishekam' },
  { id: 'r4', time: '7:00 AM', name: 'ഉഷഃപൂജ', nameEn: 'Usha Pooja' },
  { id: 'r5', time: '11:30 AM', name: 'ഉച്ചപ്പൂജ', nameEn: 'Ucha Pooja' },
  { id: 'r6', time: '12:30 PM', name: 'നട അടയ്ക്കൽ (ഉച്ചയ്ക്ക്)', nameEn: 'Nada Adakkal (Noon)' },
  { id: 'r7', time: '5:00 PM', name: 'നട തുറക്കൽ', nameEn: 'Nada Thurakkal' },
  { id: 'r8', time: '6:30 PM', name: 'ദീപാരാധന', nameEn: 'Deeparadhana' },
  { id: 'r9', time: '7:30 PM', name: 'അത്താഴപൂജ', nameEn: 'Athazha Pooja' },
  { id: 'r10', time: '8:30 PM', name: 'നട അടയ്ക്കൽ (രാത്രി)', nameEn: 'Nada Adakkal (Night)' },
];

export const offeringsList: Offering[] = [
  { id: 'p-01', name: 'പുഷ്പാഞ്ജലി', nameEn: 'Pushpanjali', price: 20 },
  { id: 'p-02', name: 'നെയ് വിളക്ക്', nameEn: 'Ney Vilakku', price: 50 },
  { id: 'p-03', name: 'പാൽ പായസം', nameEn: 'Paal Payasam', price: 150 },
  { id: 'p-04', name: 'ഗണപതി ഹോമം', nameEn: 'Ganapathi Homam', price: 300 },
  { id: 'p-05', name: 'വിശേഷാൽ പൂജ', nameEn: 'Visheshാൽ Pooja', price: 500 },
];

export const historyContent = {
    en: {
        title: "Temple History",
        subtitle: "Discover the legacy of Indilayappan Kshetram",
        paragraphs: [
            "Nestled amidst the lush greenery of Kerala, the Indilayappan Kshetram stands as a timeless beacon of faith and tradition. Believed to be centuries old, the temple is dedicated to Lord Shiva, worshipped here in the unique form of 'Indilayappan'. The name itself is a portmanteau of local terms, signifying the deity's eternal and self-manifested nature. Legends passed down through generations speak of a divine sage who, during his penance, had a vision of Lord Shiva at this very spot.",
            "Following this celestial event, the local chieftain commissioned the construction of a small shrine, which over the centuries has grown into the magnificent structure we see today. The temple's architecture is a classic example of Kerala's traditional 'Vastu' style, characterized by its sloping tiled roofs, intricate woodwork, and majestic 'gopuram' (tower). The inner sanctum, or 'sreekovil', is a marvel of craftsmanship, housing the sacred idol that has been the object of devotion for countless souls.",
            "The temple has been a center for spiritual learning and cultural activities, preserving ancient rituals and art forms. It has withstood the tests of time, serving as a spiritual anchor for the community, and its history is deeply intertwined with the cultural fabric of the region."
        ]
    },
    ml: {
        title: "ക്ഷേത്ര ചരിത്രം",
        subtitle: "ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിന്റെ പൈതൃകം കണ്ടെത്തുക",
        paragraphs: [
            "കേരളത്തിന്റെ ഇടതൂർന്ന പച്ചപ്പിന് നടുവിൽ, ഇണ്ടിളയപ്പൻ ക്ഷേത്രം വിശ്വാസത്തിന്റെയും പാരമ്പര്യത്തിന്റെയും കാലാതീതമായ പ്രതীকമായി നിലകൊള്ളുന്നു. നൂറ്റാണ്ടുകൾ പഴക്കമുണ്ടെന്ന് വിശ്വസിക്കപ്പെടുന്ന ഈ ക്ഷേത്രം 'ഇണ്ടിളയപ്പൻ' എന്ന അദ്വിതീയ രൂപത്തിൽ ആരാധിക്കപ്പെടുന്ന ശിവന് സമർപ്പിച്ചിരിക്കുന്നു. ഈ പേരുതന്നെ, ദേവന്റെ ശാश्वതവും സ്വയംഭൂവുമായ φύση സൂചിപ്പിക്കുന്ന പ്രാദേശിക പദങ്ങളുടെ ഒരു സംയോജനമാണ്. തലമുറകളായി കൈമാറ്റം ചെയ്യപ്പെട്ട ഐതിഹ്യങ്ങൾ, തപസ്സനുഷ്ഠിക്കുന്നതിനിടയിൽ ഒരു ദിവ്യ സന്യാസിക്ക് ഈ സ്ഥലത്ത് വെച്ച് ശിവന്റെ ദർശനം ലഭിച്ചുവെന്ന് പറയുന്നു.",
            "ഈ ദിവ്യ സംഭവത്തെ തുടർന്ന്, പ്രാദേശിക നാടുവാഴി ഒരു ചെറിയ ശ്രീകോവിൽ നിർമ്മിക്കാൻ ഉത്തരവിട്ടു, അത് നൂറ്റാണ്ടുകളായി വളർന്ന് ഇന്ന് നാം കാണുന്ന മനോഹരമായ ഘടനയായി മാറി. ക്ഷേത്രത്തിന്റെ വാസ്തുവിദ്യ കേരളത്തിന്റെ παραδοσιακό 'വാസ്തു' ശൈലിയുടെ ഒരു ഉത്തമ ഉദാഹരണമാണ്, அதன் ചരിഞ്ഞ ഓട് മേൽക്കൂരകൾ, സങ്കീർണ്ണമായ മരപ്പണികൾ, ഗംഭീരമായ 'ഗോപുരം' എന്നിവയാൽ ഇത് വേറിട്ടുനിൽക്കുന്നു. 'ശ്രീകോവിൽ' എന്ന് അറിയപ്പെടുന്ന ഗർഭಗುಡಿ, എണ്ണമറ്റ ആത്മാക്കളുടെ ભક્તિക്ക് പാത്രമായ પવિત્ર വിഗ്രഹം ഉൾക്കൊള്ളുന്ന கைவினைத்திறന്റെ ഒരു അത്ഭുതമാണ്.",
            "പുരാതനമായ ആചാരങ്ങളും കലാരൂപങ്ങളും സംരക്ഷിച്ചുകൊണ്ട് ഈ ക്ഷേത്രം ആത്മീയ പഠനത്തിനും സാംസ്കാരിക പ്രവർത്തനങ്ങൾക്കും ഒരു കേന്ദ്രമാണ്. കാലത്തിന്റെ പരീക്ഷണങ്ങളെ അതിജീവിച്ച ഇത്, സമൂഹത്തിന് ഒരു ആത്മീയ якорь ആയി വർത്തിക്കുന്നു, அதன் ചരിത്രം ഈ പ്രദേശത്തിന്റെ സാംസ്കാരിക ഘടനയുമായി ആഴത്തിൽ பின்னிപ്പിണഞ്ഞിരിക്കുന്നു."
        ]
    }
};

export const heroContent = {
    en: {
        title: "Welcome to Indilayappan Kshetram",
        descriptions: [
            "A beautiful temple gopuram against a sunset sky.",
            "Interior of a temple with intricate carvings and light streaming in.",
            "A temple festival with elephants and a crowd of devotees."
        ]
    },
    ml: {
        title: "ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലേക്ക് സ്വാഗതം",
        descriptions: [
            "സൂര്യാസ്തമയ ആകാശത്തിന്റെ പശ്ചാത്തലത്തിൽ മനോഹരമായ ഒരു ക്ഷേത്ര ഗോപുരം.",
            "സങ്കീർണ്ണമായ കൊത്തുപണികളും ഉള്ളിൽ പ്രവഹിക്കുന്ന പ്രകാശവും ഉള്ള ഒരു ക്ഷേത്രത്തിന്റെ ഉൾവശം.",
            "ആനകളും ഭക്തജനങ്ങളുടെ തിരക്കും ഉള്ള ഒരു ക്ഷേത്രോത്സവം."
        ]
    }
};
