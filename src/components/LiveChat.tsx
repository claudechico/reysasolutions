import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFAQ, setShowFAQ] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'bot'; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  // Function to close chat
  const closeChat = () => {
    setIsOpen(false);
    setShowFAQ(true);
    setMessages([]);
    setInputMessage('');
    setSearchQuery('');
    setExpandedFAQ(null);
  };

  // Listen for custom event to open chat
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setShowFAQ(true);
    };

    window.addEventListener('openLiveChat', handleOpenChat);
    return () => window.removeEventListener('openLiveChat', handleOpenChat);
  }, []);

  // Handle browser back button and history management
  useEffect(() => {
    if (isOpen) {
      // Push state to history when chat opens
      window.history.pushState({ chatOpen: true }, '');
      
      // Handle browser back button
      const handlePopState = () => {
        closeChat();
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen]);

  const faqs: FAQ[] = [
    {
      question: i18n.language === 'sw' 
        ? 'Je, ni gharama gani za ununuzi wa mali?' 
        : 'What are the costs involved in buying a property?',
      answer: i18n.language === 'sw'
        ? 'Gharama za ununuzi wa mali ni pamoja na bei ya mali, ada ya wakili (kawaida 2-5% ya bei), ada ya kuthibitisha hati miliki, ada ya usajili, na gharama za ukaguzi wa mali. Jumla ya gharama zinaweza kuwa kati ya 5-10% ya bei ya mali.'
        : 'The costs of buying a property include the property price, agent fees (typically 2-5% of the price), title verification fees, registration fees, and property inspection costs. Total costs can range from 5-10% of the property price.',
      category: 'buying'
    },
    {
      question: i18n.language === 'sw'
        ? 'Ni muda gani unachukua kuuza mali?'
        : 'How long does it take to sell a property?',
      answer: i18n.language === 'sw'
        ? 'Muda wa kuuza mali hutegemea mambo kadhaa kama eneo, bei, na hali ya soko. Kwa ujumla, mali zinazouzwa kwa bei ya soko na katika maeneo yanayopendwa zinaweza kuuzwa ndani ya miezi 2-6.'
        : 'The time to sell a property depends on factors like location, price, and market conditions. Generally, properties priced competitively in desirable areas can sell within 2-6 months.',
      category: 'selling'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, naweza kupata mkopo wa benki kwa ununuzi wa mali?'
        : 'Can I get a bank loan for property purchase?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, benki nyingi hutoa mikopo ya mali. Unahitaji kuwa na mapato thabiti, historia nzuri ya mkopo, na uwezo wa kulipa deposit ya angalau 20-30% ya bei ya mali. Tunaweza kukusaidia kupata benki inayofaa.'
        : 'Yes, most banks offer property loans. You need stable income, good credit history, and ability to pay a deposit of at least 20-30% of the property price. We can help you find a suitable bank.',
      category: 'financing'
    },
    {
      question: i18n.language === 'sw'
        ? 'Ni nini tofauti kati ya mali ya kuuza na mali ya kukodisha?'
        : 'What is the difference between properties for sale and for rent?',
      answer: i18n.language === 'sw'
        ? 'Mali ya kuuza unanunua na kuwa na umiliki kamili. Mali ya kukodisha unalipa kodi kila mwezi lakini huna umiliki. Uchaguzi hutegemea lengo lako la muda mrefu na uwezo wako wa kifedha.'
        : 'Properties for sale you purchase and own completely. Rental properties you pay monthly rent but don\'t own. The choice depends on your long-term goals and financial capacity.',
      category: 'general'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mali ina hati miliki halali?'
        : 'Does the property have a valid title deed?',
      answer: i18n.language === 'sw'
        ? 'Tunahakikisha mali zote zina hati miliki halali na zimehakikiwa. Tunaweza kukupa nakala ya hati miliki na kukusaidia kuthibitisha uhalali wake kabla ya ununuzi.'
        : 'We ensure all properties have valid and verified title deeds. We can provide you with a copy of the title deed and help verify its authenticity before purchase.',
      category: 'legal'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, naweza kuona mali kabla ya kununua?'
        : 'Can I view the property before buying?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tunapanga ziara za kuona mali kwa wateja wetu. Unaweza kuona mali na kuuliza maswali yoyote. Pia tunaweza kukupa picha na video za mali.'
        : 'Yes, we arrange property viewings for our clients. You can view the property and ask any questions. We can also provide photos and videos of the property.',
      category: 'viewing'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mali iko karibu na shule na hospitali?'
        : 'Is the property near schools and hospitals?',
      answer: i18n.language === 'sw'
        ? 'Tuna mali katika maeneo mbalimbali. Tunaweza kukusaidia kupata mali karibu na shule, hospitali, na huduma nyingine muhimu kulingana na mahitaji yako.'
        : 'We have properties in various locations. We can help you find properties near schools, hospitals, and other essential services based on your requirements.',
      category: 'location'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, gharama za matengenezo ni nini?'
        : 'What are the maintenance costs?',
      answer: i18n.language === 'sw'
        ? 'Gharama za matengenezo hutegemea aina na ukubwa wa mali. Kwa ujumla, unahitaji kujenga bajeti ya 1-2% ya thamani ya mali kila mwaka kwa matengenezo ya kawaida.'
        : 'Maintenance costs depend on the type and size of the property. Generally, you should budget 1-2% of the property value annually for regular maintenance.',
      category: 'maintenance'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, naweza kuuza mali yangu kupitia wewe?'
        : 'Can I sell my property through you?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tunatoa huduma za uuzaji wa mali. Tunaweza kukusaidia kuweka bei, kuchapisha matangazo, na kusaidia katika mchakato wote wa uuzaji.'
        : 'Yes, we offer property selling services. We can help you set the price, publish listings, and assist throughout the entire selling process.',
      category: 'selling'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mali ina umeme na maji?'
        : 'Does the property have electricity and water?',
      answer: i18n.language === 'sw'
        ? 'Tunaonyesha hali ya huduma za umeme, maji, na huduma nyingine katika maelezo ya mali. Tunaweza pia kukusaidia kuthibitisha hali halisi ya huduma hizi.'
        : 'We display the status of electricity, water, and other utilities in the property description. We can also help you verify the actual status of these services.',
      category: 'utilities'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mna nyumba za aina gani?'
        : 'What types of houses do you have?',
      answer: i18n.language === 'sw'
        ? 'Tuna nyumba za aina mbalimbali: studio, room moja, vyumba viwili, vyumba vitatu, vyumba vinne, na nyumba kubwa za familia. Tuna nyumba za kisasa na za jadi, zote katika maeneo mazuri.'
        : 'We have various types of houses: studio, one bedroom, two bedrooms, three bedrooms, four bedrooms, and large family houses. We have modern and traditional houses, all in good locations.',
      category: 'houses'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mna apartments?'
        : 'Do you have apartments?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tuna apartments nyingi katika maeneo mbalimbali. Tuna studio apartments, one-bedroom, two-bedroom, na three-bedroom apartments. Zote zina huduma za kisasa na ziko katika maeneo mazuri.'
        : 'Yes, we have many apartments in various locations. We have studio apartments, one-bedroom, two-bedroom, and three-bedroom apartments. All have modern amenities and are in good locations.',
      category: 'apartments'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mna hotels au mali za biashara?'
        : 'Do you have hotels or commercial properties?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tunafanya deal na hotels na mali nyingine za biashara. Tunaweza kukusaidia kupata hotel, duka, ofisi, au mali nyingine ya biashara kulingana na mahitaji yako.'
        : 'Yes, we deal with hotels and other commercial properties. We can help you find hotels, shops, offices, or other commercial properties based on your requirements.',
      category: 'commercial'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mna matangazo ya mali?'
        : 'Do you have property advertisements?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tuna matangazo ya mali mbalimbali. Unaweza kutazama matangazo yetu kwenye ukurasa wa "Advertisements" au unaweza kuweka matangazo yako mwenyewe. Matangazo yetu yanaonyesha mali bora na bei nzuri.'
        : 'Yes, we have various property advertisements. You can view our advertisements on the "Advertisements" page or you can post your own advertisements. Our advertisements feature quality properties at good prices.',
      category: 'advertisements'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mna mnada wa mali?'
        : 'Do you have property auctions?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tunafanya mnada wa mali. Unaweza kushiriki kwenye mnada wetu wa mali na kupata mali kwa bei nzuri. Tuna mnada mara kwa mara na unaweza kutazama mnada unaoendelea kwenye ukurasa wa "Auctions".'
        : 'Yes, we conduct property auctions. You can participate in our property auctions and get properties at good prices. We have auctions regularly and you can view ongoing auctions on the "Auctions" page.',
      category: 'auctions'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, naweza kuweka matangazo yangu?'
        : 'Can I post my own advertisements?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, unaweza kuweka matangazo yako. Ikiwa una mali unayotaka kuuza au kukodisha, unaweza kuweka matangazo kwenye tovuti yetu. Bofya "Advertisements" kisha "Create Advertisement" na ujaze maelezo ya mali yako.'
        : 'Yes, you can post your own advertisements. If you have a property you want to sell or rent, you can post an advertisement on our website. Click "Advertisements" then "Create Advertisement" and fill in your property details.',
      category: 'advertisements'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, mnada unafanyika lini?'
        : 'When are auctions held?',
      answer: i18n.language === 'sw'
        ? 'Mnada unafanyika mara kwa mara. Unaweza kutazama ratiba ya mnada na mali zinazopatikana kwenye ukurasa wa "Auctions". Pia unaweza kujisajili kupokea taarifa za mnada mpya.'
        : 'Auctions are held regularly. You can view the auction schedule and available properties on the "Auctions" page. You can also register to receive notifications about new auctions.',
      category: 'auctions'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, tofauti gani kati ya nyumba na apartment?'
        : 'What is the difference between a house and an apartment?',
      answer: i18n.language === 'sw'
        ? 'Nyumba ni jengo la pekee na una umiliki wa ardhi. Apartment ni chumba au vitengo vingi katika jengo moja na unaweza kuwa na umiliki wa chumba tu. Nyumba kwa ujumla ni kubwa zaidi na ghali zaidi kuliko apartment.'
        : 'A house is a standalone building and you own the land. An apartment is a unit in a multi-unit building and you may only own the unit. Houses are generally larger and more expensive than apartments.',
      category: 'general'
    },
    {
      question: i18n.language === 'sw'
        ? 'Je, naweza kukodisha apartment?'
        : 'Can I rent an apartment?',
      answer: i18n.language === 'sw'
        ? 'Ndiyo, tuna apartments za kukodisha. Unaweza kutazama apartments zetu za kukodisha kwenye ukurasa wa "Properties" na kuchagua ile inayokufaa. Bei za kukodisha hutofautiana kulingana na eneo na ukubwa.'
        : 'Yes, we have apartments for rent. You can view our rental apartments on the "Properties" page and choose one that suits you. Rental prices vary depending on location and size.',
      category: 'apartments'
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim();
    // Detect language from message content, not just from i18n setting
    const hasSwahili = /\b(hujambo|habari|mambo|salama|natamani|inazwaje|gharama|bei|nyumba|mali|nkusaidie|nini|wapi|kwa|na|ni|za|ya)\b/i.test(message);
    const lang = (i18n.language === 'sw' || hasSwahili) ? 'sw' : 'en';

    // Greetings - more natural Swahili response
    if (message.match(/\b(habari)\b/i)) {
      return lang === 'sw'
        ? 'Habari! Karibu, nikusaidie?'
        : 'Hello! Welcome, how can I help you?';
    }
    
    if (message.match(/\b(hi|hello|hey|hujambo|mambo|salama)\b/i)) {
      return lang === 'sw'
        ? 'Hello! Nikusaidie nini?'
        : 'Hello! How can I help you?';
    }

    // Bedroom questions - room moja, vyumba viwili, etc.
    if (message.match(/\b(room\s*moja|vyumba\s*viwili|vyumba\s*vwili|bedroom|one\s*bedroom|two\s*bedroom|1\s*bedroom|2\s*bedroom|mnapangasha.*room|mnapangasha.*vyumba|je.*room|je.*vyumba)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tunafanya hivyo! Tuna nyumba za room moja, vyumba viwili, vyumba vitatu, na zaidi. Tuna aina mbalimbali za mali kulingana na mahitaji yako. Unaweza kutazama mali zetu kwenye ukurasa wa "Properties" au unaweza kutueleza idadi ya vyumba unavyotaka na tutakupatia mapendekezo.'
        : 'Yes, we do that! We have one-bedroom houses, two-bedroom houses, three-bedroom houses, and more. We have various types of properties based on your needs. You can browse our properties on the "Properties" page or tell us how many bedrooms you want and we\'ll provide recommendations.';
    }

    // Property types - houses and plots
    if (message.match(/\b(nyumba\s*na\s*viwanja|houses\s*and\s*plots|mna\s*deal\s*na|do\s*you\s*deal\s*with|nyumba|viwanja|plots|je.*nyumba.*viwanja|je.*deal)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tunafanya deal na nyumba na viwanja pia. Tuna nyumba za aina mbalimbali (studio, room moja, vyumba viwili, vitatu, na zaidi) na viwanja vya maeneo mbalimbali. Unaweza kutazama mali zetu kwenye ukurasa wa "Properties" au unaweza kutueleza aina ya mali unayotaka na tutakupatia mapendekezo.'
        : 'Yes, we deal with houses and plots as well. We have various types of houses (studio, one bedroom, two bedrooms, three bedrooms, and more) and plots in different areas. You can browse our properties on the "Properties" page or tell us what type of property you want and we\'ll provide recommendations.';
    }

    // Apartments
    if (message.match(/\b(apartment|apartments|studio|je.*apartment|mna.*apartment)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tuna apartments nyingi katika maeneo mbalimbali. Tuna studio apartments, one-bedroom, two-bedroom, na three-bedroom apartments. Zote zina huduma za kisasa na ziko katika maeneo mazuri. Unaweza kutazama apartments zetu kwenye ukurasa wa "Properties".'
        : 'Yes, we have many apartments in various locations. We have studio apartments, one-bedroom, two-bedroom, and three-bedroom apartments. All have modern amenities and are in good locations. You can browse our apartments on the "Properties" page.';
    }

    // Hotels and commercial properties
    if (message.match(/\b(hotel|hotels|commercial|biashara|mali\s*za\s*biashara|je.*hotel|mna.*hotel)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tunafanya deal na hotels na mali nyingine za biashara. Tunaweza kukusaidia kupata hotel, duka, ofisi, au mali nyingine ya biashara kulingana na mahitaji yako. Unaweza kutazama mali zetu za biashara kwenye ukurasa wa "Properties".'
        : 'Yes, we deal with hotels and other commercial properties. We can help you find hotels, shops, offices, or other commercial properties based on your requirements. You can browse our commercial properties on the "Properties" page.';
    }

    // Advertisements
    if (message.match(/\b(advertisement|advertisements|matangazo|je.*matangazo|mna.*matangazo|kuweka\s*matangazo)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tuna matangazo ya mali mbalimbali. Unaweza kutazama matangazo yetu kwenye ukurasa wa "Advertisements". Pia unaweza kuweka matangazo yako mwenyewe kwa kubofya "Create Advertisement" na kujaza maelezo ya mali yako.'
        : 'Yes, we have various property advertisements. You can view our advertisements on the "Advertisements" page. You can also post your own advertisements by clicking "Create Advertisement" and filling in your property details.';
    }

    // Auctions
    if (message.match(/\b(auction|auctions|mnada|je.*mnada|mna.*mnada|mnada\s*unafanyika)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tunafanya mnada wa mali. Unaweza kushiriki kwenye mnada wetu wa mali na kupata mali kwa bei nzuri. Tuna mnada mara kwa mara na unaweza kutazama mnada unaoendelea kwenye ukurasa wa "Auctions".'
        : 'Yes, we conduct property auctions. You can participate in our property auctions and get properties at good prices. We have auctions regularly and you can view ongoing auctions on the "Auctions" page.';
    }

    // Price related - detect Swahili price questions
    if (message.match(/\b(price|cost|bei|gharama|cheap|affordable|expensive|pricy|inazwaje|inagharama|gharama\s*za|bei\s*za|nyumba\s*inazwaje|mali\s*inazwaje|natamani\s*kujua.*bei|natamani\s*kujua.*gharama)\b/i)) {
      return lang === 'sw'
        ? 'Gharama za nyumba ni kuanzia million 20 mpaka million 500 na zaidi, kulingana na eneo, ukubwa, na aina ya mali. Tuna mali za bei nafuu pia kuanzia million 5. Unaweza kutazama mali zetu kwenye ukurasa wa "Properties" au unaweza kutueleza mahitaji yako na tutakupatia mapendekezo.'
        : 'House prices start from 20 million to 500 million and above, depending on location, size, and property type. We also have affordable properties starting from 5 million. You can browse our properties on the "Properties" page or tell us your requirements and we\'ll provide recommendations.';
    }

    // Location related - detect Swahili location questions
    if (message.match(/\b(location|place|area|eneo|mahali|wapi|where|mali\s*iko\s*wapi|mali\s*zipo\s*wapi)\b/i)) {
      return lang === 'sw'
        ? 'Tuna mali katika maeneo mbalimbali ya Dar es Salaam kama Mbezi Beach, Ilala, Kinondoni, na maeneo mengine. Tunaweza kukusaidia kupata mali katika eneo linalokufaa. Una eneo maalum unalotaka?'
        : 'We have properties in various areas of Dar es Salaam such as Mbezi Beach, Ilala, Kinondoni, and other locations. We can help you find a property in a suitable area. Do you have a specific area in mind?';
    }

    // Buying property - detect Swahili buying questions
    if (message.match(/\b(buy|purchase|nunua|ununuzi|buying|natamani\s*kununua|nataka\s*kununua|naweza\s*kununua)\b/i)) {
      return lang === 'sw'
        ? 'Kununua mali ni hatua muhimu. Tunaweza kukusaidia kupata mali inayokufaa, kuthibitisha hati miliki, na kusaidia katika mchakato wote. Unaweza kutazama mali zetu au kutueleza mahitaji yako maalum. Una bajeti gani?'
        : 'Buying a property is an important step. We can help you find a suitable property, verify title deeds, and assist throughout the process. You can browse our properties or tell us your specific requirements. What is your budget?';
    }

    // Selling property
    if (message.match(/\b(sell|sale|uza|kuuza|selling)\b/i)) {
      return lang === 'sw'
        ? 'Tunatoa huduma za uuzaji wa mali. Tunaweza kukusaidia kuweka bei, kuchapisha matangazo, na kusaidia katika mchakato wote wa uuzaji. Una mali unayotaka kuuza?'
        : 'We offer property selling services. We can help you set the price, publish listings, and assist throughout the entire selling process. Do you have a property you want to sell?';
    }

    // Loan/Financing
    if (message.match(/\b(loan|mkopo|finance|financing|mortgage|benki|bank)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, benki nyingi hutoa mikopo ya mali. Unahitaji kuwa na mapato thabiti, historia nzuri ya mkopo, na uwezo wa kulipa deposit ya angalau 20-30% ya bei ya mali. Tunaweza kukusaidia kupata benki inayofaa na kukusaidia katika mchakato wa maombi ya mkopo.'
        : 'Yes, most banks offer property loans. You need stable income, good credit history, and ability to pay a deposit of at least 20-30% of the property price. We can help you find a suitable bank and assist with the loan application process.';
    }

    // Viewing property
    if (message.match(/\b(view|see|visit|ona|tembelea|viewing|tour)\b/i)) {
      return lang === 'sw'
        ? 'Ndiyo, tunapanga ziara za kuona mali kwa wateja wetu. Unaweza kuona mali na kuuliza maswali yoyote. Pia tunaweza kukupa picha na video za mali. Je, una mali maalum unayotaka kuona?'
        : 'Yes, we arrange property viewings for our clients. You can view the property and ask any questions. We can also provide photos and videos of the property. Do you have a specific property you want to view?';
    }

    // Contact information
    if (message.match(/\b(contact|phone|call|email|wasiliana|simu|barua)\b/i)) {
      return lang === 'sw'
        ? 'Unaweza kutupigia simu kwa +255 672 232 334 au kututumia barua pepe kwa info@reysasolutions.co.tz. Pia unaweza kutembelea ofisi yetu Mbezi Beach, Dar es Salaam. Masaa yetu ya ofisi ni Jumatatu - Ijumaa: 9:00am - 5:00pm.'
        : 'You can call us at +255 672 232 334 or email us at info@reysasolutions.co.tz. You can also visit our office at Mbezi Beach, Dar es Salaam. Our office hours are Mon - Fri: 9:00am - 5:00pm.';
    }

    // Help/Support
    if (message.match(/\b(help|support|msaada|aid|assist)\b/i)) {
      return lang === 'sw'
        ? 'Ninafurahi kukusaidia! Unaweza kuuliza maswali yoyote kuhusu mali, bei, eneo, mikopo, au huduma zozote. Pia unaweza kutazama maswali yaliyoulizwa mara kwa mara hapo juu kwa majibu ya haraka.'
        : 'I\'m happy to help! You can ask any questions about properties, prices, locations, loans, or any services. You can also check the frequently asked questions above for quick answers.';
    }

    // Registration/Signup questions
    if (message.match(/\b(register|signup|sign\s*up|registration|jisajili|nijisajili|kujisajili|sajili|account|create\s*account|new\s*account|je\s*nikitaka\s*nijisajili|nataka\s*kujisajili|how\s*to\s*register|how\s*do\s*i\s*register)\b/i)) {
      return lang === 'sw'
        ? 'Kujisajili ni rahisi sana! Fanya hivi: 1) Bofya kitufe cha "Get Started" au "Registration" kwenye menyu ya juu. 2) Jaza fomu kwa kuweka data zako kama jina, barua pepe, nambari ya simu, na nenosiri. 3) Bofya "Register" na utapokea ujumbe wa uthibitishaji. Ni rahisi na inachukua dakika chache tu!'
        : 'Registering is very easy! Do this: 1) Click the "Get Started" or "Registration" button in the top menu. 2) Fill in the form with your data like name, email, phone number, and password. 3) Click "Register" and you\'ll receive a verification message. It\'s easy and takes just a few minutes!';
    }

    // Thank you
    if (message.match(/\b(thanks|thank|asante|shukrani|appreciate)\b/i)) {
      return lang === 'sw'
        ? 'Karibu sana! Kama una maswali mengine, usisite kuuliza. Pia unaweza kutupigia simu kwa +255 672 232 334 au kututumia barua pepe. Tunafurahi kukusaidia!'
        : 'You\'re very welcome! If you have more questions, feel free to ask. You can also call us at +255 672 232 334 or email us. We\'re happy to help!';
    }

    // Default response - more natural
    return lang === 'sw'
      ? 'Asante kwa ujumbe wako! Ninafahamu umesema kuhusu "' + userMessage + '". Kwa maelezo zaidi, tafadhali angalia maswali yaliyoulizwa mara kwa mara hapo juu, au unaweza kutupigia simu kwa +255 672 232 334. Mmoja wa wakala wetu pia atawasiliana nawe hivi karibuni. Unaweza pia kuuliza swali jingine.'
      : 'Thank you for your message! I understand you\'re asking about "' + userMessage + '". For more details, please check the frequently asked questions above, or you can call us at +255 672 232 334. One of our agents will also contact you shortly. You can also ask another question.';
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage;
    setInputMessage('');

    // Get intelligent bot response
    setTimeout(() => {
      const botResponse = {
        text: getBotResponse(messageText),
        sender: 'bot' as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-r from-light-blue-500 to-dark-blue-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-light-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open live chat"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 sm:hidden"
          onClick={closeChat}
        />
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 h-[100vh] sm:h-[600px] max-h-[100vh] sm:max-h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header with drag handle for mobile */}
          <div className="bg-gradient-to-r from-dark-blue-600 via-dark-blue-500 to-light-blue-500 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0 shadow-lg">
            {/* Drag handle indicator for mobile */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/40 rounded-full sm:hidden"></div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-white/25 backdrop-blur-sm w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg sm:text-xl text-white truncate">{t('contact.liveChat')}</h3>
                <p className="text-sm text-white/95 truncate font-medium">{t('contact.available247')}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Go back in history if we pushed a state, otherwise just close
                if (window.history.state?.chatOpen) {
                  window.history.back();
                } else {
                  closeChat();
                }
              }}
              className="hover:bg-white/20 active:bg-white/30 rounded-lg p-2.5 sm:p-1 transition-colors flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {showFAQ ? (
              /* FAQ Section */
              <div className="p-4 sm:p-5 bg-gray-50">
                <div className="mb-5">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder={i18n.language === 'sw' ? 'Tafuta maswali...' : 'Search questions...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none text-sm font-medium bg-white shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredFAQs.length > 0 ? (
                    filteredFAQs.map((faq, index) => (
                      <div
                        key={index}
                        className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm sm:text-base font-semibold text-gray-900 flex-1 pr-3 break-words leading-relaxed">
                            {faq.question}
                          </span>
                          {expandedFAQ === index ? (
                            <ChevronUp className="w-5 h-5 text-dark-blue-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFAQ === index && (
                          <div className="px-4 pb-4 text-sm sm:text-base text-gray-700 border-t-2 border-gray-200 bg-gray-50 break-words leading-relaxed pt-4">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-600 text-base font-medium bg-white rounded-xl border-2 border-gray-200">
                      {i18n.language === 'sw' ? 'Hakuna maswali yaliyopatikana' : 'No questions found'}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFAQ(false)}
                  className="w-full mt-5 bg-gradient-to-r from-dark-blue-600 to-light-blue-500 text-white py-3.5 rounded-xl font-bold text-base hover:from-dark-blue-700 hover:to-light-blue-600 transition-all shadow-xl"
                >
                  {t('contact.startChatNow')}
                </button>
              </div>
            ) : (
              /* Chat Messages */
              <div className="p-4 sm:p-5 space-y-4 bg-white">
                {messages.length === 0 && (
                  <div className="text-center py-8 sm:py-10">
                    <MessageCircle className="w-14 h-14 sm:w-16 sm:h-16 text-dark-blue-400 mx-auto mb-4" />
                    <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {i18n.language === 'sw' 
                        ? 'Karibu! Ninaweza kukusaidia na maswali yako kuhusu mali.'
                        : 'Welcome! I can help you with questions about properties.'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4 px-2">
                      {i18n.language === 'sw'
                        ? 'Uliza kuhusu bei, eneo, mikopo, au huduma zozote.'
                        : 'Ask about prices, locations, loans, or any services.'}
                    </p>
                    <button
                      onClick={() => setShowFAQ(true)}
                      className="text-sm sm:text-base text-dark-blue-600 hover:text-indigo-700 underline font-semibold"
                    >
                      {i18n.language === 'sw' ? 'Angalia maswali yaliyoulizwa mara kwa mara' : 'View frequently asked questions'}
                    </button>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-xl px-4 py-3 shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-dark-blue-600 to-light-blue-500 text-white'
                          : 'bg-gray-100 border-2 border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className={`text-sm sm:text-base break-words font-medium leading-relaxed ${msg.sender === 'user' ? 'text-white' : 'text-gray-900'}`}>{msg.text}</p>
                      <p className={`text-xs mt-2 font-medium ${msg.sender === 'user' ? 'text-white/90' : 'text-gray-600'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {!showFAQ && (
            <div className="border-t-2 border-gray-300 p-4 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-3 items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={i18n.language === 'sw' ? 'Andika ujumbe...' : 'Type a message...'}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none text-sm sm:text-base font-medium bg-white shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 min-w-[56px] min-h-[48px] rounded-xl bg-gradient-to-r from-dark-blue-700 via-dark-blue-600 to-light-blue-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center space-x-4 text-sm text-gray-700">
                <a href="tel:+255672232334" className="flex items-center space-x-2 hover:text-dark-blue-600 font-semibold transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>+255 672 232 334</span>
                </a>
                <a href="mailto:info@reysasolutions.co.tz" className="flex items-center space-x-2 hover:text-dark-blue-600 font-semibold transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

