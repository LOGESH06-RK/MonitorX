export type SchemeCategory =
  | 'income_support'
  | 'crop_insurance'
  | 'agri_loans'
  | 'interest_subsidy'
  | 'irrigation'
  | 'solar_agri'
  | 'farm_machinery'
  | 'equipment_subsidy'
  | 'drip_irrigation'
  | 'organic_farming'
  | 'horticulture'
  | 'livestock'
  | 'dairy'
  | 'fisheries'
  | 'agri_infra'
  | 'storage'
  | 'fpo'
  | 'women_farmer'
  | 'youth';

export type GovernmentScheme = {
  id: string;
  name: string;
  nameTamil: string;
  type: 'central' | 'state';
  department: string;
  departmentTamil: string;
  category: SchemeCategory;
  purpose: string;
  purposeTamil: string;
  eligibility: string[];
  eligibilityTamil: string[];
  benefits: string;
  benefitsTamil: string;
  documents: string[];
  documentsTamil: string[];
  applicationProcess: string;
  applicationProcessTamil: string;
  portal: string;
  contact: string;
  importantDates: string;
  source: string;
  lastVerified: string;
  matchCriteria?: {
    states?: string[];
    farmerCategories?: string[];
    minLandSize?: number;
    maxLandSize?: number;
    irrigationRequired?: boolean;
    crops?: string[];
    farmingTypes?: string[];
    livestockTypes?: string[];
    equipmentNeeded?: string[];
    womenOnly?: boolean;
    hasKCCRequired?: boolean;
  };
};

