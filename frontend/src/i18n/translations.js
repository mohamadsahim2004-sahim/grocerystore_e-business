// Smallest possible i18n: the English text itself is the key.
//   t('Home')                      -> 'මුල් පිටුව' (Sinhala) / 'முகப்பு' (Tamil) / 'Home' (English)
//   t('Account menu for {name}', { name })   -> simple {placeholder} substitution
// Anything without an entry (or in English) falls back to the original English text, so a missing
// translation can never break a screen. Only UI text is translated - never product names, API data or IDs.

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' }
];

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'exotic_language';

export const isSupportedLanguage = (code) => LANGUAGES.some((l) => l.code === code);

const si = {
  // Navigation & footer
  Home: 'මුල් පිටුව',
  Shop: 'වෙළඳසැල',
  Categories: 'කාණ්ඩ',
  About: 'අප ගැන',
  Contact: 'සම්බන්ධ වන්න',
  'Help & FAQ': 'උදව් සහ නිති ප්‍රශ්න',
  Shipping: 'බෙදාහැරීම',
  Returns: 'ආපසු භාර දීම',
  'Privacy Policy': 'රහස්‍යතා ප්‍රතිපත්තිය',
  'Quick Links': 'ඉක්මන් සබැඳි',
  'Quick links': 'ඉක්මන් සබැඳි',
  'Customer Service': 'පාරිභෝගික සේවා',
  'Customer service': 'පාරිභෝගික සේවා',
  'Authentic & Global Flavors': 'අව්‍යාජ සහ ගෝලීය රස',
  '© {year} EXOTIC Food Market. All rights reserved.': '© {year} EXOTIC Food Market. සියලුම හිමිකම් ඇවිරිණි.',
  // Header
  'Search for products...': 'නිෂ්පාදන සොයන්න...',
  'Open menu': 'මෙනුව විවෘත කරන්න',
  'Close menu': 'මෙනුව වසන්න',
  Primary: 'ප්‍රධාන',
  'Login or register': 'පිවිසෙන්න හෝ ලියාපදිංචි වන්න',
  'Login / Register': 'පිවිසෙන්න / ලියාපදිංචි වන්න',
  Cart: 'කරත්තය',
  'Cart, {count} item': 'කරත්තය, භාණ්ඩ {count}',
  'Cart, {count} items': 'කරත්තය, භාණ්ඩ {count}',
  'Account menu for {name}': '{name} සඳහා ගිණුම් මෙනුව',
  'My Profile': 'මගේ පැතිකඩ',
  'Order History': 'ඇණවුම් ඉතිහාසය',
  Wishlist: 'ප්‍රියතම ලැයිස්තුව',
  Addresses: 'ලිපිනයන්',
  Settings: 'සැකසුම්',
  'Admin Dashboard': 'පරිපාලක උපකරණ පුවරුව',
  Logout: 'පිටවීම',
  'Log out': 'පිටවන්න',
  // Account sidebar
  'My account': 'මගේ ගිණුම',
  Profile: 'පැතිකඩ',
  // Settings page
  'Manage your account details and how you sign in.': 'ඔබේ ගිණුම් විස්තර සහ ඔබ පිවිසෙන ආකාරය කළමනාකරණය කරන්න.',
  Account: 'ගිණුම',
  'Edit Profile': 'පැතිකඩ සංස්කරණය',
  Name: 'නම',
  Email: 'විද්‍යුත් තැපෑල',
  Phone: 'දුරකථන',
  'Not added': 'එක් කර නැත',
  'Manage Addresses': 'ලිපින කළමනාකරණය',
  'Default address': 'පෙරනිමි ලිපිනය',
  'Saved addresses': 'සුරැකි ලිපින',
  'You have no saved addresses yet.': 'ඔබට තවම සුරැකි ලිපින නැත.',
  'Sign out': 'පිටවීම',
  'Sign out of EXOTIC Food Market on this device.': 'මෙම උපාංගයේ EXOTIC Food Market වෙතින් පිටවන්න.',
  Preferences: 'මනාප',
  Language: 'භාෂාව',
  'Display language': 'ප්‍රදර්ශන භාෂාව',
  'Choose the language used across the store.': 'වෙළඳසැල පුරා භාවිතා කරන භාෂාව තෝරන්න.',
  'Language updated.': 'භාෂාව යාවත්කාලීන කරන ලදී.',
  'Display currency': 'ප්‍රදර්ශන මුදල් ඒකකය',
  'Currency updated.': 'මුදල් ඒකකය යාවත්කාලීන කරන ලදී.',
  'Prices are stored in {base} and converted for display only, at approximate rates (updated {date}).':
    'මිල ගණන් {base} වලින් ගබඩා කර ඇති අතර, ආසන්න අනුපාත භාවිතයෙන් (යාවත්කාලීන: {date}) පෙන්වීම සඳහා පමණක් පරිවර්තනය කෙරේ.',
  'Prices are converted for display at approximate rates. Your order is recorded in {base}: {amount}.':
    'මිල ගණන් ආසන්න අනුපාත භාවිතයෙන් පෙන්වීම සඳහා පමණක් පරිවර්තනය කර ඇත. ඔබේ ඇණවුම {base} වලින් සටහන් වේ: {amount}.'
};

