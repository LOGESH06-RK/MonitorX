import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ta';

type TranslationMap = Record<string, { en: string; ta: string }>;

const translations: TranslationMap = {
  // App
  appName: { en: 'MonitorX', ta: 'MonitorX' },
  appTagline: {
    en: 'AI-Powered Farmer Assistance',
    ta: 'AI அடிப்படையிலான விவசாய உதவி',
  },

  // Navigation
  home: { en: 'Home', ta: 'முகப்பு' },
  schemes: { en: 'Schemes', ta: 'திட்டங்கள்' },
  loans: { en: 'Loans', ta: 'கடன்கள்' },
  calculator: { en: 'Calculator', ta: 'கணக்கீடு' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்' },

  // Home screen
  welcomeFarmer: { en: 'Welcome, Farmer', ta: 'வரவேற்கிறோம், விவசாயி' },
  whatDoYouNeed: {
    en: 'What do you need help with?',
    ta: 'உங்களுக்கு எந்த உதவி தேவை?',
  },
  governmentSchemes: {
    en: 'Government Schemes',
    ta: 'அரசு திட்டங்கள்',
  },
  agriculturalLoans: { en: 'Agricultural Loans', ta: 'விவசாய கடன்கள்' },
  loanEligibility: { en: 'Loan Eligibility', ta: 'கடன் தகுதி' },
  subsidies: { en: 'Subsidies', ta: 'மானியங்கள்' },
  emiCalculator: { en: 'EMI Calculator', ta: 'EMI கணக்கீடு' },
  findBenefits: { en: 'Find Benefits', ta: 'நன்மைகளைக் கண்டறிய' },
  financialAssistance: {
    en: 'Financial Assistance',
    ta: 'நிதி உதவி',
  },
  myProfile: { en: 'My Profile', ta: 'எனது சுயவிவரம்' },
  editProfile: { en: 'Edit Profile', ta: 'சுயவிவரத்தைத் திருத்து' },
  editProfileSubtitle: {
    en: 'Update personal, farm and financial details',
    ta: 'தனிநபர், பண்ணை மற்றும் நிதி விவரங்களை புதுப்பிக்கவும்',
  },
  cancel: { en: 'Cancel', ta: 'ரத்து செய்' },
  closeEdit: { en: 'Close', ta: 'மூடு' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்' },

  // Schemes
  centralSchemes: { en: 'Central Government Schemes', ta: 'மத்திய அரசு திட்டங்கள்' },
  tnSchemes: {
    en: 'Tamil Nadu Government Schemes',
    ta: 'தமிழ்நாடு அரசு திட்டங்கள்',
  },
  allSchemes: { en: 'All Schemes', ta: 'அனைத்து திட்டங்கள்' },
  eligibility: { en: 'Eligibility', ta: 'தகுதி' },
  benefits: { en: 'Benefits', ta: 'நன்மைகள்' },
  documents: { en: 'Documents', ta: 'ஆவணங்கள்' },
  applicationProcess: {
    en: 'Application Process',
    ta: 'விண்ணப்ப செயல்முறை',
  },
  applyNow: { en: 'Apply Now', ta: 'இப்போது விண்ணப்பிக்கவும்' },
  source: { en: 'Source', ta: 'ஆதாரம்' },
  lastVerified: { en: 'Last Verified', ta: 'கடைசியாக சரிபார்க்கப்பட்டது' },
  youMayBeEligible: {
    en: 'You may be eligible',
    ta: 'நீங்கள் தகுதி பெற்றிருக்கலாம்',
  },
  schemeCategories: { en: 'Categories', ta: 'பிரிவுகள்' },
  searchSchemes: { en: 'Search schemes...', ta: 'திட்டங்களைத் தேடவும்...' },
  noSchemesFound: { en: 'No schemes found', ta: 'திட்டங்கள் இல்லை' },
  recommendedForYou: {
    en: 'Recommended for You',
    ta: 'உங்களுக்கு பரிந்துரைக்கப்படுகிறது',
  },
  whyRelevant: {
    en: 'Why it may be relevant',
    ta: 'ஏன் பொருந்தக்கூடும்',
  },
  potentialBenefit: { en: 'Potential Benefit', ta: 'சாத்தியமான நன்மை' },

  // Loans
  loanProducts: { en: 'Loan Products', ta: 'கடன் தயாரிப்புகள்' },
  interestRate: { en: 'Interest Rate', ta: 'வட்டி விகிதம்' },
  loanAmount: { en: 'Loan Amount', ta: 'கடன் தொகை' },
  tenure: { en: 'Tenure', ta: 'கால அளவு' },
  processingFee: { en: 'Processing Fee', ta: 'செயலாக்க கட்டணம்' },
  checkEligibility: { en: 'Check Eligibility', ta: 'தகுதி சரிபார்க்கவும்' },
  aiEstimateOnly: {
    en: 'AI estimate only — final approval is determined by the bank/lender',
    ta: 'AI மதிப்பீடு மட்டுமே — இறுதி ஒப்புதல் வங்கி/கடன் வழங்குபவரால் தீர்மானிக்கப்படும்',
  },
  eligible: { en: 'Eligible', ta: 'தகுதி உடைய' },
  potentiallyEligible: {
    en: 'Potentially Eligible',
    ta: 'தகுதி பெற்றிருக்கலாம்',
  },
  notEligible: { en: 'Not Eligible', ta: 'தகுதி இல்லை' },
  lowRisk: { en: 'Low Risk', ta: 'குறைந்த ஆபத்து' },
  mediumRisk: { en: 'Medium Risk', ta: 'நடுத்தர ஆபத்து' },
  highRisk: { en: 'High Risk', ta: 'அதிக ஆபத்து' },
  eligibilityScore: { en: 'Eligibility Score', ta: 'தகுதி மதிப்பெண்' },
  factorsAffecting: {
    en: 'Factors Affecting Your Eligibility',
    ta: 'உங்கள் தகுதியை பாதிக்கும் காரணிகள்',
  },
  positiveFactors: { en: 'Positive Factors', ta: 'நேர்மறை காரணிகள்' },
  negativeFactors: { en: 'Areas of Concern', ta: 'கவலைப்பட வேண்டிய பகுதிகள்' },
  recommendations: { en: 'Recommendations', ta: 'பரிந்துரைகள்' },
  compareLoans: { en: 'Compare Loans', ta: 'கடன்களை ஒப்பிடுக' },
  requiredDocuments: { en: 'Required Documents', ta: 'தேவையான ஆவணங்கள்' },

  // EMI Calculator
  loanAmountLabel: { en: 'Loan Amount (₹)', ta: 'கடன் தொகை (₹)' },
  interestRateLabel: { en: 'Interest Rate (% per year)', ta: 'வட்டி விகிதம் (% ஆண்டுக்கு)' },
  tenureLabel: { en: 'Tenure (months)', ta: 'கால அளவு (மாதங்கள்)' },
  monthlyEMI: { en: 'Monthly EMI', ta: 'மாதாந்திர EMI' },
  totalInterest: { en: 'Total Interest', ta: 'மொத்த வட்டி' },
  totalPayable: { en: 'Total Payable', ta: 'மொத்த செலுத்த வேண்டிய தொகை' },
  calculate: { en: 'Calculate', ta: 'கணக்கிடு' },

  // Subsidy Finder
  subsidyFinder: { en: 'Subsidy Finder', ta: 'மானிய கண்டுபிடிப்பான்' },
  findSubsidies: { en: 'Find Subsidies', ta: 'மானியங்களைக் கண்டறிய' },
  selectState: { en: 'Select State', ta: 'மாநிலத்தைத் தேர்வு செய்யவும்' },
  selectCrop: { en: 'Select Crop', ta: 'பயிரைத் தேர்வு செய்யவும்' },
  selectCategory: { en: 'Select Category', ta: 'பிரிவைத் தேர்வு செய்யவும்' },
  noSubsidiesFound: { en: 'No subsidies found', ta: 'மானியங்கள் இல்லை' },

  // Profile
  farmerProfile: { en: 'Farmer Profile', ta: 'விவசாயி சுயவிவரம்' },
  fullName: { en: 'Full Name', ta: 'முழுப் பெயர்' },
  phone: { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
  age: { en: 'Age', ta: 'வயது' },
  state: { en: 'State', ta: 'மாநிலம்' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  farmerCategory: { en: 'Farmer Category', ta: 'விவசாயி வகை' },
  farmingType: { en: 'Farming Type', ta: 'விவசாய வகை' },
  cropType: { en: 'Crop Type', ta: 'பயிர் வகை' },
  landSize: { en: 'Land Size (acres)', ta: 'நில அளவு (ஏக்கர்)' },
  landOwnership: { en: 'Land Ownership', ta: 'நில உரிமை' },
  irrigationAvailable: { en: 'Irrigation Available', ta: 'நீர்ப்பாசனம் உள்ளது' },
  irrigationType: { en: 'Irrigation Type', ta: 'நீர்ப்பாசன வகை' },
  annualAgriculturalIncome: {
    en: 'Annual Agricultural Income (₹)',
    ta: 'ஆண்டு விவசாய வருவாய் (₹)',
  },
  otherIncome: { en: 'Other Annual Income (₹)', ta: 'பிற ஆண்டு வருவாய் (₹)' },
  existingLoans: { en: 'Existing Loans (₹)', ta: 'ஏற்கனவே உள்ள கடன்கள் (₹)' },
  monthlyExpenses: { en: 'Monthly Expenses (₹)', ta: 'மாதாந்திர செலவுகள் (₹)' },
  creditScore: { en: 'Credit Score', ta: 'கடன் மதிப்பெண்' },
  repaymentHistory: { en: 'Repayment History', ta: 'திருப்பிச் செலுத்தல் வரலாறு' },
  livestockType: { en: 'Livestock Type', ta: 'கால்நடை வகை' },
  equipmentNeeded: { en: 'Equipment Needed', ta: 'தேவையான உபகரணங்கள்' },
  hasKCC: { en: 'Has Kisan Credit Card', ta: 'Kisan Credit Card உள்ளது' },
  hasPMFBY: { en: 'Has Crop Insurance (PMFBY)', ta: 'பயிர் காப்பீடு (PMFBY) உள்ளது' },
  save: { en: 'Save', ta: 'சேமி' },
  edit: { en: 'Edit', ta: 'திருத்து' },
  createProfile: { en: 'Create Your Profile', ta: 'உங்கள் சுயவிவரத்தை உருவாக்கவும்' },
  profileRequired: {
    en: 'Create your farmer profile to get personalized recommendations',
    ta: 'தனிப்பயன் பரிந்துரைகளைப் பெற உங்கள் விவசாயி சுயவிவரத்தை உருவாக்கவும்',
  },

  // Categories
  catIncomeSupport: { en: 'Income Support', ta: 'வருவாய் ஆதாரம்' },
  catCropInsurance: { en: 'Crop Insurance', ta: 'பயிர் காப்பீடு' },
  catAgriLoans: { en: 'Agricultural Loans', ta: 'விவசாய கடன்கள்' },
  catInterestSubsidy: { en: 'Interest Subsidy', ta: 'வட்டி மானியம்' },
  catIrrigation: { en: 'Irrigation', ta: 'நீர்ப்பாசனம்' },
  catSolarAgri: { en: 'Solar Agriculture', ta: 'சூரிய விவசாயம்' },
  catFarmMachinery: { en: 'Farm Machinery', ta: 'விவசாய இயந்திரங்கள்' },
  catEquipmentSubsidy: { en: 'Equipment Subsidy', ta: 'உபகரண மானியம்' },
  catDripIrrigation: { en: 'Drip Irrigation', ta: 'சொட்டு நீர்ப்பாசனம்' },
  catOrganicFarming: { en: 'Organic Farming', ta: '�யற்கை விவசாயம்' },
  catHorticulture: { en: 'Horticulture', ta: 'தோட்டக்கலை' },
  catLivestock: { en: 'Livestock', ta: 'கால்நடை' },
  catDairy: { en: 'Dairy', ta: 'பால் பண்ணை' },
  catFisheries: { en: 'Fisheries', ta: 'மீன்வளர்ப்பு' },
  catAgriInfra: { en: 'Agricultural Infrastructure', ta: 'விவசாய உள்கட்டமை' },
  catStorage: { en: 'Storage/Warehouse', ta: 'சேமிப்பு/கிடங்கு' },
  catFPO: { en: 'Farmer Producer Organizations', ta: 'விவசாயி உற்பத்தியாளர் அமைப்புகள்' },
  catWomenFarmer: { en: 'Women Farmer Support', ta: 'பெண் விவசாயி ஆதாரம்' },
  catYouth: { en: 'Youth/Entrepreneurship', ta: 'இளைஞர்/தொழில்முனைவோர்' },

  // Misc
  disclaimer: {
    en: 'MonitorX provides AI-based financial guidance, loan eligibility estimates, and government-scheme recommendations. It does not guarantee loan approval or government-scheme benefits. Final loan approval, interest rate, loan amount, terms, documentation, and eligibility are determined by the respective bank/lender. Government scheme eligibility and benefit approval are determined by the respective government department or implementing authority.',
    ta: 'MonitorX AI அடிப்படையிலான நிதி வழிகாட்டுதல், கடன் தகுதி மதிப்பீடுகள் மற்றும் அரசு திட்ட பரிந்துரைகளை வழங்குகிறது. கடன் ஒப்புதல் அல்லது அரசு திட்ட நன்மைகளை உத்திரவாதம் செய்யவில்லை. இறுதி கடன் ஒப்புதல், வட்டி விகிதம், கடன் தொகை, விதிகள், ஆவணங்கள் மற்றும் தகுதி ஆகியவை தொடர்புடைய வங்கி/கடன் வழங்குபவரால் தீர்மானிக்கப்படும். அரசு திட்ட தகுதி மற்றும் நன்மை ஒப்புதல் தொடர்புடைய அரசு துறையால் தீர்மானிக்கப்படும்.',
  },
  loading: { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
  error: { en: 'Something went wrong', ta: 'ஏதோ தவறு நடந்தது' },
  retry: { en: 'Retry', ta: 'மீண்டும் முயற்சி' },
  noProfileYet: {
    en: 'No profile found. Create one to get started.',
    ta: 'சுயவிவரம் இல்லை. தொடங்க ஒன்றை உருவாக்கவும்.',
  },
  saveSuccess: { en: 'Profile saved successfully', ta: 'சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது' },
  saveError: { en: 'Failed to save profile', ta: 'சுயவிவரத்தை சேமிக்க முடியவில்லை' },
  language: { en: 'Language', ta: 'மொழி' },
  english: { en: 'English', ta: 'ஆங்கிலம்' },
  tamil: { en: 'Tamil', ta: 'தமிழ்' },
  viewDetails: { en: 'View Details', ta: 'விவரங்களைக் காண்க' },
  close: { en: 'Close', ta: 'மூடு' },
  back: { en: 'Back', ta: 'பின்' },
  apply: { en: 'Apply', ta: 'விண்ணப்பிக்கவும்' },
  interested: { en: 'Interested', ta: 'ஆர்வம்' },
  applied: { en: 'Applied', ta: 'விண்ணப்பித்தது' },
  schemeType: { en: 'Scheme Type', ta: 'திட்ட வகை' },
  central: { en: 'Central', ta: 'மத்திய' },
  stateGovt: { en: 'State Government', ta: 'மாநில அரசு' },
  department: { en: 'Department', ta: 'துறை' },
  purpose: { en: 'Purpose', ta: 'நோக்கம்' },
  whoCanApply: { en: 'Who Can Apply', ta: 'யார் விண்ணப்பிக்கலாம்' },
  contactInfo: { en: 'Contact Information', ta: 'தொடர்பு தகவல்' },
  importantDates: { en: 'Important Dates', ta: 'முக்கிய தேதிகள்' },
  applicationPortal: { en: 'Application Portal', ta: 'விண்ணப்ப போர்ட்டல்' },
  noNotifications: {
    en: 'No notifications yet',
    ta: 'இன்னும் அறிவிப்புகள் இல்லை',
  },
  markAsRead: { en: 'Mark as read', ta: 'படித்ததாக குறி' },
  newScheme: { en: 'New Scheme', ta: 'புதிய திட்டம்' },
  deadline: { en: 'Deadline', ta: 'கடைசி தேதி' },
  announcement: { en: 'Announcement', ta: 'அறிவிப்பு' },
  myApplications: { en: 'My Applications', ta: 'எனது விண்ணப்பங்கள்' },
  applicationHistory: { en: 'Application History', ta: 'விண்ணப்ப வரலாறு' },
  noApplications: {
    en: 'No applications yet',
    ta: 'இன்னும் விண்ணப்பங்கள் இல்லை',
  },
  small: { en: 'Small Farmer', ta: 'சிறு விவசாயி' },
  marginal: { en: 'Marginal Farmer', ta: 'குறு விவசாயி' },
  medium: { en: 'Medium Farmer', ta: 'நடுத்தர விவசாயி' },
  large: { en: 'Large Farmer', ta: 'பெரிய விவசாயி' },
  tenant: { en: 'Tenant/Sharecropper', ta: 'குத்தகை/பட்டதார்' },
  owned: { en: 'Owned', ta: 'சொந்தம்' },
  leased: { en: 'Leased', ta: 'குத்தகை' },
  good: { en: 'Good', ta: 'நல்ல' },
  average: { en: 'Average', ta: 'சராசரி' },
  poor: { en: 'Poor', ta: 'மோசம்' },
  none: { en: 'None', ta: 'இல்லை' },

  // Auth & Security
  loginTitle: { en: 'Sign In to MonitorX', ta: 'MonitorX இல் உள்நுழையவும்' },
  loginSubtitle: { en: 'Secure access to farmer subsidies, loans & credit assessments', ta: 'விவசாய மானியங்கள், கடன்கள் மற்றும் கடன் மதிப்பீடுகளுக்கான பாதுகாப்பான அணுகல்' },
  mobileNumber: { en: 'Mobile Number', ta: 'கைபேசி எண்' },
  enter10Digits: { en: 'Enter 10-digit mobile number', ta: '10 இலக்க கைபேசி எண்ணை உள்ளிடவும்' },
  sendOtp: { en: 'Send OTP', ta: 'OTP அனுப்புக' },
  otpVerification: { en: 'OTP Verification', ta: 'OTP சரிபார்ப்பு' },
  enter6DigitOtp: { en: 'Enter the 6-digit OTP sent to', ta: 'அனுப்பப்பட்ட 6 இலக்க OTP ஐ உள்ளிடவும்:' },
  resendOtp: { en: 'Resend OTP', ta: 'OTP மீண்டும் அனுப்புக' },
  resendIn: { en: 'Resend in', ta: 'மீண்டும் அனுப்ப' },
  verifyAndProceed: { en: 'Verify & Proceed', ta: 'சரிபார்த்து தொடரவும்' },
  changeMobile: { en: 'Change Mobile Number', ta: 'எண்ணை மாற்றவும்' },
  invalidOtp: { en: 'Invalid OTP code. Please enter the correct 6 digits.', ta: 'தவறான OTP. சரியான 6 இலக்கங்களை உள்ளிடவும்.' },
  expiredOtp: { en: 'OTP expired. Please request a new one.', ta: 'OTP காலாவதியானது. புதியதை கோரவும்.' },
  demoOtpHint: { en: 'Testing hint: Enter 123456 or the code shown', ta: 'சோதனை உதவிக்குறிப்பு: 123456 அல்லது திரையில் உள்ள குறியீட்டை உள்ளிடவும்' },
  secureAuth: { en: '100% Encrypted & RBI Guideline Compliant', ta: '100% பாதுகாப்பானது & RBI வழிகாட்டுதல்களுக்கு உட்பட்டது' },
  logout: { en: 'Log Out', ta: 'வெளியேறு' },

  // 4-Step Onboarding & Profile Wizard
  stepIndicator: { en: 'Step', ta: 'படி' },
  of: { en: 'of', ta: 'இல்' },
  step1Title: { en: 'Personal Details', ta: 'தனிநபர் விவரங்கள்' },
  step2Title: { en: 'Farm Details', ta: 'பண்ணை விவரங்கள்' },
  step3Title: { en: 'Financial Details', ta: 'நிதி விவரங்கள்' },
  step4Title: { en: 'Credit Details', ta: 'கடன் விவரங்கள்' },
  gender: { en: 'Gender', ta: 'பாலினம்' },
  selectGender: { en: 'Select Gender', ta: 'பாலினத்தைத் தேர்ந்தெடுக்கவும்' },
  male: { en: 'Male', ta: 'ஆண்' },
  female: { en: 'Female', ta: 'பெண்' },
  other: { en: 'Other', ta: 'மற்றவை' },
  genderRequired: { en: 'Please select your gender', ta: 'தயவுசெய்து உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும்' },
  required: { en: 'Required', ta: 'தேவை' },
  optional: { en: 'Optional', ta: 'விருப்பத்தேர்வு' },
  continueBtn: { en: 'Continue', ta: 'தொடரவும்' },
  backBtn: { en: 'Back', ta: 'பின்செல்க' },
  saveProfileBtn: { en: 'Save Profile', ta: 'சுயவிவரத்தை சேமி' },
  completeProfileBtn: { en: 'Complete Setup', ta: 'அமைப்பை முடிக்கவும்' },
  profileSavedSuccess: { en: 'Farmer profile saved successfully!', ta: 'விவசாயி சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது!' },

  // Districts & States
  selectDistrict: { en: 'Select District (Tamil Nadu)', ta: 'மாவட்டத்தை தேர்வு செய்க (தமிழ்நாடு)' },
  searchDistricts: { en: 'Search district...', ta: 'மாவட்டத்தை தேடவும்...' },

  // Crops & Farming
  searchCrops: { en: 'Search or add crop...', ta: 'பயிரைத் தேட அல்லது சேர்க்க...' },
  popularCrops: { en: 'Popular Crops', ta: 'பிரபலமான பயிர்கள்' },
  selectedCrops: { en: 'Selected Crops', ta: 'தேர்ந்தெடுக்கப்பட்ட பயிர்கள்' },
  addCustomCrop: { en: 'Add Other Crop', ta: 'மற்ற பயிரைச் சேர்' },
  farmingTypesHeader: { en: 'Farming Types (Select all that apply)', ta: 'விவசாய வகைகள்' },
  irrigationSourcesHeader: { en: 'Irrigation Sources', ta: 'நீர்ப்பாசன ஆதாரங்கள்' },
  livestockHeader: { en: 'Livestock Available', ta: 'கால்நடைகள்' },
  equipmentHeader: { en: 'Equipment Needed / Owned', ta: 'தேவைப்படும் / சொந்தமான உபகரணங்கள்' },

  // Credit Details
  creditScoreOptional: { en: 'Credit Score (Optional)', ta: 'கடன் மதிப்பெண் (விருப்பத்தேர்வு)' },
  dontKnowCreditScore: { en: "I don't know my credit score", ta: 'எனது கடன் மதிப்பெண் எனக்குத் தெரியாது' },
  scoreRangeHint: { en: 'Enter score between 300 and 900', ta: '300 முதல் 900 வரையிலான மதிப்பெண்ணை உள்ளிடவும்' },
  scoreInvalidRange: { en: 'Credit score must be between 300 and 900', ta: 'கடன் மதிப்பெண் 300 முதல் 900 வரை இருக்க வேண்டும்' },
  repaymentHistoryTitle: { en: 'Repayment History', ta: 'திருப்பிச் செலுத்தல் வரலாறு' },
  kccStatusTitle: { en: 'Kisan Credit Card (KCC) Status', ta: 'கிசான் கிரெடிட் கார்டு (KCC) நிலை' },
  pmfbyStatusTitle: { en: 'Crop Insurance (PMFBY) Status', ta: 'பயிர் காப்பீட்டு (PMFBY) நிலை' },

  // Status Labels
  active: { en: 'Active', ta: 'செயலில் உள்ளது' },
  inactive: { en: 'Not Active', ta: 'செயலில் இல்லை' },
  appliedPending: { en: 'Applied / Pending', ta: 'விண்ணப்பிக்கப்பட்டது / நிலுவையில் உள்ளது' },
  covered: { en: 'Covered', ta: 'காப்பீடு செய்யப்பட்டுள்ளது' },
  notCovered: { en: 'Not Covered', ta: 'காப்பீடு செய்யப்படவில்லை' },
  dontKnow: { en: "Don't Know", ta: 'தெரியாது' },

  // Repayment Options
  noPreviousLoan: { en: 'No previous loan', ta: 'முந்தைய கடன் இல்லை' },
  alwaysOnTime: { en: 'Always paid on time', ta: 'எப்போதும் சரியான நேரத்தில் செலுத்தியது' },
  mostlyOnTime: { en: 'Mostly on time', ta: 'பெரும்பாலும் சரியான நேரத்தில்' },
  someDelayedPayments: { en: 'Some delayed payments', ta: 'சில தாமதமான கொடுப்பனவுகள்' },
  currentlyOverdue: { en: 'Currently overdue', ta: 'தற்போது நிலுவையில் உள்ளது' },
  previousDefault: { en: 'Previous default', ta: 'முந்தைய தவணை தவறியது' },

  // Financial & Debt
  existingMonthlyEmi: { en: 'Actual Existing Monthly Loan EMI (₹/month)', ta: 'தற்போது செலுத்தும் மாத கடன் தவணை (₹/மாதம்)' },
  existingMonthlyEmiHint: { en: 'Total EMI paid each month across all existing loans', ta: 'அனைத்து கடன்களுக்கும் ஒவ்வொரு மாதமும் செலுத்தப்படும் மொத்த EMI' },
  totalExistingLoanDebt: { en: 'Total Outstanding Loan Amount (₹)', ta: 'மொத்த நிலுவையில் உள்ள கடன் தொகை (₹)' },
  monthlyHouseholdExpenses: { en: 'Monthly Household & Farm Expenses (₹)', ta: 'மாதாந்திர குடும்ப & பண்ணை செலவுகள் (₹)' },
  newLoanAffordability: { en: 'Estimated Affordability (FOIR)', ta: 'மதிப்பிடப்பட்ட கடன் தாங்கும் திறன்' },
  likelyEligible: { en: 'Likely Eligible', ta: 'தகுதி பெற அதிக வாய்ப்பு' },
  likelyEligibleDesc: { en: 'Your profile matches key eligibility criteria. Bank review required.', ta: 'உங்கள் சுயவிவரம் முக்கிய தகுதி வரம்புகளுடன் பொருந்துகிறது. வங்கி மதிப்பாய்வு தேவை.' },
  potentiallyEligibleDesc: { en: 'You may qualify with additional collateral or a co-applicant.', ta: 'கூடுதல் ஆவணங்கள் அல்லது இணை விண்ணப்பதாரருடன் நீங்கள் தகுதி பெறலாம்.' },
  checkCriteriaDesc: { en: 'High debt burden or missing prerequisite limits approval.', ta: 'அதிக கடன் சுமை அல்லது முன்நிபந்தனைகள் இல்லாமை ஒப்புதலை பாதிக்கலாம்.' },

  // Admin & Data Isolation
  admin: { en: 'Admin', ta: 'நிர்வாகம்' },
  adminPortal: { en: 'Admin Portal', ta: 'நிர்வாக போர்ட்டல்' },
  adminDashboard: { en: 'Bank Officer & Admin Dashboard', ta: 'வங்கி அலுவலர் & நிர்வாக டாஷ்போர்டு' },
  customerSearch: { en: 'Search by Customer ID, Name, Phone, District', ta: 'வாடிக்கையாளர் ஐடி, பெயர், தொலைபேசி, மாவட்டம் மூலம் தேடவும்' },
  allCustomers: { en: 'Registered Farmers', ta: 'பதிவு செய்யப்பட்ட விவசாயிகள்' },
  customerDossier: { en: 'Farmer Dossier', ta: 'விவசாயி கோப்பு' },
  dataIsolationAudit: { en: 'Data Isolation Audit', ta: 'தரவு தனிமைப்படுத்தல் தணிக்கை' },
  applyForLoan: { en: 'Apply for Loan', ta: 'கடனுக்கு விண்ணப்பிக்கவும்' },
  submitApplication: { en: 'Submit Application', ta: 'விண்ணப்பத்தை சமர்ப்பிக்கவும்' },
  applicationSubmitted: { en: 'Application Submitted', ta: 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது' },
  applicationSubmittedDesc: { en: 'Your loan application has been registered in the database with status: Interested.', ta: 'உங்கள் கடன் விண்ணப்பம் தரவுத்தளத்தில் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.' },
  appliedLoans: { en: 'Submitted Loan Applications', ta: 'சமர்ப்பிக்கப்பட்ட கடன் விண்ணப்பங்கள்' },
  appliedSchemes: { en: 'Expressed Scheme Interests', ta: 'பதிவு செய்த அரசு திட்டங்கள்' },
  eligibilityHistory: { en: 'AI Eligibility Assessments', ta: 'AI கடன் தகுதி மதிப்பீடுகள்' },
  customerDetails: { en: 'Farmer Profile & Agricultural Details', ta: 'விவசாய சுயவிவரம் & பண்ணை விவரங்கள்' },
  noRecordsFound: { en: 'No matching farmer records found in database', ta: 'பொருந்தக்கூடிய விவசாயி பதிவுகள் எதுவும் கிடைக்கவில்லை' },
  switchBackToFarmer: { en: 'Switch to Farmer View', ta: 'விவசாயி பார்வைக்கு மாறவும்' },
  verifiedDataIsolation: { en: '100% Isolated Data — Zero Cross-User Leakage', ta: '100% தனிமைப்படுத்தப்பட்ட தரவு — பயனர் கசிவு இல்லை' },

  // ML Loan Eligibility Analysis
  mlAnalysisTitle: { en: 'ML-Powered Loan Analysis', ta: 'ML அடிப்படையிலான கடன் பகுப்பாய்வு' },
  mlAnalysisSubtitle: {
    en: 'Random Forest algorithm — AI-driven deep analysis',
    ta: 'ரேண்டம் ஃபாரஸ்ட் அல்காரிதம் — AI இயக்கும் ஆழமான பகுப்பாய்வு',
  },
  mlRunAnalysis: { en: 'Run ML Analysis', ta: 'ML பகுப்பாய்வை இயக்கு' },
  mlAnalyzing: { en: 'Analyzing...', ta: 'பகுப்பாய்வு செய்கிறது...' },
  mlEligibilityLikelihood: { en: 'Eligibility Likelihood', ta: 'தகுதி வாய்ப்பு' },
  mlLikelyEligible: { en: 'Likely Eligible', ta: 'தகுதி பெற அதிக வாய்ப்பு' },
  mlNeedsReview: { en: 'Needs Review', ta: 'மதிப்பாய்வு தேவை' },
  mlHigherRisk: { en: 'Higher Risk', ta: 'அதிக ஆபத்து' },
  mlPositiveFactors: { en: 'Positive Factors', ta: 'நேர்மறை காரணிகள்' },
  mlRiskFactors: { en: 'Risk Factors', ta: 'ஆபத்து காரணிகள்' },
  mlRecommendedLoan: { en: 'Recommended Loan Product', ta: 'பரிந்துரைக்கப்படும் கடன் தயாரிப்பு' },
  mlAlternativeLoan: { en: 'Alternative Option', ta: 'மாற்று விருப்பம்' },
  mlSuggestedAmount: { en: 'Suggested Loan Amount Range', ta: 'பரிந்துரைக்கப்படும் கடன் தொகை வரம்பு' },
  mlRequiredDocuments: { en: 'Required Documents', ta: 'தேவையான ஆவணங்கள்' },
  mlDocumentDisclaimer: {
    en: 'Required documents may vary by lender, loan product and applicant. Verify the final checklist with the selected bank.',
    ta: 'தேவையான ஆவணங்கள் கடன் வழங்குபவர், கடன் தயாரிப்பு மற்றும் விண்ணப்பதாரர் மூலம் மாறுபடலாம். தேர்ந்தெடுக்கப்பட்ட வங்கியுடன் இறுதி பட்டியலை சரிபார்க்கவும்.',
  },
  mlDisclaimer: {
    en: 'This ML-based assessment uses a Random Forest algorithm trained on structured data to estimate eligibility likelihood. It is a decision-support tool, NOT a bank approval or guarantee. Final loan eligibility, interest rate, amount, and terms are determined solely by the respective bank or lender.',
    ta: 'இந்த ML அடிப்படையிலான மதிப்பீடு கட்டமைக்கப்பட்ட தரவுகளில் பயிற்சியளிக்கப்பட்ட ரேண்டம் ஃபாரஸ்ட் அல்காரிதத்தைப் பயன்படுத்தி தகுதி வாய்ப்பை மதிப்பிடுகிறது. இது முடிவெடுக்க உதவும் கருவி, வங்கி ஒப்புதல் அல்லது உத்தரவாதம் அல்ல. இறுதி கடன் தகுதி, வட்டி விகிதம், தொகை மற்றும் விதிகள் தொடர்புடைய வங்கியால் மட்டுமே தீர்மானிக்கப்படும்.',
  },
  mlModelInfo: {
    en: 'Model: Random Forest (20 trees) trained on 2,850 loan records',
    ta: 'மாதிரி: ரேண்டம் ஃபாரஸ்ட் (20 மரங்கள்) 2,850 கடன் பதிவுகளில் பயிற்சியளிக்கப்பட்டது',
  },
  mlWhyRecommended: { en: 'Why recommended', ta: 'ஏன் பரிந்துரைக்கப்படுகிறது' },
  mlBestMatch: { en: 'Best Match', ta: 'சிறந்த பொருத்தம்' },
  mlAlternative: { en: 'Alternative', ta: 'மாற்று' },
  mlSuggestedRange: { en: 'Based on your income and debt profile', ta: 'உங்கள் வருவாய் மற்றும் கடன் சுயவிவரத்தின் அடிப்படையில்' },
  mlFinalDecision: {
    en: 'Final loan amount is decided by the lender',
    ta: 'இறுதி கடன் தொகை கடன் வழங்குபவரால் தீர்மானிக்கப்படும்',
  },
  mlProfileIncomplete: {
    en: 'Please complete your financial profile (income, credit score) for a more accurate ML analysis.',
    ta: 'மிகவும் துல்லியமான ML பகுப்பாய்வுக்கு உங்கள் நிதி சுயவிவரத்தை (வருவாய், கடன் மதிப்பெண்) முடிக்கவும்.',
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
