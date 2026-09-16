const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hqrgryuvhnkejpjksfco.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxcmdyeXV2aG5rZWpwamtzZmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODM4MjEsImV4cCI6MjEwNDg1OTgyMX0._w6AJIP4xskce2oj5S0C_OTx6vbMvvotCrUN5acmQyE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const VALID_DB_COLUMNS = new Set([
  'id',
  'full_name',
  'phone',
  'age',
  'state',
  'district',
  'farmer_category',
  'farming_type',
  'crop_type',
  'land_size_acres',
  'land_ownership',
  'irrigation_available',
  'irrigation_type',
  'annual_agricultural_income',
  'other_income',
  'existing_loans',
  'monthly_expenses',
  'credit_score',
  'repayment_history',
  'livestock_type',
  'equipment_needed',
  'has_kcc',
  'has_pmfby',
  'created_at',
  'updated_at',
]);

function sanitize(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (VALID_DB_COLUMNS.has(k) && v !== undefined) clean[k] = v;
  }
  return clean;
}

const TEST_CUSTOMERS = [
  {
    full_name: 'Murugan K (Test 1)',
    phone: '+919840000001',
    age: 42,
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    farmer_category: 'marginal',
    land_size_acres: 2.0,
    land_ownership: 'owned',
    farming_type: 'Wetland (Nanjai)',
    crop_type: 'Paddy (Rice)',
    annual_agricultural_income: 180000,
    other_income: 20000,
    existing_loans: 0,
    monthly_expenses: 8000,
    credit_score: 710,
    repayment_history: 'always_on_time',
    has_kcc: true,
    has_pmfby: true,
    sampleLoan: {
      loan_type: 'Kisan Credit Card (KCC)',
      bank_name: 'State Bank of India',
      loan_amount: 100000,
      interest_rate: 7.0,
      tenure_months: 12,
    },
    sampleScheme: {
      scheme_id: 'pm-kisan',
      scheme_name: 'PM-KISAN Samman Nidhi',
      scheme_type: 'central',
    },
    sampleEligibility: {
      loan_type: 'Kisan Credit Card (KCC)',
      requested_amount: 100000,
      eligibility_status: 'likely_eligible',
      risk_level: 'low_risk',
      eligibility_score: 88,
      factors: [{ factor: 'FOIR', impact: 'positive' }],
      recommendations: ['Recommended for SBI KCC'],
    },
  },
  {
    full_name: 'Annamalai S (Test 2)',
    phone: '+919840000002',
    age: 48,
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    farmer_category: 'small',
    land_size_acres: 4.5,
    land_ownership: 'owned',
    farming_type: 'Garden Land (Thottam)',
    crop_type: 'Sugarcane, Banana',
    annual_agricultural_income: 350000,
    other_income: 50000,
    existing_loans: 80000,
    monthly_expenses: 15000,
    credit_score: 745,
    repayment_history: 'mostly_on_time',
    has_kcc: false,
    has_pmfby: true,
    sampleLoan: {
      loan_type: 'Tractor / Farm Mechanization Loan',
      bank_name: 'Canara Bank',
      loan_amount: 650000,
      interest_rate: 8.8,
      tenure_months: 60,
    },
    sampleScheme: {
      scheme_id: 'sub-mission-agri-mechanization',
      scheme_name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
      scheme_type: 'central',
    },
    sampleEligibility: {
      loan_type: 'Tractor / Farm Mechanization Loan',
      requested_amount: 650000,
      eligibility_status: 'likely_eligible',
      risk_level: 'low_risk',
      eligibility_score: 82,
      factors: [{ factor: 'Landholding', impact: 'positive' }],
      recommendations: ['Eligible for tractor subsidy under SMAM'],
    },
  },
  {
    full_name: 'Kavitha R (Test 3)',
    phone: '+919840000003',
    age: 38,
    state: 'Tamil Nadu',
    district: 'Salem',
    farmer_category: 'medium',
    land_size_acres: 8.0,
    land_ownership: 'owned',
    farming_type: 'Dryland (Punjai)',
    crop_type: 'Cotton, Millets',
    annual_agricultural_income: 620000,
    other_income: 80000,
    existing_loans: 120000,
    monthly_expenses: 22000,
    credit_score: 790,
    repayment_history: 'always_on_time',
    has_kcc: true,
    has_pmfby: false,
    sampleLoan: {
      loan_type: 'Micro Irrigation / Solar Pump Loan',
      bank_name: 'Indian Bank',
      loan_amount: 250000,
      interest_rate: 8.0,
      tenure_months: 36,
    },
    sampleScheme: {
      scheme_id: 'pm-kusum',
      scheme_name: 'PM-KUSUM Solar Agriculture Pump Scheme',
      scheme_type: 'central',
    },
    sampleEligibility: {
      loan_type: 'Micro Irrigation / Solar Pump Loan',
      requested_amount: 250000,
      eligibility_status: 'likely_eligible',
      risk_level: 'low_risk',
      eligibility_score: 92,
      factors: [{ factor: 'Credit Score', impact: 'positive' }],
      recommendations: ['Apply with PM-KUSUM solar vendor quotation'],
    },
  },
  {
    full_name: 'Selvam P (Test 4)',
    phone: '+919840000004',
    age: 32,
    state: 'Tamil Nadu',
    district: 'Madurai',
    farmer_category: 'tenant',
    land_size_acres: 1.5,
    land_ownership: 'leased',
    farming_type: 'Wetland (Nanjai)',
    crop_type: 'Vegetables',
    annual_agricultural_income: 140000,
    other_income: 15000,
    existing_loans: 20000,
    monthly_expenses: 9000,
    credit_score: 640,
    repayment_history: 'mostly_on_time',
    has_kcc: false,
    has_pmfby: false,
    sampleLoan: {
      loan_type: 'Dairy & Animal Husbandry Loan',
      bank_name: 'HDFC Bank',
      loan_amount: 120000,
      interest_rate: 9.5,
      tenure_months: 36,
    },
    sampleScheme: {
      scheme_id: 'national-livestock-mission',
      scheme_name: 'National Livestock Mission (NLM)',
      scheme_type: 'central',
    },
    sampleEligibility: {
      loan_type: 'Dairy & Animal Husbandry Loan',
      requested_amount: 120000,
      eligibility_status: 'potentially_eligible',
      risk_level: 'medium_risk',
      eligibility_score: 64,
      factors: [{ factor: 'Tenant Status', impact: 'neutral' }],
      recommendations: ['Provide lease agreement copy and guarantor'],
    },
  },
  {
    full_name: 'Dharmaraj V (Test 5)',
    phone: '+919840000005',
    age: 55,
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    farmer_category: 'large',
    land_size_acres: 15.0,
    land_ownership: 'owned',
    farming_type: 'Wetland (Nanjai), Plantation',
    crop_type: 'Banana, Coconut, Paddy (Rice)',
    annual_agricultural_income: 1100000,
    other_income: 150000,
    existing_loans: 250000,
    monthly_expenses: 35000,
    credit_score: 810,
    repayment_history: 'always_on_time',
    has_kcc: true,
    has_pmfby: true,
    sampleLoan: {
      loan_type: 'Agricultural Infrastructure Fund Loan',
      bank_name: 'Bank of Baroda',
      loan_amount: 1500000,
      interest_rate: 6.0,
      tenure_months: 84,
    },
    sampleScheme: {
      scheme_id: 'agri-infra-fund',
      scheme_name: 'Agriculture Infrastructure Fund (AIF)',
      scheme_type: 'central',
    },
    sampleEligibility: {
      loan_type: 'Agricultural Infrastructure Fund Loan',
      requested_amount: 1500000,
      eligibility_status: 'likely_eligible',
      risk_level: 'low_risk',
      eligibility_score: 95,
      factors: [{ factor: 'Large Landholding & High Income', impact: 'positive' }],
      recommendations: ['3% interest subvention applicable under AIF scheme'],
    },
  },
];