const ta = {
  // Navigation & footer
  Home: 'முகப்பு',
  Shop: 'கடை',
  Categories: 'வகைகள்',
  About: 'எங்களைப் பற்றி',
  Contact: 'தொடர்புக்கு',
  'Help & FAQ': 'உதவி & அடிக்கடி கேட்கப்படும் கேள்விகள்',
  Shipping: 'விநியோகம்',
  Returns: 'திருப்பி அளித்தல்',
  'Privacy Policy': 'தனியுரிமைக் கொள்கை',
  'Quick Links': 'விரைவு இணைப்புகள்',
  'Quick links': 'விரைவு இணைப்புகள்',
  'Customer Service': 'வாடிக்கையாளர் சேவை',
  'Customer service': 'வாடிக்கையாளர் சேவை',
  'Authentic & Global Flavors': 'உண்மையான மற்றும் உலகளாவிய சுவைகள்',
  '© {year} EXOTIC Food Market. All rights reserved.': '© {year} EXOTIC Food Market. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  // Header
  'Search for products...': 'பொருட்களைத் தேடுங்கள்...',
  'Open menu': 'மெனுவைத் திற',
  'Close menu': 'மெனுவை மூடு',
  Primary: 'முதன்மை',
  'Login or register': 'உள்நுழை அல்லது பதிவு செய்',
  'Login / Register': 'உள்நுழை / பதிவு செய்',
  Cart: 'கூடை',
  'Cart, {count} item': 'கூடை, {count} பொருள்',
  'Cart, {count} items': 'கூடை, {count} பொருட்கள்',
  'Account menu for {name}': '{name} கணக்கு மெனு',
  'My Profile': 'என் சுயவிவரம்',
  'Order History': 'ஆர்டர் வரலாறு',
  Wishlist: 'விருப்பப் பட்டியல்',
  Addresses: 'முகவரிகள்',
  Settings: 'அமைப்புகள்',
  'Admin Dashboard': 'நிர்வாகி முகப்புப் பலகை',
  Logout: 'வெளியேறு',
  'Log out': 'வெளியேறு',
  // Account sidebar
  'My account': 'என் கணக்கு',
  Profile: 'சுயவிவரம்',
  // Settings page
  'Manage your account details and how you sign in.': 'உங்கள் கணக்கு விவரங்களையும் நீங்கள் உள்நுழையும் முறையையும் நிர்வகிக்கவும்.',
  Account: 'கணக்கு',
  'Edit Profile': 'சுயவிவரத்தைத் திருத்து',
  Name: 'பெயர்',
  Email: 'மின்னஞ்சல்',
  Phone: 'தொலைபேசி',
  'Not added': 'சேர்க்கப்படவில்லை',
  'Manage Addresses': 'முகவரிகளை நிர்வகி',
  'Default address': 'இயல்புநிலை முகவரி',
  'Saved addresses': 'சேமித்த முகவரிகள்',
  'You have no saved addresses yet.': 'உங்களிடம் இதுவரை சேமித்த முகவரிகள் இல்லை.',
  'Sign out': 'வெளியேறு',
  'Sign out of EXOTIC Food Market on this device.': 'இந்தச் சாதனத்தில் EXOTIC Food Market இலிருந்து வெளியேறவும்.',
  Preferences: 'விருப்பத்தேர்வுகள்',
  Language: 'மொழி',
  'Display language': 'காட்சி மொழி',
  'Choose the language used across the store.': 'கடை முழுவதும் பயன்படுத்தப்படும் மொழியைத் தேர்வுசெய்க.',
  'Language updated.': 'மொழி புதுப்பிக்கப்பட்டது.',
  'Display currency': 'காட்சி நாணயம்',
  'Currency updated.': 'நாணயம் புதுப்பிக்கப்பட்டது.',
  'Prices are stored in {base} and converted for display only, at approximate rates (updated {date}).':
    'விலைகள் {base} இல் சேமிக்கப்படுகின்றன; தோராயமான மாற்று விகிதங்களில் (புதுப்பிப்பு: {date}) காட்சிக்காக மட்டும் மாற்றப்படுகின்றன.',
  'Prices are converted for display at approximate rates. Your order is recorded in {base}: {amount}.':
    'விலைகள் தோராயமான மாற்று விகிதங்களில் காட்சிக்காக மட்டும் மாற்றப்பட்டுள்ளன. உங்கள் ஆர்டர் {base} இல் பதிவாகும்: {amount}.'
};

