export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
}

export const countries: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", currencySymbol: "$", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", currencySymbol: "£", phoneCode: "+44" },
  { code: "EU", name: "European Union", flag: "🇪🇺", currency: "EUR", currencySymbol: "€", phoneCode: "+49" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥", phoneCode: "+81" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY", currencySymbol: "¥", phoneCode: "+86" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", phoneCode: "+91" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", currencySymbol: "A$", phoneCode: "+61" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", currencySymbol: "C$", phoneCode: "+1" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", currencySymbol: "R$", phoneCode: "+55" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", currencySymbol: "$", phoneCode: "+52" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", currencySymbol: "₩", phoneCode: "+82" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", currencySymbol: "S$", phoneCode: "+65" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", currency: "HKD", currencySymbol: "HK$", phoneCode: "+852" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD", currencySymbol: "NZ$", phoneCode: "+64" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", currency: "CHF", currencySymbol: "CHF", phoneCode: "+41" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", currency: "SEK", currencySymbol: "kr", phoneCode: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", currency: "NOK", currencySymbol: "kr", phoneCode: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", currency: "DKK", currencySymbol: "kr", phoneCode: "+45" },
  { code: "PL", name: "Poland", flag: "🇵🇱", currency: "PLN", currencySymbol: "zł", phoneCode: "+48" },
  { code: "RU", name: "Russia", flag: "🇷🇺", currency: "RUB", currencySymbol: "₽", phoneCode: "+7" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", currencySymbol: "R", phoneCode: "+27" },
  { code: "AE", name: "UAE", flag: "🇦🇪", currency: "AED", currencySymbol: "د.إ", phoneCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", currencySymbol: "﷼", phoneCode: "+966" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", currencySymbol: "฿", phoneCode: "+66" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", currency: "MYR", currencySymbol: "RM", phoneCode: "+60" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", currency: "IDR", currencySymbol: "Rp", phoneCode: "+62" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP", currencySymbol: "₱", phoneCode: "+63" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "VND", currencySymbol: "₫", phoneCode: "+84" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", currency: "TRY", currencySymbol: "₺", phoneCode: "+90" },
  { code: "IL", name: "Israel", flag: "🇮🇱", currency: "ILS", currencySymbol: "₪", phoneCode: "+972" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", currency: "EGP", currencySymbol: "£", phoneCode: "+20" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", currencySymbol: "₦", phoneCode: "+234" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", currencySymbol: "KSh", phoneCode: "+254" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS", currencySymbol: "$", phoneCode: "+54" },
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP", currencySymbol: "$", phoneCode: "+56" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP", currencySymbol: "$", phoneCode: "+57" },
  { code: "PE", name: "Peru", flag: "🇵🇪", currency: "PEN", currencySymbol: "S/", phoneCode: "+51" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", currency: "NPR", currencySymbol: "रू", phoneCode: "+977" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", currency: "BDT", currencySymbol: "৳", phoneCode: "+880" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", currency: "PKR", currencySymbol: "₨", phoneCode: "+92" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", currency: "LKR", currencySymbol: "Rs", phoneCode: "+94" },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryByCurrency(currency: string): Country | undefined {
  return countries.find((c) => c.currency === currency);
}

export function getCountryByPhoneCode(phoneCode: string): Country | undefined {
  return countries.find((c) => c.phoneCode === phoneCode);
}
