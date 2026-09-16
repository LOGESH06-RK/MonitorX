export type LoanProduct = {
  id: string;
  bank: string;
  bankTamil: string;
  type: string;
  typeTamil: string;
  interestRate: string;
  interestRateValue: number;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  processingFee: string;
  eligibility: string[];
  eligibilityTamil: string[];
  documents: string[];
  documentsTamil: string[];
  source: string;
  lastVerified: string;
};

export const loanProducts: LoanProduct[] = [
  {
    id: 'sbi-kcc',
    bank: 'State Bank of India',
    bankTamil: 'ஸ்டேட் பேங்க் ஆஃப் இந்தியா',
    type: 'Kisan Credit Card (KCC)',
    typeTamil: 'கிசான கிரெடிட் கார்டு (KCC)',
    interestRate: '7% p.a. (effective ~4% with subvention)',
    interestRateValue: 7,
    minAmount: 25000,
    maxAmount: 300000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFee: 'Nil',
    eligibility: [
      'All farmers with land ownership or valid tenancy',
      'Age 18-70 years',
      'Must have cultivable land',
      'Repayment capacity based on cropping pattern',
    ],
    eligibilityTamil: [
      'நில உரிமை அல்லது செல்லுபடியாகும் குத்தகை உள்ள அனைத்து விவசாயிகள்',
      'வயது 18-70 ஆண்டுகள்',
      'விவசாய நிலம் இருக்க வேண்டும்',
      'பயிர் முறை அடிப்படையில் திருப்பிச் செலுத்தும் திறன்',
    ],
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Bank account details',
      'Passport size photographs',
      'KCC application form',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'வங்கி கணக்கு விவரங்கள்',
      'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
      'KCC விண்ணப்ப படிவம்',
    ],
    source: 'sbi.co.in — State Bank of India',
    lastVerified: '2025-01-15',
  },
  {
    id: 'pnb-agri',
    bank: 'Punjab National Bank',
    bankTamil: 'பஞ்சாப் நேஷனல் பேங்க்',
    type: 'Agricultural Term Loan',
    typeTamil: 'விவசாய கால கடன்',
    interestRate: '8.5% p.a.',
    interestRateValue: 8.5,
    minAmount: 50000,
    maxAmount: 1000000,
    minTenureMonths: 12,
    maxTenureMonths: 120,
    processingFee: '0.5% of loan amount',
    eligibility: [
      'Farmers with land ownership',
      'Age 21-65 years',
      'Minimum land holding 0.5 acres',
      'Repayment capacity from agricultural income',
    ],
    eligibilityTamil: [
      'நில உரிமை உள்ள விவசாயிகள்',
      'வயது 21-65 ஆண்டுகள்',
      'குறைந்தது 0.5 ஏக்கர் நிலம்',
      'விவசாய வருவாயில் இருந்து திருப்பிச் செலுத்தும் திறன்',
    ],
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Income proof (agricultural)',
      'Bank account details',
      'Loan application form',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'வருவாய் ஆதாரம் (விவசாய)',
      'வங்கி கணக்கு விவரங்கள்',
      'கடன் விண்ணப்ப படிவம்',
    ],
    source: 'pnbindia.in — Punjab National Bank',
    lastVerified: '2025-01-15',
  },
  {
    id: 'canara-agri',
    bank: 'Canara Bank',
    bankTamil: 'கனரா பேங்க்',
    type: 'Agricultural Gold Loan',
    typeTamil: 'விவசாய தங்க கடன்',
    interestRate: '7.5% p.a.',
    interestRateValue: 7.5,
    minAmount: 25000,
    maxAmount: 500000,
    minTenureMonths: 6,
    maxTenureMonths: 36,
    processingFee: '0.25% of loan amount',
    eligibility: [
      'Farmers owning gold ornaments',
      'Age 18-70 years',
      'Must have agricultural land',
      'Gold purity minimum 18 carat',
    ],
    eligibilityTamil: [
      'தங்க நகைகள் உள்ள விவசாயிகள்',
      'வயது 18-70 ஆண்டுகள்',
      'விவசாய நிலம் இருக்க வேண்டும்',
      'தங்கம் குறைந்தது 18 கேரட்',
    ],
    documents: [
      'Aadhaar Card',
      'Gold ornaments for pledge',
      'Land documents',
      'Bank account details',
      'Passport size photographs',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'அடமானத்திற்கு தங்க நகைகள்',
      'நில ஆவணங்கள்',
      'வங்கி கணக்கு விவரங்கள்',
      'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
    ],
    source: 'canarabank.com — Canara Bank',
    lastVerified: '2025-01-15',
  },
  {
    id: 'iob-agri-equipment',
    bank: 'Indian Overseas Bank',
    bankTamil: 'இந்தியன் ஓவர்சீஸ் பேங்க்',
    type: 'Agricultural Equipment Loan',
    typeTamil: 'விவசாய உபகரண கடன்',
    interestRate: '8.75% p.a.',
    interestRateValue: 8.75,
    minAmount: 50000,
    maxAmount: 500000,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    processingFee: '1% of loan amount',
    eligibility: [
      'Farmers purchasing tractors, tillers, or farm equipment',
      'Age 18-65 years',
      'Minimum 1 acre cultivable land',
      'Income from agriculture sufficient for repayment',
    ],
    eligibilityTamil: [
      'ட்ராக்டர், டில்லர் அல்லது விவசாய உபகரணம் வாங்கும் விவசாயிகள்',
      'வயது 18-65 ஆண்டுகள்',
      'குறைந்தது 1 ஏக்கர் விவசாய நிலம்',
      'விவசாய வருவாய் திருப்பிச் செலுத்த போதுமானது',
    ],
    documents: [
      'Aadhaar Card',
      'Land documents',
      'Quotation from equipment dealer',
      'Bank account details',
      'Income proof',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள்',
      'உபகரண விற்பனையாளரிடம் இருந்து மேற்கோள்',
      'வங்கி கணக்கு விவரங்கள்',
      'வருவாய் ஆதாரம்',
    ],
    source: 'iob.in — Indian Overseas Bank',
    lastVerified: '2025-01-15',
  },
  {
    id: 'unionbank-agri',
    bank: 'Union Bank of India',
    bankTamil: 'யூனியன் பேங்க் ஆஃப் இந்தியா',
    type: 'Crop Loan (Short-term)',
    typeTamil: 'பயிர் கடன் (குறுகிய காலம்)',
    interestRate: '7% p.a. (effective ~4% with subvention)',
    interestRateValue: 7,
    minAmount: 10000,
    maxAmount: 200000,
    minTenureMonths: 6,
    maxTenureMonths: 12,
    processingFee: 'Nil',
    eligibility: [
      'All farmers with cultivable land',
      'Tenant farmers with valid agreement',
      'Loan for crop cultivation expenses',
      'Repayment from harvest proceeds',
    ],
    eligibilityTamil: [
      'விவசாய நிலம் உள்ள அனைத்து விவசாயிகள்',
      'செல்லுபடியாகும் ஒப்பந்தம் உள்ள குத்தகைதார்கள்',
      'பயிர் சாகுபடி செலவுகளுக்கு கடன்',
      'அறுவடை வருவாயில் இருந்து திருப்பிச் செலுத்துதல்',
    ],
    documents: [
      'Aadhaar Card',
      'Land documents or tenancy agreement',
      'Bank account details',
      'Sowing certificate',
      'Crop loan application form',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் அல்லது குத்தகை ஒப்பந்தம்',
      'வங்கி கணக்கு விவரங்கள்',
      'விதைப்பு சான்றிதழ்',
      'பயிர் கடன் விண்ணப்ப படிவம்',
    ],
    source: 'unionbankofindia.co.in — Union Bank of India',
    lastVerified: '2025-01-15',
  },
  {
    id: 'hdfc-personal',
    bank: 'HDFC Bank',
    bankTamil: 'HDFC பேங்க்',
    type: 'Personal Loan (For Farmers)',
    typeTamil: 'தனிப்பட்ட கடன் (விவசாயிகளுக்கு)',
    interestRate: '10.5% - 18% p.a.',
    interestRateValue: 12,
    minAmount: 50000,
    maxAmount: 1000000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFee: 'Up to 2.5% of loan amount',
    eligibility: [
      'Age 21-60 years',
      'Minimum annual income ₹1,00,000',
      'Good credit score (700+)',
      'Stable income source (agricultural or other)',
    ],
    eligibilityTamil: [
      'வயது 21-60 ஆண்டுகள்',
      'குறைந்தது ஆண்டு வருவாய் ₹1,00,000',
      'நல்ல கடன் மதிப்பெண் (700+)',
      'நிலையான வருவாய் ஆதாரம் (விவசாய அல்லது பிற)',
    ],
    documents: [
      'Aadhaar Card / PAN Card',
      'Income proof (ITR or bank statements)',
      'Bank account details',
      'Employment/income certificate',
      'Passport size photographs',
    ],
    documentsTamil: [
      'ஆதார் அட்டை / PAN அட்டை',
      'வருவாய் ஆதாரம் (ITR அல்லது வங்கி அறிக்கைகள்)',
      'வங்கி கணக்கு விவரங்கள்',
      'வேலை/வருவாய் சான்றிதழ்',
      'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
    ],
    source: 'hdfcbank.com — HDFC Bank',
    lastVerified: '2025-01-15',
  },
  {
    id: 'tmb-agri',
    bank: 'Tamil Nadu Mercantile Bank',
    bankTamil: 'தமிழ்நாடு மெர்கண்டைல் பேங்க்',
    type: 'Agricultural Jewel Loan',
    typeTamil: 'விவசாய நகை கடன்',
    interestRate: '7.5% p.a.',
    interestRateValue: 7.5,
    minAmount: 10000,
    maxAmount: 300000,
    minTenureMonths: 6,
    maxTenureMonths: 36,
    processingFee: '0.25% of loan amount',
    eligibility: [
      'Farmers with gold ornaments',
      'Age 18-70 years',
      'Must be a resident of Tamil Nadu',
      'Gold purity minimum 18 carat',
    ],
    eligibilityTamil: [
      'தங்க நகைகள் உள்ள விவசாயிகள்',
      'வயது 18-70 ஆண்டுகள்',
      'தமிழ்நாடு குடியிருப்பாளராக இருக்க வேண்டும்',
      'தங்கம் குறைந்தது 18 கேரட்',
    ],
    documents: [
      'Aadhaar Card',
      'Gold ornaments for pledge',
      'Address proof',
      'Bank account details',
      'Passport size photographs',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'அடமானத்திற்கு தங்க நகைகள்',
      'முகவரி ஆதாரம்',
      'வங்கி கணக்கு விவரங்கள்',
      'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
    ],
    source: 'tmbank.in — Tamil Nadu Mercantile Bank',
    lastVerified: '2025-01-15',
  },
  {
    id: 'sbi-tractor',
    bank: 'State Bank of India',
    bankTamil: 'ஸ்டேட் பேங்க் ஆஃப் இந்தியா',
    type: 'Tractor Loan',
    typeTamil: 'ட்ராக்டர் கடன்',
    interestRate: '9.5% p.a.',
    interestRateValue: 9.5,
    minAmount: 100000,
    maxAmount: 1500000,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    processingFee: '1% of loan amount',
    eligibility: [
      'Farmers with minimum 2 acres of cultivable land',
      'Age 18-60 years',
      'Tractor must be for agricultural use',
      'Income from agriculture sufficient for EMI',
    ],
    eligibilityTamil: [
      'குறைந்தது 2 ஏக்கர் விவசாய நிலம் உள்ள விவசாயிகள்',
      'வயது 18-60 ஆண்டுகள்',
      'ட்ராக்டர் விவசாய பயன்பாட்டிற்கு மட்டுமே',
      'விவசாய வருவாய் EMI க்கு போதுமானது',
    ],
    documents: [
      'Aadhaar Card',
      'Land documents (minimum 2 acres)',
      'Tractor quotation from dealer',
      'Bank account details',
      'Income proof',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (குறைந்தது 2 ஏக்கர்)',
      'விற்பனையாளரிடம் இருந்து ட்ராக்டர் மேற்கோள்',
      'வங்கி கணக்கு விவரங்கள்',
      'வருவாய் ஆதாரம்',
    ],
    source: 'sbi.co.in — State Bank of India',
    lastVerified: '2025-01-15',
  },
];

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): { emi: number; totalInterest: number; totalPayable: number } {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalInterest: 0, totalPayable: 0 };
  }
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return {
      emi,
      totalInterest: 0,
      totalPayable: principal,
    };
  }
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;
  return { emi, totalInterest, totalPayable };
}