const de = {
  // Navigation & footer
  Home: 'Startseite',
  Shop: 'Shop',
  Categories: 'Kategorien',
  About: 'Über uns',
  Contact: 'Kontakt',
  'Help & FAQ': 'Hilfe & FAQ',
  Shipping: 'Versand',
  Returns: 'Rückgabe',
  'Privacy Policy': 'Datenschutzerklärung',
  'Quick Links': 'Schnellzugriff',
  'Quick links': 'Schnellzugriff',
  'Customer Service': 'Kundenservice',
  'Customer service': 'Kundenservice',
  'Authentic & Global Flavors': 'Authentische & internationale Aromen',
  '© {year} EXOTIC Food Market. All rights reserved.': '© {year} EXOTIC Food Market. Alle Rechte vorbehalten.',
  // Header
  'Search for products...': 'Produkte suchen...',
  'Open menu': 'Menü öffnen',
  'Close menu': 'Menü schließen',
  Primary: 'Hauptnavigation',
  'Login or register': 'Anmelden oder registrieren',
  'Login / Register': 'Anmelden / Registrieren',
  Cart: 'Warenkorb',
  'Cart, {count} item': 'Warenkorb, {count} Artikel',
  'Cart, {count} items': 'Warenkorb, {count} Artikel',
  'Account menu for {name}': 'Kontomenü für {name}',
  'My Profile': 'Mein Profil',
  'Order History': 'Bestellverlauf',
  Wishlist: 'Wunschliste',
  Addresses: 'Adressen',
  Settings: 'Einstellungen',
  'Admin Dashboard': 'Admin-Dashboard',
  Logout: 'Abmelden',
  'Log out': 'Abmelden',
  // Account sidebar
  'My account': 'Mein Konto',
  Profile: 'Profil',
  // Settings page
  'Manage your account details and how you sign in.': 'Verwalten Sie Ihre Kontodaten und Ihre Anmeldung.',
  Account: 'Konto',
  'Edit Profile': 'Profil bearbeiten',
  Name: 'Name',
  Email: 'E-Mail',
  Phone: 'Telefon',
  'Not added': 'Nicht angegeben',
  'Manage Addresses': 'Adressen verwalten',
  'Default address': 'Standardadresse',
  'Saved addresses': 'Gespeicherte Adressen',
  'You have no saved addresses yet.': 'Sie haben noch keine gespeicherten Adressen.',
  'Sign out': 'Abmelden',
  'Sign out of EXOTIC Food Market on this device.': 'Auf diesem Gerät von EXOTIC Food Market abmelden.',
  Preferences: 'Präferenzen',
  Language: 'Sprache',
  'Display language': 'Anzeigesprache',
  'Choose the language used across the store.': 'Wählen Sie die Sprache, die im gesamten Shop verwendet wird.',
  'Language updated.': 'Sprache aktualisiert.',
  'Display currency': 'Anzeigewährung',
  'Currency updated.': 'Währung aktualisiert.',
  'Prices are stored in {base} and converted for display only, at approximate rates (updated {date}).':
    'Preise werden in {base} gespeichert und nur zur Anzeige zu ungefähren Kursen umgerechnet (Stand: {date}).',
  'Prices are converted for display at approximate rates. Your order is recorded in {base}: {amount}.':
    'Die Preise werden nur zur Anzeige zu ungefähren Kursen umgerechnet. Ihre Bestellung wird in {base} erfasst: {amount}.'
};