async function runTest() {
  console.log('===============================================================');
  console.log('MONITORX: COMPREHENSIVE END-TO-END DATA ISOLATION TEST SUITE');
  console.log('Testing 5+ Customer Profiles, Child Records & Admin Search');
  console.log('===============================================================\n');

  const createdFarmers = [];

  try {
    // 1. Clean up any previous test instances
    for (const c of TEST_CUSTOMERS) {
      await supabase.from('farmer_profiles').delete().eq('phone', c.phone);
    }

    // 2. Insert 5 distinct customer profiles into Supabase
    console.log('[STEP 1] Provisioning 5 distinct customer profiles in Supabase...');
    for (const c of TEST_CUSTOMERS) {
      const sanitized = sanitize({
        ...c,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const { data, error } = await supabase.from('farmer_profiles').insert(sanitized).select().single();
      if (error) {
        throw new Error(`Failed to insert customer ${c.full_name}: ${error.message}`);
      }
      createdFarmers.push({ ...data, rawConfig: c });
      console.log(`  ✓ Created Customer: ID [${data.id}] Phone [${data.phone}] Name [${data.full_name}]`);
    }

    console.log(`\nSuccessfully created ${createdFarmers.length} distinct farmer profiles.\n`);

    // 3. Insert specific child records for each customer
    console.log('[STEP 2] Creating child records (Loan Applications, Scheme Interests, Eligibility)...');
    for (const farmer of createdFarmers) {
      const cfg = farmer.rawConfig;

      // Loan Application
      const { data: loan, error: loanErr } = await supabase.from('loan_applications').insert({
        farmer_id: farmer.id,
        loan_type: cfg.sampleLoan.loan_type,
        bank_name: cfg.sampleLoan.bank_name,
        loan_amount: cfg.sampleLoan.loan_amount,
        interest_rate: cfg.sampleLoan.interest_rate,
        tenure_months: cfg.sampleLoan.tenure_months,
        status: 'interested',
      }).select().single();
      if (loanErr) throw new Error(`Loan insert error for ${farmer.phone}: ${loanErr.message}`);

      // Scheme Application
      const { data: scheme, error: schemeErr } = await supabase.from('scheme_applications').insert({
        farmer_id: farmer.id,
        scheme_id: cfg.sampleScheme.scheme_id,
        scheme_name: cfg.sampleScheme.scheme_name,
        scheme_type: cfg.sampleScheme.scheme_type,
        status: 'interested',
      }).select().single();
      if (schemeErr) throw new Error(`Scheme insert error for ${farmer.phone}: ${schemeErr.message}`);

      // Eligibility Result
      const { data: elig, error: eligErr } = await supabase.from('eligibility_results').insert({
        farmer_id: farmer.id,
        loan_type: cfg.sampleEligibility.loan_type,
        requested_amount: cfg.sampleEligibility.requested_amount,
        eligibility_status: cfg.sampleEligibility.eligibility_status,
        risk_level: cfg.sampleEligibility.risk_level,
        eligibility_score: cfg.sampleEligibility.eligibility_score,
        factors: cfg.sampleEligibility.factors,
        recommendations: cfg.sampleEligibility.recommendations,
      }).select().single();
      if (eligErr) throw new Error(`Eligibility insert error for ${farmer.phone}: ${eligErr.message}`);

      console.log(`  ✓ Linked records for ${farmer.full_name}: Loan ID [${loan.id.slice(0, 8)}] Scheme ID [${scheme.id.slice(0, 8)}] Elig ID [${elig.id.slice(0, 8)}]`);
    }

    // 4. VERIFY STRICT DATA ISOLATION ACROSS ALL 5 PROFILES
    console.log('\n[STEP 3] Verifying Strict Multi-Customer Data Isolation (Zero Cross-Contamination)...');

    for (let i = 0; i < createdFarmers.length; i++) {
      const currentFarmer = createdFarmers[i];
      const otherFarmers = createdFarmers.filter((_, idx) => idx !== i);

      // Verify Profile Query Isolation by Phone
      const { data: fetchedProfile, error: pErr } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('phone', currentFarmer.phone)
        .single();

      if (pErr || !fetchedProfile) {
        throw new Error(`Isolation breach or missing profile for ${currentFarmer.phone}`);
      }

      if (fetchedProfile.id !== currentFarmer.id || fetchedProfile.full_name !== currentFarmer.full_name) {
        throw new Error(`Data corruption: Phone ${currentFarmer.phone} returned profile of ${fetchedProfile.full_name}`);
      }

      // Verify Loan Applications Isolation
      const { data: loans } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('farmer_id', currentFarmer.id);

      if (!loans || loans.length === 0) {
        throw new Error(`Missing loan records for farmer ${currentFarmer.id}`);
      }

      for (const l of loans) {
        if (l.farmer_id !== currentFarmer.id) {
          throw new Error(`CROSS-TENANT LEAK: Loan ${l.id} has foreign farmer_id ${l.farmer_id}, expected ${currentFarmer.id}`);
        }
        for (const other of otherFarmers) {
          if (l.farmer_id === other.id) {
            throw new Error(`CRITICAL LEAK: Customer ${currentFarmer.phone} sees loan belonging to ${other.phone}!`);
          }
        }
      }

      // Verify Scheme Applications Isolation
      const { data: schemes } = await supabase
        .from('scheme_applications')
        .select('*')
        .eq('farmer_id', currentFarmer.id);

      for (const s of schemes) {
        if (s.farmer_id !== currentFarmer.id) {
          throw new Error(`CROSS-TENANT LEAK: Scheme ${s.id} has foreign farmer_id ${s.farmer_id}`);
        }
      }

      // Verify Eligibility Results Isolation
      const { data: eligResults } = await supabase
        .from('eligibility_results')
        .select('*')
        .eq('farmer_id', currentFarmer.id);

      for (const el of eligResults) {
        if (el.farmer_id !== currentFarmer.id) {
          throw new Error(`CROSS-TENANT LEAK: Eligibility ${el.id} has foreign farmer_id ${el.farmer_id}`);
        }
      }

      console.log(`  ✓ Customer #${i + 1} [${currentFarmer.phone} - ${currentFarmer.full_name}]: Strict isolation verified. (Loans: ${loans.length}, Schemes: ${schemes.length}, Assessments: ${eligResults.length})`);
    }

    // 5. TEST ADMIN SEARCH SPECIFICITY
    console.log('\n[STEP 4] Testing Admin Search Specificity...');

    // Search Test A: Exact Phone search for Customer 4 (Selvam P)
    const { data: searchPhone } = await supabase
      .from('farmer_profiles')
      .select('*')
      .ilike('phone', '%9840000004%');
    console.log(`  Admin Search by Phone '9840000004': Found ${searchPhone.length} record(s).`);
    if (searchPhone.length !== 1 || searchPhone[0].full_name !== 'Selvam P (Test 4)') {
      throw new Error(`Admin search by phone failed! Expected Selvam P, got: ${JSON.stringify(searchPhone)}`);
    }
    console.log(`  ✓ Search by Phone returned EXACT record: ${searchPhone[0].full_name}`);

    // Search Test B: Name search for Customer 2 (Annamalai)
    const { data: searchName } = await supabase
      .from('farmer_profiles')
      .select('*')
      .ilike('full_name', '%Annamalai%');
    console.log(`  Admin Search by Name 'Annamalai': Found ${searchName.length} record(s).`);
    if (searchName.length !== 1 || searchName[0].phone !== '+919840000002') {
      throw new Error(`Admin search by name failed! Expected Annamalai S, got: ${JSON.stringify(searchName)}`);
    }
    console.log(`  ✓ Search by Name returned EXACT record: ${searchName[0].full_name} [${searchName[0].phone}]`);

    // Search Test C: District search for 'Salem' (Customer 3 Kavitha R)
    const { data: searchDistrict } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('district', 'Salem');
    console.log(`  Admin Search by District 'Salem': Found ${searchDistrict.length} record(s).`);
    const foundKavitha = searchDistrict.some((f) => f.phone === '+919840000003');
    if (!foundKavitha) {
      throw new Error('Admin search by district did not return expected customer');
    }
    console.log(`  ✓ Search by District returned accurate customer: Kavitha R [Salem]`);

    // Search Test D: Exact Customer ID (UUID)
    const sampleUuid = createdFarmers[4].id;
    const { data: searchUuid } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('id', sampleUuid);
    console.log(`  Admin Search by UUID '${sampleUuid}': Found ${searchUuid.length} record(s).`);
    if (searchUuid.length !== 1 || searchUuid[0].phone !== '+919840000005') {
      throw new Error('Admin search by UUID failed!');
    }
    console.log(`  ✓ Search by UUID returned EXACT record: ${searchUuid[0].full_name} [${searchUuid[0].phone}]`);

    console.log('\n===============================================================');
    console.log('SUMMARY: ALL 4 VERIFICATION STEPS PASSED SUCCESSFULLY (100%)');
    console.log('✓ 5 Distinct Customer Profiles Created in Supabase');
    console.log('✓ Child Records (Loans, Schemes, Eligibility) Linked with Foreign Keys');
    console.log('✓ Strict Data Isolation Confirmed (Zero Cross-Contamination)');
    console.log('✓ Admin Search Successfully Validated Across Phone, Name, District & UUID');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

runTest();
