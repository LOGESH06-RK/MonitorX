import type { FarmerProfile, EligibilityResult, EligibilityFactor } from './supabase';
import type { GovernmentScheme } from './schemes';
import type { LoanProduct } from './loans';

export type SchemeMatch = {
  scheme: GovernmentScheme;
  matchScore: number;
  matchReasons: string[];
  matchReasonsTamil: string[];
  eligibilityLevel: 'likely_eligible' | 'potentially_eligible' | 'check_criteria';
};

// Calculate monthly EMI using standard formula: P * r * (1+r)^n / ((1+r)^n - 1)
export function calculateMonthlyEMI(principal: number, annualInterestRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualInterestRate <= 0) return principal / tenureMonths;

  const monthlyRate = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

export function assessLoanEligibility(
  profile: FarmerProfile,
  loanType: string,
  requestedAmount: number,
  tenureMonths: number,
  product?: LoanProduct
): EligibilityResult {
  const ASSESSMENT_VERSION = '2.1.0-rule_engine';
  const factors: EligibilityFactor[] = [];
  let score = 50;

  const totalAnnualIncome = (profile.annual_agricultural_income || 0) + (profile.other_income || 0);

  // CRITICAL FIX: Do NOT use monthlyIncome=1 as fake fallback.
  // If income is unknown, mark as insufficient and reduce score.
  const incomeKnown = totalAnnualIncome > 0;
  const monthlyIncome = incomeKnown ? totalAnnualIncome / 12 : 0;

  if (!incomeKnown) {
    score -= 10;
    factors.push({
      factor: 'Income Information Unavailable',
      factorTamil: 'வருவாய் தகவல் இல்லை',
      impact: 'negative',
      weight: -10,
      explanation: 'Annual income has not been provided. Lenders require income proof to evaluate repayment capacity. Please update your financial profile.',
      explanationTamil: 'வருடாந்திர வருவாய் வழங்கப்படவில்லை. திருப்பிச் செலுத்தும் திறனை மதிப்பிட வங்கிகளுக்கு வருவாய் ஆதாரம் தேவை.',
    });
  }

  // CRITICAL FIX: Do NOT invent EMI from existingLoans/48 without user confirmation.
  // Only use explicitly entered existing_monthly_emi value.
  const existingMonthlyEmi = profile.existing_monthly_emi != null && profile.existing_monthly_emi > 0
    ? profile.existing_monthly_emi
    : 0;

  const existingLoanTotalReported = profile.existing_loans || 0;
  if (existingLoanTotalReported > 0 && !profile.existing_monthly_emi) {
    factors.push({
      factor: 'Existing Monthly EMI Not Specified',
      factorTamil: 'தற்போதைய மாத தவணை தெரியவில்லை',
      impact: 'neutral',
      weight: 0,
      explanation: 'You reported existing loans but did not specify the current monthly EMI. Please update your financial profile for a more accurate assessment.',
      explanationTamil: 'தற்போது கடன் இருப்பதாக குறிப்பிட்டீர்கள், ஆனால் மாதாந்திர EMI தெரிவிக்கவில்லை. சரியான மதிப்பீட்டிற்கு நிதி சுயவிவரத்தை புதுப்பிக்கவும்.',
    });
  }

  const creditScore = profile.credit_score || 0;
  const age = profile.age || 0;

  // CRITICAL FIX: Do NOT default repayment_history to 'always_on_time'.
  // If not set, it is genuinely unknown — treat neutrally.
  const repaymentHistory = profile.repayment_history || 'not_provided';
  const landSize = profile.land_size_acres || 0;

  // 1. Calculate Estimated New Loan EMI & Total Monthly Debt Service (FOIR) (Issues 30, 31)
  const interestRate = product?.interestRateValue || 8.5;
  const newLoanEmi = calculateMonthlyEMI(requestedAmount, interestRate, tenureMonths);
  const totalMonthlyDebtService = existingMonthlyEmi + newLoanEmi;

  // Guard against division by zero when income is unknown
  if (!incomeKnown || monthlyIncome <= 0) {
    // Cannot calculate FOIR without income — add neutral note
    factors.push({
      factor: 'FOIR Cannot Be Calculated',
      factorTamil: 'FOIR கணக்கிட முடியவில்லை',
      impact: 'neutral',
      weight: 0,
      explanation: 'Fixed Obligation to Income Ratio (FOIR) measures your monthly loan repayments as a percentage of monthly income. Please provide your annual income for a complete assessment.',
      explanationTamil: 'FOIR என்பது மாதாந்திர கடன் தவணை மாத வருவாயில் எத்தனை சதவீதம் என்று காட்டும். முழுமையான மதிப்பீட்டிற்கு வருடாந்திர வருவாயை வழங்கவும்.',
    });
  } else {
    const foirRatio = Math.round((totalMonthlyDebtService / monthlyIncome) * 100);

    if (foirRatio <= 45) {
      score += 25;
      factors.push({
        factor: 'Debt Service Affordability (FOIR)',
        factorTamil: 'கடன் திருப்பிச் செலுத்தும் திறன் (FOIR)',
        impact: 'positive',
        weight: 25,
        explanation: `Your total monthly loan obligations (Existing EMI ₹${Math.round(existingMonthlyEmi).toLocaleString('en-IN')} + New Loan EMI ₹${newLoanEmi.toLocaleString('en-IN')}) consume only ${foirRatio}% of monthly income — well within the safe 50% threshold that banks recommend.`,
        explanationTamil: `உங்கள் மொத்த மாத கடன் கடமைகள் (தற்போது ₹${Math.round(existingMonthlyEmi).toLocaleString('en-IN')} + புதிய கடன் ₹${newLoanEmi.toLocaleString('en-IN')}) உங்கள் மாதாந்திர வருவாயில் ${foirRatio}% மட்டுமே — இது மிகவும் பாதுகாப்பானது.`,
      });
    } else if (foirRatio <= 65) {
      score += 5;
      factors.push({
        factor: 'Moderate Debt Service Load (FOIR)',
        factorTamil: 'நடுத்தர கடன் சுமை (FOIR)',
        impact: 'neutral',
        weight: 5,
        explanation: `Your combined monthly debt obligations equal ${foirRatio}% of monthly income. Banks prefer below 50%; lenders may request a guarantor or offer a longer repayment tenure to reduce monthly installments.`,
        explanationTamil: `ஒருங்கிணைந்த மாதாந்திர கடன் கடமைகள் வருவாயில் ${foirRatio}% ஆகும். வங்கிகள் 50%க்கு கீழ் விரும்புகின்றன; மாத தவணையை குறைக்க உத்தரவாததாரர் அல்லது நீண்ட கால ஒப்பந்தம் கேட்கலாம்.`,
      });
    } else {
      score -= 25;
      factors.push({
        factor: 'High Debt-to-Income Obligation (FOIR)',
        factorTamil: 'அதிக கடன் சுமை விகிதம் (FOIR)',
        impact: 'negative',
        weight: -25,
        explanation: `Total monthly obligations (₹${Math.round(totalMonthlyDebtService).toLocaleString('en-IN')}/month) equal ${foirRatio}% of reported monthly income. Most banks cap FOIR at 50–65%; exceeding this indicates repayment strain under standard underwriting guidelines.`,
        explanationTamil: `மொத்த மாதாந்திர கடமைகள் (₹${Math.round(totalMonthlyDebtService).toLocaleString('en-IN')}/மாதம்) வருவாயில் ${foirRatio}% ஆகும். பெரும்பாலான வங்கிகள் FOIR-ஐ 50–65%க்குள் வரம்பிடுகின்றன.`,
      });
    }
  }

  // 2. Product-Specific Criteria Checks (Issue 32)
  const normalizedLoanType = (loanType || '').toLowerCase();

  if (normalizedLoanType.includes('kisan') || normalizedLoanType.includes('kcc')) {
    // KCC requires land or documented tenancy + cultivable area
    if (landSize > 0) {
      score += 15;
      factors.push({
        factor: 'KCC Land Cultivation Eligibility',
        factorTamil: 'KCC விவசாய நில தகுதி',
        impact: 'positive',
        weight: 15,
        explanation: `You hold ${landSize} acres of cultivable land with ${profile.land_ownership || 'valid'} tenure, satisfying primary KCC guidelines.`,
        explanationTamil: `நீங்கள் ${landSize} ஏக்கர் விவசாய நிலம் வைத்துள்ளீர்கள், இது KCC திட்ட வழிகாட்டுதல்களை பூர்த்தி செய்கிறது.`,
      });
    } else {
      score -= 30;
      factors.push({
        factor: 'Cultivable Land Requirement',
        factorTamil: 'விவசாய நில தேவை',
        impact: 'negative',
        weight: -30,
        explanation: 'Kisan Credit Card requires cultivable agricultural land documents (Patta/Chitta or registered lease).',
        explanationTamil: 'கிசான் கிரெடிட் கார்டுக்கு விவசாய நில ஆவணங்கள் (பட்டா/சிட்டா அல்லது பதிவு செய்யப்பட்ட குத்தகை) தேவை.',
      });
    }
  } else if (normalizedLoanType.includes('tractor') || normalizedLoanType.includes('machinery')) {
    // Tractor / Heavy machinery requires viable land size (>= 2.5 acres) or strong other income
    if (landSize >= 2.5 || (profile.other_income || 0) >= 150000) {
      score += 15;
      factors.push({
        factor: 'Farm Machinery Viability',
        factorTamil: 'பண்ணை இயந்திர சாத்தியக்கூறு',
        impact: 'positive',
        weight: 15,
        explanation: 'Your landholding or allied commercial income satisfies heavy machinery loan feasibility.',
        explanationTamil: 'உங்கள் நில அளவு அல்லது வணிக வருவாய் இயந்திர கடன் சாத்தியக்கூறை பூர்த்தி செய்கிறது.',
      });
    } else {
      score -= 15;
      factors.push({
        factor: 'Landholding for Mechanization',
        factorTamil: 'இயந்திரமயமாக்கலுக்கான நில அளவு',
        impact: 'negative',
        weight: -15,
        explanation: 'Banks typically look for minimum 2.5 acres or custom-hiring revenue for tractor financing.',
        explanationTamil: 'டிராக்டர் கடனுக்கு வங்கிகள் பொதுவாக குறைந்தபட்சம் 2.5 ஏக்கர் அல்லது வாடகை வருவாயை எதிர்பார்க்கின்றன.',
      });
    }
  } else if (normalizedLoanType.includes('dairy') || normalizedLoanType.includes('livestock')) {
    const hasLivestock = (profile.livestock_list && profile.livestock_list.length > 0) || (profile.livestock_type && profile.livestock_type.length > 0);
    if (hasLivestock) {
      score += 15;
      factors.push({
        factor: 'Livestock Enterprise Experience',
        factorTamil: 'கால்நடை வளர்ப்பு அனுபவம்',
        impact: 'positive',
        weight: 15,
        explanation: 'Existing livestock holding demonstrates operational experience for dairy loan approval.',
        explanationTamil: 'தற்போதுள்ள கால்நடைகள் பால் பண்ணை கடனுக்கான செயல்பாட்டு அனுபவத்தை நிரூபிக்கின்றன.',
      });
    } else {
      factors.push({
        factor: 'Livestock Training / Shed Setup',
        factorTamil: 'கால்நடை பயிற்சி / கொட்டகை அமைப்பு',
        impact: 'neutral',
        weight: 0,
        explanation: 'New dairy entrants may need to submit a project report on animal procurement and shed infrastructure.',
        explanationTamil: 'புதிய பால் பண்ணையாளர்களுக்கு கொட்டகை மற்றும் கால்நடை கொள்முதல் பற்றிய திட்ட அறிக்கை தேவைப்படலாம்.',
      });
    }
  }

  // 3. Credit Score Evaluation (Issue 16, 17)
  if (profile.credit_score_unknown || creditScore === 0) {
    factors.push({
      factor: 'Credit Bureau Score',
      factorTamil: 'கடன் மதிப்பீட்டு அறிக்கை',
      impact: 'neutral',
      weight: 0,
      explanation: 'No credit score recorded. Banks will perform bureau verification or rely on land collateral & income proof.',
      explanationTamil: 'கடன் மதிப்பெண் குறிப்பிடப்படவில்லை. வங்கிகள் நில ஆவணங்கள் மற்றும் வருவாய் ஆதாரத்தை நம்பலாம்.',
    });
  } else if (creditScore >= 750) {
    score += 15;
    factors.push({
      factor: 'Credit Bureau Score',
      factorTamil: 'கடன் மதிப்பீட்டு அறிக்கை',
      impact: 'positive',
      weight: 15,
      explanation: `Excellent credit bureau score (${creditScore}) qualifies for competitive interest rates and faster sanction.`,
      explanationTamil: `சிறந்த கடன் மதிப்பெண் (${creditScore}) குறைந்த வட்டி விகிதம் மற்றும் விரைவான ஒப்புதலுக்கு உதவுகிறது.`,
    });
  } else if (creditScore >= 650) {
    score += 5;
    factors.push({
      factor: 'Credit Bureau Score',
      factorTamil: 'கடன் மதிப்பீட்டு அறிக்கை',
      impact: 'neutral',
      weight: 5,
      explanation: `Acceptable credit bureau score (${creditScore}). Meeting other criteria will strengthen the application.`,
      explanationTamil: `ஏற்கத்தக்க கடன் மதிப்பெண் (${creditScore}). மற்ற தகுதிகள் சரியாக இருந்தால் ஒப்புதல் பெறலாம்.`,
    });
  } else {
    score -= 20;
    factors.push({
      factor: 'Sub-prime Credit Score',
      factorTamil: 'குறைந்த கடன் மதிப்பெண்',
      impact: 'negative',
      weight: -20,
      explanation: `Credit score (${creditScore}) is below standard lending cutoffs (650+), which may necessitate security or co-borrower.`,
      explanationTamil: `கடன் மதிப்பெண் (${creditScore}) வழக்கமான வங்கி வரம்பிற்கு கீழே உள்ளது. கூடுதல் பிணை தேவைப்படலாம்.`,
    });
  }

  // 4. Repayment History (Issue 18)
  if (repaymentHistory === 'always_on_time' || repaymentHistory === 'good') {
    score += 10;
    factors.push({
      factor: 'Past Repayment Track Record',
      factorTamil: 'முந்தைய திருப்பிச் செலுத்தும் வரலாறு',
      impact: 'positive',
      weight: 10,
      explanation: 'Flawless track record of on-time loan repayments builds strong creditworthiness.',
      explanationTamil: 'சரியான நேரத்தில் செலுத்திய முன் வரலாறு வலுவான நம்பகத்தன்மையை உருவாக்குகிறது.',
    });
  } else if (repaymentHistory === 'mostly_on_time' || repaymentHistory === 'average') {
    factors.push({
      factor: 'Past Repayment Track Record',
      factorTamil: 'முந்தைய திருப்பிச் செலுத்தும் வரலாறு',
      impact: 'neutral',
      weight: 0,
      explanation: 'Minor past delays are acceptable if currently regularized.',
      explanationTamil: 'கடந்த கால சிறிய தாமதங்கள் தற்போது சீராக இருந்தால் ஏற்றுக்கொள்ளப்படும்.',
    });
  } else if (repaymentHistory === 'currently_overdue' || repaymentHistory === 'previous_default' || repaymentHistory === 'poor') {
    score -= 25;
    factors.push({
      factor: 'Overdue / Default History',
      factorTamil: 'நிலுவை / தவணை தவறிய வரலாறு',
      impact: 'negative',
      weight: -25,
      explanation: 'Active overdue accounts or past defaults heavily restrict fresh bank lending.',
      explanationTamil: 'தற்போதைய நிலுவைகள் அல்லது தவணை தவறிய பதிவுகள் புதிய கடன் பெறுவதை கணிசமாக பாதிக்கின்றன.',
    });
  } else {
    // No previous loan / Don't know
    factors.push({
      factor: 'First-time Borrower',
      factorTamil: 'முதல் முறை கடன் பெறுபவர்',
      impact: 'neutral',
      weight: 0,
      explanation: 'No past credit track record. Agricultural land and asset value will serve as primary underwriting criteria.',
      explanationTamil: 'முந்தைய கடன் வரலாறு இல்லை. விவசாய நிலம் மற்றும் சொத்து மதிப்பு முக்கிய காரணியாக இருக்கும்.',
    });
  }

  // 5. Age Criteria
  if (age >= 21 && age <= 60) {
    score += 5;
  } else if (age > 60) {
    factors.push({
      factor: 'Applicant Age',
      factorTamil: 'விண்ணப்பதாரர் வயது',
      impact: 'neutral',
      weight: 0,
      explanation: 'Senior applicants may require a legal heir or co-borrower for loan tenures exceeding 5 years.',
      explanationTamil: 'மூத்த விவசாயிகளுக்கு 5 ஆண்டுகளுக்கு மேற்பட்ட கடன்களுக்கு வாரிசுதாரர் அல்லது இணை விண்ணப்பதாரர் தேவைப்படலாம்.',
    });
  }

  // Clamp final score 0 to 100
  score = Math.max(5, Math.min(100, score));

  let eligibilityStatus: string;
  let riskLevel: string;

  // Issue 33: "Likely Eligible" / "Potentially Eligible" rather than guaranteed approval
  if (score >= 75) {
    eligibilityStatus = 'likely_eligible';
    riskLevel = 'low_risk';
  } else if (score >= 48) {
    eligibilityStatus = 'potentially_eligible';
    riskLevel = 'medium_risk';
  } else {
    eligibilityStatus = 'check_criteria';
    riskLevel = 'high_risk';
  }

  const recommendations: string[] = [];
  recommendations.push(
    `Estimated Monthly Installment (EMI): ₹${newLoanEmi.toLocaleString('en-IN')} — calculated at ${interestRate}% p.a. over ${tenureMonths} months using the standard bank formula. This is a preliminary estimate only.`
  );
  if (!incomeKnown) {
    recommendations.push('Please add your annual agricultural and other income in your profile to receive a more complete FOIR-based eligibility assessment.');
  }
  if (profile.existing_loans && profile.existing_loans > 0 && !profile.existing_monthly_emi) {
    recommendations.push('Please specify your current monthly EMI amount in your financial profile to improve assessment accuracy.');
  }
  if (!profile.has_kcc && normalizedLoanType.includes('kcc')) {
    recommendations.push('Apply through your primary savings bank branch where agricultural land records (Patta/Chitta) are registered.');
  }
  recommendations.push(
    '⚠️ Disclaimer: MonitorX provides a preliminary rule-based risk assessment to help farmers understand eligibility. This is NOT an official CIBIL/credit score, NOT a bank approval, and NOT a guarantee of any loan terms. Final eligibility, interest rate, loan amount, and approval are solely determined by the respective bank or lender as per RBI guidelines.'
  );

  return {
    loan_type: loanType,
    requested_amount: requestedAmount,
    eligibility_status: eligibilityStatus,
    risk_level: riskLevel,
    eligibility_score: score,
    factors,
    recommendations,
  };
}