const nl = {
  // Navigation & footer
  Home: 'Home',
  Shop: 'Winkel',
  Categories: 'Categorieën',
  About: 'Over ons',
  Contact: 'Contact',
  'Help & FAQ': 'Help & veelgestelde vragen',
  Shipping: 'Verzending',
  Returns: 'Retourneren',
  'Privacy Policy': 'Privacybeleid',
  'Quick Links': 'Snelle links',
  'Quick links': 'Snelle links',
  'Customer Service': 'Klantenservice',
  'Customer service': 'Klantenservice',
  'Authentic & Global Flavors': 'Authentieke & internationale smaken',
  '© {year} EXOTIC Food Market. All rights reserved.': '© {year} EXOTIC Food Market. Alle rechten voorbehouden.',
  // Header
  'Search for products...': 'Zoek producten...',
  'Open menu': 'Menu openen',
  'Close menu': 'Menu sluiten',
  Primary: 'Hoofdnavigatie',
  'Login or register': 'Inloggen of registreren',
  'Login / Register': 'Inloggen / Registreren',
  Cart: 'Winkelwagen',
  'Cart, {count} item': 'Winkelwagen, {count} artikel',
  'Cart, {count} items': 'Winkelwagen, {count} artikelen',
  'Account menu for {name}': 'Accountmenu voor {name}',
  'My Profile': 'Mijn profiel',
  'Order History': 'Bestelgeschiedenis',
  Wishlist: 'Verlanglijst',
  Addresses: 'Adressen',
  Settings: 'Instellingen',
  'Admin Dashboard': 'Beheerdersdashboard',
  Logout: 'Uitloggen',
  'Log out': 'Uitloggen',
  // Account sidebar
  'My account': 'Mijn account',
  Profile: 'Profiel',
  // Settings page
  'Manage your account details and how you sign in.': 'Beheer je accountgegevens en hoe je inlogt.',
  Account: 'Account',
  'Edit Profile': 'Profiel bewerken',
  Name: 'Naam',
  Email: 'E-mail',
  Phone: 'Telefoon',
  'Not added': 'Niet toegevoegd',
  'Manage Addresses': 'Adressen beheren',
  'Default address': 'Standaardadres',
  'Saved addresses': 'Opgeslagen adressen',
  'You have no saved addresses yet.': 'Je hebt nog geen opgeslagen adressen.',
  'Sign out': 'Uitloggen',
  'Sign out of EXOTIC Food Market on this device.': 'Log op dit apparaat uit bij EXOTIC Food Market.',
  Preferences: 'Voorkeuren',
  Language: 'Taal',
  'Display language': 'Weergavetaal',
  'Choose the language used across the store.': 'Kies de taal die in de hele winkel wordt gebruikt.',
  'Language updated.': 'Taal bijgewerkt.',
  'Display currency': 'Weergavevaluta',
  'Currency updated.': 'Valuta bijgewerkt.',
  'Prices are stored in {base} and converted for display only, at approximate rates (updated {date}).':
    'Prijzen worden opgeslagen in {base} en alleen voor weergave omgerekend tegen benaderde koersen (bijgewerkt: {date}).',
  'Prices are converted for display at approximate rates. Your order is recorded in {base}: {amount}.':
    'Prijzen worden alleen voor weergave omgerekend tegen benaderde koersen. Je bestelling wordt vastgelegd in {base}: {amount}.'
};

const DICTIONARIES = { si, ta, de, nl };

// Returns the text in `language` (English when there is no translation), filling {placeholders} from `vars`.
export function translate(language, text, vars) {
  const dictionary = DICTIONARIES[language];
  const template = (dictionary && Object.prototype.hasOwnProperty.call(dictionary, text) && dictionary[text]) || text;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (vars[key] === undefined ? match : String(vars[key])));
}