export const governmentSchemes: GovernmentScheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    nameTamil: 'PM-KISAN (பிரதான மந்திரி கிசான் சம்மான் நிதி)',
    type: 'central',
    department: 'Ministry of Agriculture & Farmers Welfare',
    departmentTamil: 'விவசாயம் & விவசாயிகள் நலன் அமைச்சகம்',
    category: 'income_support',
    purpose:
      'Income support of ₹6,000 per year to small and marginal farmers to supplement financial needs for procuring inputs for agriculture and allied activities.',
    purposeTamil:
      'சிறு மற்றும் குறு விவசாயிகளுக்கு ஆண்டுக்கு ₹6,000 வருவாய் ஆதாரம் வழங்குதல், விவசாய உள்ளீடுகளை வாங்க நிதி உதவி.',
    eligibility: [
      'Small and marginal farmers owning cultivable land',
      'Land holding up to 2 hectares',
      'Must have Aadhaar linked to land records',
      'Not applicable to institutional farmers, income tax payers, or government employees',
    ],
    eligibilityTamil: [
      'சிறு மற்றும் குறு விவசாயிகள், விவசாய நிலம் உடையவர்கள்',
      '2 ஹெக்டர் வரை நிலம் வைத்திருப்பவர்கள்',
      'ஆதார் நில பதிவேடுகளுடன் இணைக்கப்பட்டிருக்க வேண்டும்',
      'நிறுவன விவசாயிகள், வருமான வரி செலுத்துவோர், அரசு ஊழியர்களுக்கு பொருந்தாது',
    ],
    benefits: '₹6,000 per year in three equal installments of ₹2,000 each',
    benefitsTamil: 'ஆண்டுக்கு ₹6,000, மூன்று தவணைகளாக ₹2,000 ஒவ்வொன்றாக',
    documents: [
      'Aadhaar Card',
      'Land ownership documents (Patta/Chitta)',
      'Bank account details',
      'Mobile number linked with Aadhaar',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில உரிமை ஆவணங்கள் (பட்டா/சிட்டா)',
      'வங்கி கணக்கு விவரங்கள்',
      'ஆதாருடன் இணைக்கப்பட்ட மொபைல் எண்',
    ],
    applicationProcess:
      'Apply online through pmkisan.gov.in or visit the nearest Common Service Centre (CSC). New registration requires Aadhaar and land details. State agriculture department verifies land records.',
    applicationProcessTamil:
      'pmkisan.gov.in மூலம் ஆன்லைனில் விண்ணப்பிக்கவும் அல்லது அருகிலுள்ள Common Service Centre (CSC) க்குச் செல்லவும். புதிய பதிவுக்கு ஆதார் மற்றும் நில விவரங்கள் தேவை. மாநில விவசாயத் துறை நில பதிவேடுகளை சரிபார்க்கும்.',
    portal: 'https://pmkisan.gov.in',
    contact: 'PM-KISAN Help Line: 155261 / 1800110002',
    importantDates: 'Open throughout the year. Installments released periodically.',
    source: 'pmkisan.gov.in — Ministry of Agriculture & Farmers Welfare, Govt. of India',
    lastVerified: '2025-01-15',
    matchCriteria: {
      farmerCategories: ['small', 'marginal'],
      maxLandSize: 2,
    },
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    nameTamil: 'பிரதான மந்திரி பசல் பீமா யோஜனா (PMFBY)',
    type: 'central',
    department: 'Ministry of Agriculture & Farmers Welfare',
    departmentTamil: 'விவசாயம் & விவசாயிகள் நலன் அமைச்சகம்',
    category: 'crop_insurance',
    purpose:
      'Crop insurance scheme to provide financial support to farmers suffering crop loss/damage arising out of unforeseen events like natural calamities, pests, and diseases.',
    purposeTamil:
      'இயற்கை அழிவுகள், பூச்சிகள், நோய்கள் காரணமாக பயிர் இழப்பு ஏற்படும் விவசாயிகளுக்கு நிதி ஆதாரம் வழங்கும் பயிர் காப்பீடு திட்டம்.',
    eligibility: [
      'All farmers (loanee and non-loanee) growing notified crops in notified areas',
      'Loanee farmers are covered compulsorily',
      'Non-loanee farmers can opt in voluntarily',
      'Tenant and sharecroppers are also eligible',
    ],
    eligibilityTamil: [
      'அறிவிக்கப்பட்ட பகுதிகளில் அறிவிக்கப்பட்ட பயிர்களை பயிரிடும் அனைத்து விவசாயிகள்',
      'கடன் பெற்ற விவசாயிகள் கட்டாயம் சேர்க்கப்படுவார்கள்',
      'கடன் இல்லாத விவசாயிகள் தன்விருப்பத்தேர்வில் சேரலாம்',
      'குத்தகைதார்கள் மற்றும் பட்டதார்களும் தகுதி உடையவர்கள்',
    ],
    benefits:
      'Insurance coverage against crop loss. Premium: 2% for Kharif crops, 1.5% for Rabi crops, 5% for commercial/horticultural crops. Balance premium subsidized by government.',
    benefitsTamil:
      'பயிர் இழப்புக்கு காப்பீடு வழங்கப்படும். கார்பீ பயிர்களுக்கு 2%, ரபி பயிர்களுக்கு 1.5%, வணிக/தோட்டக்கலை பயிர்களுக்கு 5% பிரீமியம். மீதி பிரீமியம் அரசால் மானியம் வழங்கப்படும்.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta) or tenancy certificate',
      'Bank account details',
      'Sowing certificate from village administrative officer',
      'Loan account number (for loanee farmers)',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா) அல்லது குத்தகை சான்றிதழ்',
      'வங்கி கணக்கு விவரங்கள்',
      'கிராம நிர்வாக அதிகாரியிடம் இருந்து விதைப்பு சான்றிதழ்',
      'கடன் கணக்கு எண் (கடன் பெற்ற விவசாயிகளுக்கு)',
    ],
    applicationProcess:
      'Loanee farmers are enrolled automatically through their bank. Non-loanee farmers can apply through PMFBY portal, CSC centres, or banks. Application must be submitted before the notified cut-off date for each crop season.',
    applicationProcessTamil:
      'கடன் பெற்ற விவசாயிகள் தானாகவே வங்கி மூலம் சேர்க்கப்படுவார்கள். கடன் இல்லாத விவசாயிகள் PMFBY போர்ட்டல், CSC மையங்கள் அல்லது வங்கிகள் மூலம் விண்ணப்பிக்கலாம். ஒவ்வொரு பயிர் பருவத்திற்கும் அறிவிக்கப்பட்ட கடைசி தேதிக்கு முன் விண்ணப்பிக்க வேண்டும்.',
    portal: 'https://pmfby.gov.in',
    contact: 'PMFBY Toll Free: 1800110003',
    importantDates: 'Kharif: June-July, Rabi: November-December (varies by state/district)',
    source: 'pmfby.gov.in — Ministry of Agriculture & Farmers Welfare, Govt. of India',
    lastVerified: '2025-01-15',
    matchCriteria: {},
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    nameTamil: 'கிசான கிரெடிட் கார்டு (KCC)',
    type: 'central',
    department: 'Ministry of Agriculture & Farmers Welfare / NABARD',
    departmentTamil: 'விவசாயம் & விவசாயிகள் நலன் அமைச்சகம் / NABARD',
    category: 'agri_loans',
    purpose:
      'Short-term credit facility for farmers to meet their agricultural needs including purchase of seeds, fertilizers, pesticides, and other inputs. Also covers post-harvest expenses and investment credit.',
    purposeTamil:
      'விதைகள், உரங்கள், பூச்சிக்கொல்லிகள் மற்றும் பிற உள்ளீடுகளை வாங்க விவசாயிகளுக்கு குறுகிய கால கடன் வசதி. அறுவடைக்கு பின் செலவுகள் மற்றும் முதலீட்டு கடனும் உள்ளடக்கம்.',
    eligibility: [
      'All farmers — small, marginal, medium, and large',
      'Tenant farmers and sharecroppers (with tenancy documentation)',
      'Orchard and plantation owners',
      'Fishery and dairy farmers',
      'Must have land ownership or valid tenancy agreement',
    ],
    eligibilityTamil: [
      'அனைத்து விவசாயிகள் — சிறு, குறு, நடுத்தர, பெரிய',
      'குத்தகைதார்கள் மற்றும் பட்டதார்கள் (குத்தகை ஆவணங்களுடன்)',
      'தோட்டம் மற்றும் தோட்ட உரிமையாளர்கள்',
      'மீன்வளர்ப்பு மற்றும் பால் பண்ணை விவசாயிகள்',
      'நில உரிமை அல்லது செல்லுபடியாகும் குத்தகை ஒப்பந்தம் இருக்க வேண்டும்',
    ],
    benefits:
      'Credit limit based on land holding and cropping pattern. Interest subvention of 1.5% and additional incentive of 2% for prompt repayment. Effective interest rate as low as 4% per annum.',
    benefitsTamil:
      'நில அளவு மற்றும் பயிர் முறை அடிப்படையில் கடன் வரம்பு. 1.5% வட்டி தள்ளுபடி மற்றும் சரியான திருப்பிச் செலுத்தலுக்கு 2% கூடுதல் ஊக்கம். பயனுறு வட்டி விகிதம் ஆண்டுக்கு 4% வரை.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta) or tenancy agreement',
      'Bank account details',
      'Passport size photographs',
      'Duly filled KCC application form from the bank',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா) அல்லது குத்தகை ஒப்பந்தம்',
      'வங்கி கணக்கு விவரங்கள்',
      'பாஸ்போர்ட் அளவு புகைப்படங்கள்',
      'வங்கியிடம் இருந்து KCC விண்ணப்ப படிவம் நிரப்பி',
    ],
    applicationProcess:
      'Apply at your nearest bank branch (public sector, cooperative, or RRBs). Submit the KCC application form along with land documents. The bank verifies land records and sanctions the credit limit. KCC is usually issued within 2-4 weeks.',
    applicationProcessTamil:
      'அருகிலுள்ள வங்கி கிளையில் (அரசு, கூட்டுறவு, அல்லது RRB) விண்ணப்பிக்கவும். நில ஆவணங்களுடன் KCC விண்ணப்ப படிவத்தை சமர்ப்பிக்கவும். வங்கி நில பதிவேடுகளை சரிபார்த்து கடன் வரம்பை அனுமதிக்கும். KCC பொதுவாக 2-4 வாரங்களில் வழங்கப்படும்.',
    portal: 'https://www.myscheme.gov.in/schemes/kcc',
    contact: 'Contact your nearest bank branch or call 1800110002',
    importantDates: 'Open throughout the year',
    source: 'NABARD / Ministry of Agriculture & Farmers Welfare, Govt. of India',
    lastVerified: '2025-01-15',
    matchCriteria: {},
  },
  {
    id: 'aif',
    name: 'Agriculture Infrastructure Fund (AIF)',
    nameTamil: 'விவசாய உள்கட்டமை நிதி (AIF)',
    type: 'central',
    department: 'Ministry of Agriculture & Farmers Welfare',
    departmentTamil: 'விவசாயம் & விவசாயிகள் நலன் அமைச்சகம்',
    category: 'agri_infra',
    purpose:
      'Medium-long term debt financing facility for investment in viable projects for post-harvest management infrastructure and community farming assets through interest subvention and credit guarantee.',
    purposeTamil:
      'அறுவடைக்கு பின் மேலாண்மை உள்கட்டமை மற்றும் சமூக விவசாய சொத்துக்களுக்கான செயல்திறன் மிக்க திட்டங்களில் முதலீட்டிற்கு நடுத்தர-நீண்ட கால கடன் நிதி வசதி.',
    eligibility: [
      'Farmers, FPOs, PACS, SHGs, JLGs, and agri-entrepreneurs',
      'Must have a viable project for post-harvest infrastructure',
      'Projects like cold storage, warehouse, sorting/grading units, etc.',
      'Loan amount from ₹10 lakh to ₹2 crore',
    ],
    eligibilityTamil: [
      'விவசாயிகள், FPOs, PACS, SHGs, JLGs, மற்றும் விவசாய தொழில்முனைவோர்',
      'அறுவடைக்கு பின் உள்கட்டமைக்கு செயல்திறன் மிக்க திட்டம் இருக்க வேண்டும்',
      'குளிர் சேமிப்பு, கிடங்கு, வகைப்படுத்தல் அலகுகள் போன்ற திட்டங்கள்',
      '₹10 லட்சம் முதல் ₹2 கோடி வரை கடன் தொகை',
    ],
    benefits:
      'Credit of up to ₹2 crore. Interest subvention of 3% per annum up to 7 years. Credit guarantee coverage up to ₹2 crore. Loan tenure up to 7 years with 2-year moratorium.',
    benefitsTamil:
      '₹2 கோடி வரை கடன். ஆண்டுக்கு 3% வட்டி தள்ளுபடி 7 ஆண்டுகளுக்கு. ₹2 கோடி வரை கடன் காப்பீடு. 2 ஆண்டு தள்ளுபடி காலத்துடன் 7 ஆண்டுகள் வரை கடன் காலம்.',
    documents: [
      'Aadhaar Card',
      'Project report/detailed project proposal',
      'Land documents for project site',
      'Bank account details',
      'Entity registration proof (for FPOs/organizations)',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'திட்ட அறிக்கை/விரிவான திட்ட முன்மொழிவு',
      'திட்ட தளத்திற்கான நில ஆவணங்கள்',
      'வங்கி கணக்கு விவரங்கள்',
      'அமைப்பு பதிவு ஆதாரம் (FPOs/அமைப்புகளுக்கு)',
    ],
    applicationProcess:
      'Apply through the AIF portal (agriinfra.dac.gov.in). Submit project proposal online. The project is evaluated by the State Level Sanctioning Committee. Once sanctioned, the loan is disbursed through scheduled banks.',
    applicationProcessTamil:
      'AIF போர்ட்டல் (agriinfra.dac.gov.in) மூலம் விண்ணப்பிக்கவும். திட்ட முன்மொழிவை ஆன்லைனில் சமர்ப்பிக்கவும். மாநில அளவு அனுமதி குழு திட்டத்தை மதிப்பிடும். அனுமதிக்கப்பட்டவுடன், வங்கிகள் மூலம் கடன் வழங்கப்படும்.',
    portal: 'https://agriinfra.dac.gov.in',
    contact: 'AIF Help Desk: 011-23387550',
    importantDates: 'Open throughout the year. Applications reviewed periodically.',
    source: 'agriinfra.dac.gov.in — Ministry of Agriculture & Farmers Welfare, Govt. of India',
    lastVerified: '2025-01-15',
    matchCriteria: {
      farmingTypes: ['commercial', 'plantation'],
    },
  },
  {
    id: 'pm-kusum',
    name: 'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)',
    nameTamil: 'PM-KUSUM (பிரதான மந்திரி கிசான் உர்ஜா சுரக்ஷா மற்றும் உத்தான் மகாபியான்)',
    type: 'central',
    department: 'Ministry of New and Renewable Energy',
    departmentTamil: 'புதிய மற்றும் புதுப்பிக்கத்தக்க எரிசக்தி அமைச்சகம்',
    category: 'solar_agri',
    purpose:
      'Installation of solar pumps and solar power plants to provide reliable energy for irrigation and reduce diesel consumption. Component A: 10,000 MW solar plants, Component B: 20 lakh standalone solar pumps, Component C: solarize 15 lakh existing grid-connected pumps.',
    purposeTamil:
      'நீர்ப்பாசனத்திற்கு நம்பகரமான எரிசக்தி வழங்கவும் டீசல் நுகர்வை குறைக்கவும் சூரிய பம்புகள் மற்றும் சூரிய மின் நிலையங்கள் நிறுவுதல்.',
    eligibility: [
      'Individual farmers with valid land documents',
      'Farmer Producer Organizations (FPOs)',
      'Cooperatives and panchayats for Component A',
      'Farmers with existing diesel/electric pumps for Component C',
    ],
    eligibilityTamil: [
      'செல்லுபடியாகும் நில ஆவணங்கள் உள்ள தனிப்பட்ட விவசாயிகள்',
      'விவசாயி உற்பத்தியாளர் அமைப்புகள் (FPOs)',
      'Component A க்கு கூட்டுறவுகள் மற்றும் பஞ்சாயத்துகள்',
      'ஏற்கனவே டீசல்/மின் பம்ப் உள்ள விவசாயிகள் Component C க்கு',
    ],
    benefits:
      'Component B: 30-60% subsidy on solar pump cost. Central Financial Assistance of ₹0.60/Wh for water lifting. Component A: ₹1.00/unit for 5 years. State government provides additional subsidy.',
    benefitsTamil:
      'Component B: சூரிய பம்ப் செலவில் 30-60% மானியம். தண்ணீர் உயர்த்த � ₹0.60/Wh மத்திய நிதி உதவி. Component A: 5 ஆண்டுகளுக்கு ₹1.00/அலகு. மாநில அரசு கூடுதல் மானியம் வழங்கும்.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Bank account details',
      'Existing pump details (for Component C)',
      'Project report for solar installation',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'வங்கி கணக்கு விவரங்கள்',
      'ஏற்கனவே உள்ள பம்ப் விவரங்கள் (Component C க்கு)',
      'சூரிய நிறுவல் திட்ட அறிக்கை',
    ],
    applicationProcess:
      'Apply through the PM-KUSUM portal or through state designated agencies. Each state has its own implementation agency. Contact your state agriculture department for the application process.',
    applicationProcessTamil:
      'PM-KUSUM போர்ட்டல் அல்லது மாநில அதிகாரப்பூர்வ நிறுவனங்கள் மூலம் விண்ணப்பிக்கவும். ஒவ்வொரு மாநிலத்திற்கும் சொந்த செயல்படுத்தும் நிறுவனம் உள்ளது. விண்ணப்ப செயல்முறைக்கு உங்கள் மாநில விவசாயத் துறையை தொடர்பு கொள்ளவும்.',
    portal: 'https://mnre.gov.in/pm-kusum',
    contact: 'MNRE Help Desk: 011-24361070',
    importantDates: 'Open throughout the year. State-wise notifications issued periodically.',
    source: 'mnre.gov.in — Ministry of New and Renewable Energy, Govt. of India',
    lastVerified: '2025-01-15',
    matchCriteria: {
      irrigationRequired: true,
    },
  },
  {
    id: 'tn-soil-health-card',
    name: 'Tamil Nadu Soil Health Card Scheme',
    nameTamil: 'தமிழ்நாடு மண் ஆரோக்கிய அட்டை திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Agriculture Department',
    departmentTamil: 'தமிழ்நாடு விவசாயத் துறை',
    category: 'income_support',
    purpose:
      'Provides free soil testing and Soil Health Cards to farmers, enabling them to apply the right fertilizers and nutrients based on soil health, reducing input costs and improving yields.',
    purposeTamil:
      'விவசாயிகளுக்கு இலவச மண் பரிசோதனை மற்றும் மண் ஆரோக்கிய அட்டை வழங்குதல், மண் ஆரோக்கியத்தின் அடிப்படையில் சரியான உரங்களை பயன்படுத்த உதவுதல், உள்ளீட்டு செலவை குறைத்தல் மற்றும் விளைச்சலை அதிகரித்தல்.',
    eligibility: [
      'All farmers in Tamil Nadu with cultivable land',
      'No land size restriction',
      'Tenant farmers with valid tenancy agreement',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் விவசாய நிலம் உள்ள அனைத்து விவசாயிகள்',
      'நில அளவு கட்டுப்பாடு இல்லை',
      'செல்லுபடியாகும் குத்தகை ஒப்பந்தம் உள்ள குத்தகைதார்கள்',
    ],
    benefits: 'Free soil testing and Soil Health Card with nutrient recommendations. No cost to farmer.',
    benefitsTamil: 'இலவச மண் பரிசோதனை மற்றும் ஊட்டச்சத்து பரிந்துரைகளுடன் மண் ஆரோக்கிய அட்டை. விவசாயிக்கு எந்த செலவும் இல்லை.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Soil sample collected by agriculture department',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'விவசாயத் துறையால் சேகரிக்கப்பட்ட மண் மாதிரி',
    ],
    applicationProcess:
      'Visit your nearest Block Agriculture Office or Krishi Vigyan Kendra (KVK). Submit land details. Agriculture department collects soil sample and issues Soil Health Card within 2-3 weeks.',
    applicationProcessTamil:
      'அருகிலுள்ள ஊராட்சி விவசாய அலுவலகம் அல்லது Krishi Vigyan Kendra (KVK) க்குச் செல்லவும். நில விவரங்களை சமர்ப்பிக்கவும். விவசாயத் துறை மண் மாதிரி சேகரித்து 2-3 வாரங்களில் மண் ஆரோக்கிய அட்டை வழங்கும்.',
    portal: 'https://www.tnau.ac.in',
    contact: 'Tamil Nadu Agriculture Department: 044-28571077',
    importantDates: 'Open throughout the year',
    source: 'Tamil Nadu Agriculture Department — tnagriculture.tn.gov.in',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
    },
  },
  {
    id: 'tn-drip-irrigation',
    name: 'Tamil Nadu Drip Irrigation Subsidy Scheme',
    nameTamil: 'தமிழ்நாடு சொட்டு நீர்ப்பாசன மானிய திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Agricultural Engineering Department',
    departmentTamil: 'தமிழ்நாடு விவசாய பொறியியல் துறை',
    category: 'drip_irrigation',
    purpose:
      'Subsidy for installation of drip irrigation systems to promote water-efficient agriculture. Reduces water usage by 40-60% and improves crop productivity.',
    purposeTamil:
      'தண்ணீர் சேமிக்கும் விவசாயத்தை ஊக்குவிக்க சொட்டு நீர்ப்பாசன அமைப்பு நிறுவ மானியம். தண்ணீர் பயன்பாட்டை 40-60% குறைத்து பயிர் உற்பத்தியை மேம்படுத்தும்.',
    eligibility: [
      'All farmers in Tamil Nadu with cultivable land',
      'Small and marginal farmers get higher subsidy',
      'Must have water source (borewell/open well/canal)',
      'Minimum 0.5 acres of cultivable land',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் விவசாய நிலம் உள்ள அனைத்து விவசாயிகள்',
      'சிறு மற்றும் குறு விவசாயிகளுக்கு அதிக மானியம்',
      'தண்ணீர் ஆதாரம் இருக்க வேண்டும் (குழாய்கிணம்/திறந்த கிணம்/கால்வாய்)',
      'குறைந்தது 0.5 ஏக்கர் விவசாய நிலம்',
    ],
    benefits:
      'Subsidy of 75-100% for small/marginal farmers and 50-75% for other farmers on drip irrigation system cost. Maximum subsidy of ₹50,000 per hectare.',
    benefitsTamil:
      'சொட்டு நீர்ப்பாசன அமைப்பு செலவில் சிறு/குறு விவசாயிகளுக்கு 75-100% மற்றும் பிற விவசாயிகளுக்கு 50-75% மானியம். ஒரு ஹெக்டருக்கு அதிகபட்சம் ₹50,000 மானியம்.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Bank account details',
      'Water source proof (borewell/commission certificate)',
      'Quotation from approved drip irrigation supplier',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'வங்கி கணக்கு விவரங்கள்',
      'தண்ணீர் ஆதார ஆதாரம் (குழாய்கிணம்/ஆணை சான்றிதழ்)',
      'அங்கீகரிக்கப்பட்ட சொட்டு நீர்ப்பாசன வழங்குநரிடம் இருந்து மேற்கோள்',
    ],
    applicationProcess:
      'Apply through the Tamil Nadu Agricultural Engineering Department portal or visit the nearest Agricultural Engineering office. Submit land documents and quotation. After verification, subsidy is sanctioned and the system is installed by approved suppliers.',
    applicationProcessTamil:
      'தமிழ்நாடு விவசாய பொறியியல் துறை போர்ட்டல் மூலம் அல்லது அருகிலுள்ள விவசாய பொறியியல் அலுவலகத்திற்குச் செல்லவும். நில ஆவணங்கள் மற்றும் மேற்கோளை சமர்ப்பிக்கவும். சரிபார்த்த பின், மானியம் அனுமதிக்கப்பட்டு அமைப்பு அங்கீகரிக்கப்பட்ட வழங்குநர்களால் நிறுவப்படும்.',
    portal: 'https://tnaed.tn.gov.in',
    contact: 'Tamil Nadu Agricultural Engineering Department: 044-24341788',
    importantDates: 'Open throughout the year',
    source: 'Tamil Nadu Agricultural Engineering Department — tnaed.tn.gov.in',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
      irrigationRequired: true,
    },
  },
  {
    id: 'tn-farm-machinery',
    name: 'Tamil Nadu Farm Machinery Subsidy Scheme',
    nameTamil: 'தமிழ்நாடு விவசாய இயந்திர மானிய திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Agriculture Department',
    departmentTamil: 'தமிழ்நாடு விவசாயத் துறை',
    category: 'farm_machinery',
    purpose:
      'Subsidy for purchase of farm machinery and equipment including tractors, power tillers, harvesters, and other agricultural implements to modernize farming operations.',
    purposeTamil:
      'விவசாய நடவடிக்கைகளை நவீனப்படுத்த ட்ராக்டர், பவர் டில்லர், அறுவடை இயந்திரம் மற்றும் பிற விவசாய கருவிகள் வாங்க மானியம்.',
    eligibility: [
      'All farmers in Tamil Nadu',
      'Individual farmers and farmer groups',
      'Custom Hiring Centres (CHCs) and FPOs',
      'Priority to small and marginal farmers',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் உள்ள அனைத்து விவசாயிகள்',
      'தனிப்பட்ட விவசாயிகள் மற்றும் விவசாயி குழுக்கள்',
      'Custom Hiring Centres (CHCs) மற்றும் FPOs',
      'சிறு மற்றும் குறு விவசாயிகளுக்கு முன்னுரிமை',
    ],
    benefits:
      'Subsidy of 25-50% on cost of farm machinery. For tractors: up to ₹45,000 subsidy. For power tillers: up to ₹25,000. For other implements: 25-40% of cost. Higher subsidy for SC/ST farmers.',
    benefitsTamil:
      'விவசாய இயந்திர செலவில் 25-50% மானியம். ட்ராக்டருக்கு: ₹45,000 வரை. பவர் டில்லருக்கு: ₹25,000 வரை. பிற கருவிகளுக்கு: செலவில் 25-40%. SC/ST விவசாயிகளுக்கு அதிக மானியம்.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Bank account details',
      'Quotation from authorized dealer',
      'Caste certificate (for SC/ST additional subsidy)',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'வங்கி கணக்கு விவரங்கள்',
      'அங்கீகரிக்கப்பட்ட விற்பனையாளரிடம் இருந்து மேற்கோள்',
      'சாதி சான்றிதழ் (SC/ST கூடுதல் மானியத்திற்கு)',
    ],
    applicationProcess:
      'Apply through the nearest Block Agriculture Office or online through the Tamil Nadu Agriculture Department portal. Submit quotation and land documents. Subsidy is sanctioned after verification.',
    applicationProcessTamil:
      'அருகிலுள்ள ஊராட்சி விவசாய அலுவலகம் அல்லது தமிழ்நாடு விவசாயத் துறை போர்ட்டல் மூலம் ஆன்லைனில் விண்ணப்பிக்கவும். மேற்கோள் மற்றும் நில ஆவணங்களை சமர்ப்பிக்கவும். சரிபார்த்த பின் மானியம் அனுமதிக்கப்படும்.',
    portal: 'https://tnagriculture.tn.gov.in',
    contact: 'Tamil Nadu Agriculture Department: 044-28571077',
    importantDates: 'Open throughout the year. Applications processed in batches.',
    source: 'Tamil Nadu Agriculture Department — tnagriculture.tn.gov.in',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
    },
  },
  {
    id: 'tn-organic-farming',
    name: 'Tamil Nadu Organic Farming Promotion Scheme',
    nameTamil: 'தமிழ்நாடு இயற்கை விவசாய மேம்பாட்டு திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Agriculture Department',
    departmentTamil: 'தமிழ்நாடு விவசாயத் துறை',
    category: 'organic_farming',
    purpose:
      'Promotion of organic farming in Tamil Nadu through training, certification support, and financial assistance for organic inputs and infrastructure.',
    purposeTamil:
      'பயிற்சி, சான்றிதழ் ஆதாரம் மற்றும் இயற்கை உள்ளீடுகள் மற்றும் உள்கட்டமைக்கு நிதி உதவி மூலம் தமிழ்நாட்டில் இயற்கை விவசாயத்தை ஊக்குவித்தல்.',
    eligibility: [
      'Farmers practicing or willing to adopt organic farming in Tamil Nadu',
      'Individual farmers, FPOs, and organic farmer groups',
      'Minimum 0.5 acres of land',
      'Must undergo organic farming training',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் இயற்கை விவசாயம் செய்பவர்கள் அல்லது ஏற்க விரும்புபவர்கள்',
      'தனிப்பட்ட விவசாயிகள், FPOs, மற்றும் இயற்கை விவசாயி குழுக்கள்',
      'குறைந்தது 0.5 ஏக்கர் நிலம்',
      'இயற்கை விவசாய பயிற்சி பெற வேண்டும்',
    ],
    benefits:
      'Financial assistance of ₹10,000 per hectare for organic inputs. Free organic farming training. Certification support through Participatory Guarantee System (PGS). Maximum of ₹50,000 per farmer.',
    benefitsTamil:
      'இயற்கை உள்ளீடுகளுக்கு ஒரு ஹெக்டருக்கு ₹10,000 நிதி உதவி. இலவச இயற்கை விவசாய பயிற்சி. பங்கேற்பு உத்தரவாத அமைப்பு (PGS) மூலம் சான்றிதழ் ஆதாரம். ஒரு விவசாயிக்கு அதிகபட்சம் ₹50,000.',
    documents: [
      'Aadhaar Card',
      'Land documents (Patta/Chitta)',
      'Bank account details',
      'Organic farming training certificate',
      'PGS registration details',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பட்டா/சிட்டா)',
      'வங்கி கணக்கு விவரங்கள்',
      'இயற்கை விவசாய பயிற்சி சான்றிதழ்',
      'PGS பதிவு விவரங்கள்',
    ],
    applicationProcess:
      'Apply through the nearest Block Agriculture Office. Register for organic farming training. After training, submit application with land documents and PGS registration. Financial assistance is provided in installments.',
    applicationProcessTamil:
      'அருகிலுள்ள ஊராட்சி விவசாய அலுவலகத்தில் விண்ணப்பிக்கவும். இயற்கை விவசாய பயிற்சிக்கு பதிவு செய்யவும். பயிற்சிக்கு பின், நில ஆவணங்கள் மற்றும் PGS பதிவுடன் விண்ணப்பத்தை சமர்ப்பிக்கவும். நிதி உதவி தவணைகளாக வழங்கப்படும்.',
    portal: 'https://tnagriculture.tn.gov.in',
    contact: 'Tamil Nadu Agriculture Department: 044-28571077',
    importantDates: 'Open throughout the year',
    source: 'Tamil Nadu Agriculture Department — tnagriculture.tn.gov.in',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
      farmingTypes: ['organic'],
    },
  },
  {
    id: 'tn-livestock',
    name: 'Tamil Nadu Livestock Development Programme',
    nameTamil: 'தமிழ்நாடு கால்நடை மேம்பாட்டு திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Animal Husbandry Department',
    departmentTamil: 'தமிழ்நாடு கால்நடை பராமரிப்புத் துறை',
    category: 'livestock',
    purpose:
      'Financial assistance for purchase of milch animals, poultry, goats, and sheep. Subsidy for construction of animal shelters and purchase of livestock equipment.',
    purposeTamil:
      'பால் பசுக்கள், கோழி, ஆடுகள் வாங்க நிதி உதவி. விலங்கு தங்கல் கட்டுமானம் மற்றும் கால்நடை உபகரணங்கள் வாங்க மானியம்.',
    eligibility: [
      'Farmers in Tamil Nadu with interest in livestock',
      'Small and marginal farmers get priority',
      'Must have space for animal shelter',
      'Women farmers and SHGs get additional priority',
    ],
    eligibilityTamil: [
      'கால்நடையில் ஆர்வம் உள்ள தமிழ்நாடு விவசாயிகள்',
      'சிறு மற்றும் குறு விவசாயிகளுக்கு முன்னுரிமை',
      'விலங்கு தங்கலுக்கு இடம் இருக்க வேண்டும்',
      'பெண் விவசாயிகள் மற்றும் SHG களுக்கு கூடுதல் முன்னுரிமை',
    ],
    benefits:
      'Subsidy of 25-50% for purchase of milch animals (up to ₹30,000 per animal). For goats/sheep: 50% subsidy up to ₹10,000. For poultry: 50% subsidy up to ₹15,000. Animal shelter construction: up to ₹25,000.',
    benefitsTamil:
      'பால் பசுக்கள் வாங்க 25-50% மானியம் (ஒரு விலங்குக்கு ₹30,000 வரை). ஆடுகள்/செம்மறியாடுகளுக்கு: 50% மானியம் ₹10,000 வரை. கோழிக்கு: 50% மானியம் ₹15,000 வரை. விலங்கு தங்கல் கட்டுமானம்: ₹25,000 வரை.',
    documents: [
      'Aadhaar Card',
      'Land documents',
      'Bank account details',
      'Space availability proof for animal shelter',
      'SHG registration (if applicable)',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள்',
      'வங்கி கணக்கு விவரங்கள்',
      'விலங்கு தங்கலுக்கு இட கிடைக்கும் ஆதாரம்',
      'SHG பதிவு (பொருந்தினால்)',
    ],
    applicationProcess:
      'Apply through the nearest Veterinary Dispensary or Assistant Director of Animal Husbandry office. Submit application with land documents and quotation for animals. After verification, subsidy is sanctioned.',
    applicationProcessTamil:
      'அருகிலுள்ள கால்நடை மருத்துவமனை அல்லது கால்நடை பராமரிப்பு துறை உதவி இயக்குநர் அலுவலகத்தில் விண்ணப்பிக்கவும். நில ஆவணங்கள் மற்றும் விலங்குகளுக்கான மேற்கோளுடன் விண்ணப்பத்தை சமர்ப்பிக்கவும். சரிபார்த்த பின் மானியம் அனுமதிக்கப்படும்.',
    portal: 'https://tn.gov.in/ahd',
    contact: 'Tamil Nadu Animal Husbandry Department: 044-24340111',
    importantDates: 'Open throughout the year',
    source: 'Tamil Nadu Animal Husbandry Department — tn.gov.in/ahd',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
    },
  },
  {
    id: 'tn-fisheries',
    name: 'Tamil Nadu Fisheries Development Scheme',
    nameTamil: 'தமிழ்நாடு மீன்வளர்ப்பு மேம்பாட்டு திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Fisheries Department',
    departmentTamil: 'தமிழ்நாடு மீன்வளர்ப்புத் துறை',
    category: 'fisheries',
    purpose:
      'Financial assistance for fish/shrimp farming, pond construction, fish feed, and aquaculture infrastructure. Promotes inland and brackish water aquaculture in Tamil Nadu.',
    purposeTamil:
      'மீன்/இறால் வளர்ப்பு, குளம் கட்டுமானம், மீன் தீவனம் மற்றும் நீர்வாழ் உயிரின உள்கட்டமைக்கு நிதி உதவி. தமிழ்நாட்டில் உள்நில மற்றும் உவர்நீர் மீன்வளர்ப்பை ஊக்குவித்தல்.',
    eligibility: [
      'Farmers and entrepreneurs in Tamil Nadu',
      'Must have suitable land for pond construction',
      'Water source availability required',
      'Priority to coastal district farmers',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் உள்ள விவசாயிகள் மற்றும் தொழில்முனைவோர்',
      'குளம் கட்ட பொருத்தமான நிலம் இருக்க வேண்டும்',
      'தண்ணீர் ஆதாரம் தேவை',
      'கடலோர மாவட்ட விவசாயிகளுக்கு முன்னுரிமை',
    ],
    benefits:
      'Subsidy of 40-60% for pond construction (up to ₹1 lakh per hectare). Fish seed subsidy: 50% up to ₹10,000. Feed subsidy: 25% up to ₹15,000. Equipment subsidy: 40% up to ₹20,000.',
    benefitsTamil:
      'குளம் கட்டுமானத்திற்கு 40-60% மானியம் (ஒரு ஹெக்டருக்கு ₹1 லட்சம் வரை). மீன் விதை மானியம்: 50% ₹10,000 வரை. தீவன மானியம்: 25% ₹15,000 வரை. உபகரண மானியம்: 40% ₹20,000 வரை.',
    documents: [
      'Aadhaar Card',
      'Land documents',
      'Bank account details',
      'Water source proof',
      'Aquaculture training certificate (if applicable)',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள்',
      'வங்கி கணக்கு விவரங்கள்',
      'தண்ணீர் ஆதார ஆதாரம்',
      'மீன்வளர்ப்பு பயிற்சி சான்றிதழ் (பொருந்தினால்)',
    ],
    applicationProcess:
      'Apply through the nearest Fisheries Department office or Assistant Director of Fisheries. Submit land documents and water source proof. Site inspection is conducted before sanctioning subsidy.',
    applicationProcessTamil:
      'அருகிலுள்ள மீன்வளர்ப்புத் துறை அலுவலகம் அல்லது மீன்வளர்ப்பு உதவி இயக்குநரிடம் விண்ணப்பிக்கவும். நில ஆவணங்கள் மற்றும் தண்ணீர் ஆதார ஆதாரத்தை சமர்ப்பிக்கவும். மானியம் அனுமதிக்கு முன் தள ஆய்வு நடத்தப்படும்.',
    portal: 'https://tn.gov.in/fisheries',
    contact: 'Tamil Nadu Fisheries Department: 044-28257504',
    importantDates: 'Open throughout the year',
    source: 'Tamil Nadu Fisheries Department — tn.gov.in/fisheries',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
    },
  },
  {
    id: 'tn-women-farmer',
    name: 'Tamil Nadu Women Farmer Empowerment Scheme',
    nameTamil: 'தமிழ்நாடு பெண் விவசாயி அதிகாரமளிப்பு திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Agriculture Department',
    departmentTamil: 'தமிழ்நாடு விவசாயத் துறை',
    category: 'women_farmer',
    purpose:
      'Special financial assistance and training for women farmers in Tamil Nadu. Promotes women-led agricultural enterprises, kitchen gardens, and women FPOs.',
    purposeTamil:
      'தமிழ்நாட்டில் பெண் விவசாயிகளுக்கு சிறப்பு நிதி உதவி மற்றும் பயிற்சி. பெண்கள் தலைமையிலான விவசாய நிறுவனங்கள், சமையலறை தோட்டங்கள் மற்றும் பெண் FPOs ஊக்குவித்தல்.',
    eligibility: [
      'Women farmers in Tamil Nadu',
      'Must have land ownership or tenancy rights',
      'Women SHGs involved in agriculture',
      'Age 18-60 years',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் உள்ள பெண் விவசாயிகள்',
      'நில உரிமை அல்லது குத்தகை உரிமை இருக்க வேண்டும்',
      'விவசாயத்தில் ஈடுபடும் பெண் SHG கள்',
      'வயது 18-60 ஆண்டுகள்',
    ],
    benefits:
      'Financial assistance up to ₹25,000 for kitchen garden setup. Training in modern farming techniques. Subsidy of 50% for agricultural tools and equipment (up to ₹15,000). Seed kits distributed free of cost.',
    benefitsTamil:
      'சமையலறை தோட்டம் அமைக்க ₹25,000 வரை நிதி உதவி. நவீன விவசாய நுட்பங்களில் பயிற்சி. விவசாய கருவிகள் மற்றும் உபகரணங்களுக்கு 50% மானியம் (₹15,000 வரை). விதை கிட்கள் இலவசமாக வழங்கப்படும்.',
    documents: [
      'Aadhaar Card',
      'Land documents (in woman name or joint)',
      'Bank account details (in woman name)',
      'SHG registration (if applicable)',
      'Age proof',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'நில ஆவணங்கள் (பெண் பெயரில் அல்லது கூட்டாக)',
      'வங்கி கணக்கு விவரங்கள் (பெண் பெயரில்)',
      'SHG பதிவு (பொருந்தினால்)',
      'வயது ஆதாரம்',
    ],
    applicationProcess:
      'Apply through the nearest Block Agriculture Office or Mahilar Arasu Thittam office. Submit land documents and Aadhaar. Women SHGs can apply through their group coordinator.',
    applicationProcessTamil:
      'அருகிலுள்ள ஊராட்சி விவசாய அலுவலகம் அல்லது மகளிர் அரசு திட்ட அலுவலகத்தில் விண்ணப்பிக்கவும். நில ஆவணங்கள் மற்றும் ஆதாரை சமர்ப்பிக்கவும். பெண் SHG கள் தங்கள் குழு ஒருங்கிணைப்பாளர் மூலம் விண்ணப்பிக்கலாம்.',
    portal: 'https://tnagriculture.tn.gov.in',
    contact: 'Tamil Nadu Agriculture Department: 044-28571077',
    importantDates: 'Open throughout the year',
    source: 'Tamil Nadu Agriculture Department — tnagriculture.tn.gov.in',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
      womenOnly: true,
    },
  },
  {
    id: 'tn-youth-agri',
    name: 'Tamil Nadu Youth Agriculture Entrepreneurship Scheme',
    nameTamil: 'தமிழ்நாடு இளைஞர் விவசாய தொழில்முனைவோர் திட்டம்',
    type: 'state',
    department: 'Tamil Nadu Agriculture Department',
    departmentTamil: 'தமிழ்நாடு விவசாயத் துறை',
    category: 'youth',
    purpose:
      'Encourages young farmers (18-40 years) to take up agriculture as a business by providing financial assistance, training, and market linkage support.',
    purposeTamil:
      'இளம் விவசாயிகளை (18-40 வயது) விவசாயத்தை ஒரு வணிகமாக ஏற்க ஊக்குவிக்க நிதி உதவி, பயிற்சி மற்றும் சந்தை இணைப்பு ஆதாரம் வழங்குதல்.',
    eligibility: [
      'Youth aged 18-40 years in Tamil Nadu',
      'Must have agricultural land or lease agreement',
      'Educational qualification: minimum 10th pass',
      'Must undergo agri-entrepreneurship training',
    ],
    eligibilityTamil: [
      'தமிழ்நாட்டில் 18-40 வயது இளைஞர்கள்',
      'விவசாய நிலம் அல்லது குத்தகை ஒப்பந்தம் இருக்க வேண்டும்',
      'கல்வித் தகுதி: குறைந்தது 10ஆம் வகுப்பு தேர்ச்சி',
      'விவசாய தொழில்முனைவோர் பயிற்சி பெற வேண்டும்',
    ],
    benefits:
      'Financial assistance up to ₹2 lakh for agri-business setup. Training in modern farming and business management. Market linkage support. Subsidy of 50% on agri-tech equipment (up to ₹50,000).',
    benefitsTamil:
      'விவசாய வணிக அமைப்பிற்கு ₹2 லட்சம் வரை நிதி உதவி. நவீன விவசாயம் மற்றும் வணிக மேலாண்மையில் பயிற்சி. சந்தை இணைப்பு ஆதாரம். விவசாய தொழில்நுட்ப உபகரணங்களுக்கு 50% மானியம் (₹50,000 வரை).',
    documents: [
      'Aadhaar Card',
      'Age proof',
      'Educational certificates',
      'Land documents or lease agreement',
      'Business plan/project report',
    ],
    documentsTamil: [
      'ஆதார் அட்டை',
      'வயது ஆதாரம்',
      'கல்வி சான்றிதழ்கள்',
      'நில ஆவணங்கள் அல்லது குத்தகை ஒப்பந்தம்',
      'வணிக திட்டம்/திட்ட அறிக்கை',
    ],
    applicationProcess:
      'Apply through the Tamil Nadu Agriculture Department portal or nearest Block Agriculture Office. Submit business plan and educational certificates. Selected candidates undergo training before financial assistance is disbursed.',
    applicationProcessTamil:
      'தமிழ்நாடு விவசாயத் துறை போர்ட்டல் அல்லது அருகிலுள்ள ஊராட்சி விவசாய அலுவலகத்தில் விண்ணப்பிக்கவும். வணிக திட்டம் மற்றும் கல்வி சான்றிதழ்களை சமர்ப்பிக்கவும். தேர்வு செய்யப்பட்டவர்கள் நிதி உதவி வழங்குவதற்கு முன் பயிற்சி பெறுவார்கள்.',
    portal: 'https://tnagriculture.tn.gov.in',
    contact: 'Tamil Nadu Agriculture Department: 044-28571077',
    importantDates: 'Applications accepted January-June each year',
    source: 'Tamil Nadu Agriculture Department — tnagriculture.tn.gov.in',
    lastVerified: '2025-01-15',
    matchCriteria: {
      states: ['Tamil Nadu'],
    },
  },
];

export const schemeCategories: { id: SchemeCategory; key: string }[] = [
  { id: 'income_support', key: 'catIncomeSupport' },
  { id: 'crop_insurance', key: 'catCropInsurance' },
  { id: 'agri_loans', key: 'catAgriLoans' },
  { id: 'interest_subsidy', key: 'catInterestSubsidy' },
  { id: 'irrigation', key: 'catIrrigation' },
  { id: 'solar_agri', key: 'catSolarAgri' },
  { id: 'farm_machinery', key: 'catFarmMachinery' },
  { id: 'equipment_subsidy', key: 'catEquipmentSubsidy' },
  { id: 'drip_irrigation', key: 'catDripIrrigation' },
  { id: 'organic_farming', key: 'catOrganicFarming' },
  { id: 'horticulture', key: 'catHorticulture' },
  { id: 'livestock', key: 'catLivestock' },
  { id: 'dairy', key: 'catDairy' },
  { id: 'fisheries', key: 'catFisheries' },
  { id: 'agri_infra', key: 'catAgriInfra' },
  { id: 'storage', key: 'catStorage' },
  { id: 'fpo', key: 'catFPO' },
  { id: 'women_farmer', key: 'catWomenFarmer' },
  { id: 'youth', key: 'catYouth' },
];