// Issue 33: Accurate Government Scheme Matching with consistent land units
export function matchSchemes(profile: FarmerProfile, schemes: GovernmentScheme[]): SchemeMatch[] {
  const matches: SchemeMatch[] = [];

  for (const scheme of schemes) {
    const criteria = scheme.matchCriteria;
    if (!criteria) {
      matches.push({
        scheme,
        matchScore: 60,
        matchReasons: ['Universal scheme: Available to all agricultural landholders.'],
        matchReasonsTamil: ['அனைத்து விவசாய நில உரிமையாளர்களுக்கும் கிடைக்கும் பொதுவான திட்டம்.'],
        eligibilityLevel: 'likely_eligible',
      });
      continue;
    }

    let score = 50;
    const reasons: string[] = [];
    const reasonsTamil: string[] = [];
    let isDisqualified = false;

    // 1. Mandatory State Match (Strict Enforcement)
    if (criteria.states && criteria.states.length > 0) {
      const farmerState = (profile.state || 'Tamil Nadu').toLowerCase().trim();
      const stateMatch = criteria.states.some((s) => s.toLowerCase().trim() === farmerState);
      if (stateMatch) {
        score += 20;
        reasons.push(`State Eligibility: Scheme operates in ${profile.state || 'Tamil Nadu'}.`);
        reasonsTamil.push(`மாநில தகுதி: இந்த திட்டம் ${profile.state || 'தமிழ்நாடு'} மாநிலத்தில் செயல்படுகிறது.`);
      } else {
        // Disqualify immediately if state mismatch for state-specific scheme
        isDisqualified = true;
      }
    }

    if (isDisqualified) continue;

    // 2. Consistent Land Size Matching: Convert Hectares to Acres (1 ha = 2.471 acres)
    const farmerAcres = profile.land_size_acres || 0;

    if (criteria.maxLandSize !== undefined) {
      // Standardize scheme limit to acres
      // Schemes often define criteria in hectares: if maxLandSize <= 5, it's typically hectares
      const maxLimitAcres = criteria.maxLandSize <= 10 ? criteria.maxLandSize * 2.471 : criteria.maxLandSize;

      if (farmerAcres <= maxLimitAcres) {
        score += 15;
        reasons.push(`Landholding within ceiling: Your ${farmerAcres} acres complies with scheme limit (~${Math.round(maxLimitAcres)} acres).`);
        reasonsTamil.push(`நில அளவு வரம்பிற்குள் உள்ளது: உங்கள் ${farmerAcres} ஏக்கர் திட்ட வரம்பிற்குள் (~${Math.round(maxLimitAcres)} ஏக்கர்) உள்ளது.`);
      } else {
        score -= 25;
      }
    }

    if (criteria.minLandSize !== undefined) {
      const minLimitAcres = criteria.minLandSize <= 5 ? criteria.minLandSize * 2.471 : criteria.minLandSize;
      if (farmerAcres >= minLimitAcres) {
        score += 10;
        reasons.push(`Meets minimum landholding requirement of ${minLimitAcres.toFixed(1)} acres.`);
        reasonsTamil.push(`குறைந்தபட்ச நில தேவையை (${minLimitAcres.toFixed(1)} ஏக்கர்) பூர்த்தி செய்கிறது.`);
      } else {
        score -= 20;
      }
    }

    // 3. Farmer Category Match
    if (criteria.farmerCategories && criteria.farmerCategories.length > 0) {
      if (criteria.farmerCategories.includes(profile.farmer_category)) {
        score += 15;
        reasons.push(`Target Beneficiary: Applicable for ${profile.farmer_category} farmers.`);
        reasonsTamil.push(`இலக்கு பயனாளி: ${profile.farmer_category} விவசாயிகளுக்கு பொருந்தும்.`);
      }
    }

    // 4. Irrigation Source Match
    if (criteria.irrigationRequired) {
      const hasIrrigation = profile.irrigation_available ||
        (profile.irrigation_sources && profile.irrigation_sources.some((s) => s !== 'Rain-fed'));
      if (hasIrrigation) {
        score += 10;
        reasons.push('Irrigation infrastructure is present, satisfying scheme prerequisites.');
        reasonsTamil.push('நீர்ப்பாசன வசதி உள்ளது, இது திட்டத்தின் முன்நிபந்தனையை பூர்த்தி செய்கிறது.');
      } else {
        score -= 15;
      }
    }

    // 5. Crop Match (Checks both single crop and array)
    if (criteria.crops && criteria.crops.length > 0) {
      const farmerCrops = [
        ...(profile.crops || []),
        ...(profile.crop_type ? [profile.crop_type] : []),
      ].map((c) => c.toLowerCase());

      const matchesCrop = criteria.crops.some((c) =>
        farmerCrops.some((fc) => fc.includes(c.toLowerCase()) || c.toLowerCase().includes(fc))
      );

      if (matchesCrop) {
        score += 15;
        reasons.push('Your cultivated crop is covered under scheme subsidies.');
        reasonsTamil.push('நீங்கள் பயிரிடும் பயிர் இந்த திட்ட மானியத்தின் கீழ் வருகிறது.');
      }
    }

    score = Math.max(10, Math.min(100, score));

    let eligibilityLevel: 'likely_eligible' | 'potentially_eligible' | 'check_criteria' = 'check_criteria';
    if (score >= 75) {
      eligibilityLevel = 'likely_eligible';
    } else if (score >= 45) {
      eligibilityLevel = 'potentially_eligible';
    }

    if (score >= 40) {
      matches.push({
        scheme,
        matchScore: score,
        matchReasons: reasons.length > 0 ? reasons : ['General criteria matching for verified farmers.'],
        matchReasonsTamil: reasonsTamil.length > 0 ? reasonsTamil : ['சரிபார்க்கப்பட்ட விவசாயிகளுக்கான பொதுவான தகுதி.'],
        eligibilityLevel,
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
}
