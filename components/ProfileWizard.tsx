import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Sprout,
  Coins,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';
import { useLanguage } from '@/lib/i18n';
import { useProfile } from '@/lib/profile-context';
import { useAuth } from '@/lib/auth-context';
import { FarmerProfile } from '@/lib/supabase';
import { Colors } from '@/lib/theme';

import { LanguageToggle } from './LanguageToggle';

export const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

export const STATES_LIST = [
  'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra'
];

export const POPULAR_CROPS = [
  'Paddy (Rice)', 'Sugarcane', 'Cotton', 'Banana', 'Groundnut',
  'Maize', 'Turmeric', 'Millets', 'Vegetables', 'Pulses',
  'Coconut', 'Mango', 'Chilli', 'Tapioca'
];

export const FARMING_TYPES_LIST = [
  'Wetland (Nanjai)', 'Dryland (Punjai)', 'Garden Land (Thottam)',
  'Plantation', 'Organic Farming', 'Commercial/Horticulture'
];

export const IRRIGATION_SOURCES_LIST = [
  'Borewell', 'Canal', 'Open Well', 'Drip Irrigation',
  'Sprinkler', 'Rain-fed', 'River / Tank', 'Other'
];

export const LIVESTOCK_LIST = [
  'Dairy Cattle (Cows)', 'Buffaloes', 'Goats / Sheep',
  'Poultry (Broiler / Layer)', 'Country Chicken', 'Fishery / Aquaculture'
];

export const EQUIPMENT_LIST = [
  'Tractor', 'Power Tiller', 'Paddy Transplanter', 'Combined Harvester',
  'Drip Irrigation Kit', 'Solar Water Pump', 'Power Weeder', 'Battery Sprayer'
];

export const FARMER_CATEGORIES = [
  { value: 'marginal', labelEn: 'Marginal (Up to 2.5 acres / 1 ha)', labelTa: 'குறு விவசாயி (2.5 ஏக்கர் வரை)' },
  { value: 'small', labelEn: 'Small (2.5 to 5 acres / 1-2 ha)', labelTa: 'சிறு விவசாயி (2.5 - 5 ஏக்கர்)' },
  { value: 'medium', labelEn: 'Semi-Medium / Medium (5 to 25 acres)', labelTa: 'நடுத்தர விவசாயி (5 - 25 ஏக்கர்)' },
  { value: 'large', labelEn: 'Large (Above 25 acres / 10 ha)', labelTa: 'பெரிய விவசாயி (25 ஏக்கருக்கு மேல்)' },
  { value: 'tenant', labelEn: 'Tenant / Sharecropper Farmer', labelTa: 'குத்தகை / பட்டதார் விவசாயி' },
];

export const REPAYMENT_HISTORY_OPTIONS = [
  { value: 'no_previous_loan', labelKey: 'noPreviousLoan' },
  { value: 'always_on_time', labelKey: 'alwaysOnTime' },
  { value: 'mostly_on_time', labelKey: 'mostlyOnTime' },
  { value: 'delayed_payments', labelKey: 'someDelayedPayments' },
  { value: 'currently_overdue', labelKey: 'currentlyOverdue' },
  { value: 'previous_default', labelKey: 'previousDefault' },
  { value: 'dont_know', labelKey: 'dontKnow' },
];

interface ProfileWizardProps {
  onSuccess?: () => void;
  isOnboarding?: boolean;
  onCancel?: () => void;
  initialStep?: number;
}

export function ProfileWizard({
  onSuccess,
  isOnboarding = false,
  onCancel,
  initialStep = 1,
}: ProfileWizardProps) {
  const { t, language } = useLanguage();
  const { profile, saveProfile } = useProfile();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Coimbatore');
  const [farmerCategory, setFarmerCategory] = useState('small');

  // Step 2: Farm Details
  const [landSizeAcres, setLandSizeAcres] = useState<string>('');
  const [landOwnership, setLandOwnership] = useState('owned');
  const [selectedFarmingTypes, setSelectedFarmingTypes] = useState<string[]>([]);
  const [customFarmingType, setCustomFarmingType] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [customCropInput, setCustomCropInput] = useState('');
  const [selectedIrrigation, setSelectedIrrigation] = useState<string[]>([]);
  const [customIrrigation, setCustomIrrigation] = useState('');
  const [selectedLivestock, setSelectedLivestock] = useState<string[]>([]);
  const [customLivestock, setCustomLivestock] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState('');

  // Step 3: Financial Details
  const [annualAgriIncome, setAnnualAgriIncome] = useState<string>('');
  const [otherIncome, setOtherIncome] = useState<string>('');
  const [existingMonthlyEmi, setExistingMonthlyEmi] = useState<string>('');
  const [existingLoans, setExistingLoans] = useState<string>('');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('');

  // Step 4: Credit Details
  const [creditScore, setCreditScore] = useState<string>('');
  const [creditScoreUnknown, setCreditScoreUnknown] = useState(false);
  const [repaymentHistory, setRepaymentHistory] = useState('');
  const [kccStatus, setKccStatus] = useState<'active' | 'inactive' | 'pending'>('inactive');
  const [pmfbyStatus, setPmfbyStatus] = useState<'covered' | 'not_covered' | 'pending' | 'unknown'>('not_covered');

  // Modals for District & State Pickers
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);

  // Field Refs for Enter Key Navigation
  const phoneRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const otherIncomeRef = useRef<TextInput>(null);
  const existingMonthlyEmiRef = useRef<TextInput>(null);
  const existingLoansRef = useRef<TextInput>(null);
  const monthlyExpensesRef = useRef<TextInput>(null);

  // Load existing profile values
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || user?.phone || '');
      setAge(profile.age ? profile.age.toString() : '');
      setGender(profile.gender || user?.gender || '');
      setState(profile.state || 'Tamil Nadu');
      setDistrict(profile.district || 'Coimbatore');
      setFarmerCategory(profile.farmer_category || 'small');

      setLandSizeAcres(profile.land_size_acres != null ? profile.land_size_acres.toString() : '');
      setLandOwnership(profile.land_ownership || 'owned');
      if (profile.farming_types && profile.farming_types.length > 0) {
        setSelectedFarmingTypes(profile.farming_types);
      } else if (profile.farming_type) {
        setSelectedFarmingTypes([profile.farming_type]);
      }
      if (profile.crops && profile.crops.length > 0) {
        setSelectedCrops(profile.crops);
      } else if (profile.crop_type) {
        setSelectedCrops([profile.crop_type]);
      }
      if (profile.irrigation_sources && profile.irrigation_sources.length > 0) {
        setSelectedIrrigation(profile.irrigation_sources);
      } else if (profile.irrigation_type) {
        setSelectedIrrigation([profile.irrigation_type]);
      }
      if (profile.livestock_list && profile.livestock_list.length > 0) {
        setSelectedLivestock(profile.livestock_list);
      }
      if (profile.equipment_list && profile.equipment_list.length > 0) {
        setSelectedEquipment(profile.equipment_list);
      }

      setAnnualAgriIncome(profile.annual_agricultural_income != null ? profile.annual_agricultural_income.toString() : '');
      setOtherIncome(profile.other_income != null ? profile.other_income.toString() : '');
      setExistingMonthlyEmi(profile.existing_monthly_emi != null ? profile.existing_monthly_emi.toString() : '');
      setExistingLoans(profile.existing_loans != null ? profile.existing_loans.toString() : '');
      setMonthlyExpenses(profile.monthly_expenses != null ? profile.monthly_expenses.toString() : '');

      setCreditScore(profile.credit_score != null ? profile.credit_score.toString() : '');
      setCreditScoreUnknown(!!profile.credit_score_unknown);
      setRepaymentHistory(profile.repayment_history || 'always_on_time');
      setKccStatus(profile.kcc_status || (profile.has_kcc ? 'active' : 'inactive'));
      setPmfbyStatus(profile.pmfby_status || (profile.has_pmfby ? 'covered' : 'not_covered'));
    } else if (user?.phone) {
      setPhone(user.phone);
    }
  }, [profile, user]);

  // Validation
  const validateStep1 = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert(t('error'), language === 'ta' ? 'பெயர் தேவை' : 'Full Name is required');
      return false;
    }
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        Alert.alert(t('error'), language === 'ta' ? 'சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number');
        return false;
      }
    }
    if (age && (parseInt(age, 10) < 18 || parseInt(age, 10) > 90)) {
      Alert.alert(t('error'), language === 'ta' ? 'செல்லுபடியாகும் வயதை உள்ளிடவும் (18-90)' : 'Please enter a realistic age between 18 and 90');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (landSizeAcres && parseFloat(landSizeAcres) < 0) {
      Alert.alert(t('error'), 'Land size cannot be negative');
      return false;
    }
    if (selectedCrops.length === 0) {
      Alert.alert(t('error'), language === 'ta' ? 'குறைந்தது ஒரு பயிரை தேர்ந்தெடுக்கவும்' : 'Please select at least one crop');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (annualAgriIncome && parseFloat(annualAgriIncome) < 0) {
      Alert.alert(t('error'), 'Income cannot be negative');
      return false;
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    if (!creditScoreUnknown && creditScore.trim()) {
      const scoreVal = parseInt(creditScore.trim(), 10);
      if (isNaN(scoreVal) || scoreVal < 300 || scoreVal > 900) {
        Alert.alert(t('error'), t('scoreInvalidRange'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) return;

    setSaving(true);
    const parsedAgriIncome = parseFloat(annualAgriIncome) || 0;
    const parsedOtherIncome = parseFloat(otherIncome) || 0;
    const parsedEmi = parseFloat(existingMonthlyEmi) || 0;
    const parsedExistingLoans = parseFloat(existingLoans) || 0;
    const parsedExpenses = parseFloat(monthlyExpenses) || 0;
    const parsedLand = parseFloat(landSizeAcres) || 0;
    const parsedAge = age ? parseInt(age, 10) : null;
    const parsedCredit = !creditScoreUnknown && creditScore ? parseInt(creditScore, 10) : null;

    const payload: FarmerProfile = {
      full_name: fullName.trim(),
      phone: phone.trim() || user?.phone || '',
      age: parsedAge,
      gender: gender || null,
      state: state || 'Tamil Nadu',
      district: district || 'Coimbatore',
      farmer_category: farmerCategory,

      land_size_acres: parsedLand,
      land_ownership: landOwnership,
      farming_type: selectedFarmingTypes[0] || '',
      farming_types: selectedFarmingTypes,
      crop_type: selectedCrops[0] || '',
      crops: selectedCrops,
      irrigation_available: selectedIrrigation.length > 0 && !selectedIrrigation.includes('Rain-fed'),
      irrigation_type: selectedIrrigation[0] || '',
      irrigation_sources: selectedIrrigation,
      livestock_type: selectedLivestock[0] || '',
      livestock_list: selectedLivestock,
      equipment_needed: selectedEquipment[0] || '',
      equipment_list: selectedEquipment,

      annual_agricultural_income: parsedAgriIncome,
      other_income: parsedOtherIncome,
      existing_monthly_emi: parsedEmi,
      existing_loans: parsedExistingLoans,
      monthly_expenses: parsedExpenses,

      credit_score: parsedCredit,
      credit_score_unknown: creditScoreUnknown,
      repayment_history: repaymentHistory,
      has_kcc: kccStatus === 'active',
      kcc_status: kccStatus,
      has_pmfby: pmfbyStatus === 'covered',
      pmfby_status: pmfbyStatus,
    };

    const result = await saveProfile(payload);
    setSaving(false);

    if (result.success) {
      setSavedSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } else {
      Alert.alert(t('error'), result.error || 'Failed to save profile');
    }
  };

  // Helper multi-select toggles
  const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const filteredDistricts = TN_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Multi-step Header & Progress Bar */}
      <View style={styles.header}>
        <View style={styles.topTitleRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.topModalTitle}>
              {isOnboarding
                ? (language === 'ta' ? 'விவசாயி சுயவிவரம் அமைக்கவும்' : 'Complete Farmer Profile')
                : (language === 'ta' ? 'சுயவிவரத்தைத் திருத்து' : 'Edit Farmer Profile')}
            </Text>
          </View>
          <View style={styles.topHeaderRight}>
            <LanguageToggle />
            {onCancel ? (
              <TouchableOpacity
                onPress={onCancel}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.neutral[600]} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.stepProgressRow}>
          <Text style={styles.stepText}>
            {t('stepIndicator')} {currentStep} {t('of')} 4
          </Text>
          <Text style={styles.stepName}>
            {currentStep === 1 && t('step1Title')}
            {currentStep === 2 && t('step2Title')}
            {currentStep === 3 && t('step3Title')}
            {currentStep === 4 && t('step4Title')}
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>

        {/* Step Indicators */}
        <View style={styles.stepPills}>
          {[1, 2, 3, 4].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.stepPill,
                currentStep === s && styles.stepPillActive,
                currentStep > s && styles.stepPillDone,
              ]}
              onPress={() => s < currentStep && setCurrentStep(s)}
            >
              {currentStep > s ? (
                <Check size={12} color="#fff" />
              ) : (
                <Text style={[styles.stepPillText, currentStep === s && styles.stepPillTextActive]}>
                  {s}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: PERSONAL DETAILS ================= */}
        {currentStep === 1 && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeaderRow}>
              <User size={20} color={Colors.primary[600]} />
              <Text style={styles.sectionTitle}>{t('step1Title')}</Text>
            </View>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('fullName')}</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={language === 'ta' ? 'எ.கா. முத்துக்குமார்' : 'e.g. Muthu Kumar'}
                placeholderTextColor={Colors.neutral[400]}
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={false}
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('phone')}</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>
              <TextInput
                ref={phoneRef}
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="phone-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={false}
                onSubmitEditing={() => ageRef.current?.focus()}
              />
            </View>

            {/* Age */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('age')}</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>
              <TextInput
                ref={ageRef}
                style={styles.input}
                value={age}
                onChangeText={(val) => setAge(val.replace(/\D/g, ''))}
                placeholder="e.g. 45"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={true}
                onSubmitEditing={handleNext}
              />
            </View>

            {/* Gender Selector */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('gender')}</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>
              <View style={styles.genderOptionsRow}>
                {[
                  { id: 'Male', labelEn: 'Male', labelTa: 'ஆண்' },
                  { id: 'Female', labelEn: 'Female', labelTa: 'பெண்' },
                  { id: 'Other', labelEn: 'Other', labelTa: 'மற்றவை' },
                ].map((opt) => {
                  const isSelected = gender === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.genderOptionBtn,
                        isSelected && styles.genderOptionBtnActive,
                      ]}
                      onPress={() => setGender(opt.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          isSelected && styles.genderOptionTextActive,
                        ]}
                      >
                        {language === 'ta' ? opt.labelTa : opt.labelEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* State Picker */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('state')}</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setShowStateModal(true)}
              >
                <Text style={styles.pickerTriggerText}>{state}</Text>
                <ChevronRight size={18} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* District Picker (Searchable TN Districts) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('district')}</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => {
                  setDistrictSearch('');
                  setShowDistrictModal(true);
                }}
              >
                <Text style={styles.pickerTriggerText}>{district}</Text>
                <ChevronRight size={18} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* Farmer Category */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('farmerCategory')}</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <View style={styles.cardList}>
                {FARMER_CATEGORIES.map((cat) => {
                  const selected = farmerCategory === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.selectableCard, selected && styles.selectableCardActive]}
                      onPress={() => setFarmerCategory(cat.value)}
                    >
                      <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                          {language === 'ta' ? cat.labelTa : cat.labelEn}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 2: FARM DETAILS ================= */}
        {currentStep === 2 && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeaderRow}>
              <Sprout size={20} color={Colors.primary[600]} />
              <Text style={styles.sectionTitle}>{t('step2Title')}</Text>
            </View>

            {/* Land Size */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('landSize')} (Acres)</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={landSizeAcres}
                onChangeText={(val) => setLandSizeAcres(val.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 3.5"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="decimal-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={true}
                onSubmitEditing={handleNext}
              />
            </View>

            {/* Land Ownership */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('landOwnership')}</Text>
              <View style={styles.toggleRow}>
                {['owned', 'leased'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.toggleBtn, landOwnership === type && styles.toggleBtnActive]}
                    onPress={() => setLandOwnership(type)}
                  >
                    <Text style={[styles.toggleBtnText, landOwnership === type && styles.toggleBtnTextActive]}>
                      {t(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Farming Types (Multi-select) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('farmingTypesHeader')}</Text>
              <View style={styles.tagGrid}>
                {FARMING_TYPES_LIST.map((type) => {
                  const selected = selectedFarmingTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.tagPill, selected && styles.tagPillActive]}
                      onPress={() => toggleSelection(selectedFarmingTypes, setSelectedFarmingTypes, type)}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Custom Farming Type */}
              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder={language === 'ta' ? 'மற்ற வகை உள்ளிடவும்...' : 'Enter custom farming type...'}
                  placeholderTextColor={Colors.neutral[400]}
                  value={customFarmingType}
                  onChangeText={setCustomFarmingType}
                  returnKeyType="done"
                  enterKeyHint="done"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (customFarmingType.trim()) {
                      setSelectedFarmingTypes([...selectedFarmingTypes, customFarmingType.trim()]);
                      setCustomFarmingType('');
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    if (customFarmingType.trim()) {
                      setSelectedFarmingTypes([...selectedFarmingTypes, customFarmingType.trim()]);
                      setCustomFarmingType('');
                    }
                  }}
                >
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Crop Selection (Multi-select + Suggestions + Custom) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('selectedCrops')}</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>

              {/* Selected Crops Chips */}
              <View style={styles.selectedTagsRow}>
                {selectedCrops.map((crop) => (
                  <View key={crop} style={styles.selectedCropChip}>
                    <Text style={styles.selectedCropText}>{crop}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedCrops(selectedCrops.filter((c) => c !== crop))}
                    >
                      <X size={14} color={Colors.primary[700]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.subLabel}>{t('popularCrops')}</Text>
              <View style={styles.tagGrid}>
                {POPULAR_CROPS.map((crop) => {
                  const selected = selectedCrops.includes(crop);
                  return (
                    <TouchableOpacity
                      key={crop}
                      style={[styles.tagPill, selected && styles.tagPillActive]}
                      onPress={() => toggleSelection(selectedCrops, setSelectedCrops, crop)}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextActive]}>{crop}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Crop Entry */}
              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder={language === 'ta' ? 'மற்ற பயிர் பெயர் சேர்க்கவும்...' : 'Add another crop name...'}
                  placeholderTextColor={Colors.neutral[400]}
                  value={customCropInput}
                  onChangeText={setCustomCropInput}
                  returnKeyType="done"
                  enterKeyHint="done"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (customCropInput.trim() && !selectedCrops.includes(customCropInput.trim())) {
                      setSelectedCrops([...selectedCrops, customCropInput.trim()]);
                      setCustomCropInput('');
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    if (customCropInput.trim() && !selectedCrops.includes(customCropInput.trim())) {
                      setSelectedCrops([...selectedCrops, customCropInput.trim()]);
                      setCustomCropInput('');
                    }
                  }}
                >
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Irrigation Sources (Multi-select) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('irrigationSourcesHeader')}</Text>
              <View style={styles.tagGrid}>
                {IRRIGATION_SOURCES_LIST.map((source) => {
                  const selected = selectedIrrigation.includes(source);
                  return (
                    <TouchableOpacity
                      key={source}
                      style={[styles.tagPill, selected && styles.tagPillActive]}
                      onPress={() => toggleSelection(selectedIrrigation, setSelectedIrrigation, source)}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextActive]}>{source}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Livestock (Multi-select) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('livestockHeader')}</Text>
              <View style={styles.tagGrid}>
                {LIVESTOCK_LIST.map((item) => {
                  const selected = selectedLivestock.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.tagPill, selected && styles.tagPillActive]}
                      onPress={() => toggleSelection(selectedLivestock, setSelectedLivestock, item)}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Equipment (Multi-select) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('equipmentHeader')}</Text>
              <View style={styles.tagGrid}>
                {EQUIPMENT_LIST.map((item) => {
                  const selected = selectedEquipment.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.tagPill, selected && styles.tagPillActive]}
                      onPress={() => toggleSelection(selectedEquipment, setSelectedEquipment, item)}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 3: FINANCIAL DETAILS ================= */}
        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeaderRow}>
              <Coins size={20} color={Colors.primary[600]} />
              <Text style={styles.sectionTitle}>{t('step3Title')}</Text>
            </View>

            {/* Annual Agricultural Income */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('annualIncome')} (₹/year)</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={annualAgriIncome}
                onChangeText={(val) => setAnnualAgriIncome(val.replace(/\D/g, ''))}
                placeholder="e.g. 250000"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={false}
                onSubmitEditing={() => otherIncomeRef.current?.focus()}
              />
            </View>

            {/* Other Allied Income */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('otherIncome')} (₹/year)</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>
              <TextInput
                ref={otherIncomeRef}
                style={styles.input}
                value={otherIncome}
                onChangeText={(val) => setOtherIncome(val.replace(/\D/g, ''))}
                placeholder="e.g. 50000"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={false}
                onSubmitEditing={() => existingMonthlyEmiRef.current?.focus()}
              />
            </View>

            {/* Actual Existing Monthly EMI (Crucial Fix for Issue 30) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('existingMonthlyEmi')}</Text>
                <Text style={styles.requiredBadge}>* {t('required')}</Text>
              </View>
              <TextInput
                ref={existingMonthlyEmiRef}
                style={styles.input}
                value={existingMonthlyEmi}
                onChangeText={(val) => setExistingMonthlyEmi(val.replace(/\D/g, ''))}
                placeholder="e.g. 5000 (Enter 0 if none)"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={false}
                onSubmitEditing={() => existingLoansRef.current?.focus()}
              />
              <Text style={styles.fieldHint}>{t('existingMonthlyEmiHint')}</Text>
            </View>

            {/* Total Outstanding Existing Debt */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('totalExistingLoanDebt')}</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>
              <TextInput
                ref={existingLoansRef}
                style={styles.input}
                value={existingLoans}
                onChangeText={(val) => setExistingLoans(val.replace(/\D/g, ''))}
                placeholder="e.g. 150000"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={false}
                onSubmitEditing={() => monthlyExpensesRef.current?.focus()}
              />
            </View>

            {/* Monthly Household & Farm Expenses */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('monthlyHouseholdExpenses')}</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>
              <TextInput
                ref={monthlyExpensesRef}
                style={styles.input}
                value={monthlyExpenses}
                onChangeText={(val) => setMonthlyExpenses(val.replace(/\D/g, ''))}
                placeholder="e.g. 8000"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                returnKeyType="next"
                enterKeyHint="next"
                blurOnSubmit={true}
                onSubmitEditing={handleNext}
              />
            </View>
          </View>
        )}

        {/* ================= STEP 4: CREDIT DETAILS ================= */}
        {currentStep === 4 && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeaderRow}>
              <CreditCard size={20} color={Colors.primary[600]} />
              <Text style={styles.sectionTitle}>{t('step4Title')}</Text>
            </View>

            {/* Credit Score (Optional + I Don't Know Toggle) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('creditScoreOptional')}</Text>
                <Text style={styles.optionalBadge}>{t('optional')}</Text>
              </View>

              {!creditScoreUnknown && (
                <TextInput
                  style={styles.input}
                  value={creditScore}
                  onChangeText={(val) => setCreditScore(val.replace(/\D/g, ''))}
                  placeholder={language === 'ta' ? 'மதிப்பெண் உள்ளிடவும் (300-900)' : 'e.g. 720 (Range: 300 - 900)'}
                  placeholderTextColor={Colors.neutral[400]}
                  keyboardType="number-pad"
                  maxLength={3}
                  returnKeyType="done"
                  enterKeyHint="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    if (!saving) handleSave();
                  }}
                />
              )}

              {/* Checkbox: I don't know my credit score */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setCreditScoreUnknown(!creditScoreUnknown);
                  if (!creditScoreUnknown) setCreditScore('');
                }}
              >
                <View style={[styles.checkbox, creditScoreUnknown && styles.checkboxActive]}>
                  {creditScoreUnknown && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>{t('dontKnowCreditScore')}</Text>
              </TouchableOpacity>
            </View>

            {/* Repayment History (Realistic Options) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('repaymentHistoryTitle')}</Text>
              <View style={styles.cardList}>
                {REPAYMENT_HISTORY_OPTIONS.map((opt) => {
                  const selected = repaymentHistory === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.selectableCard, selected && styles.selectableCardActive]}
                      onPress={() => setRepaymentHistory(opt.value)}
                    >
                      <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                        {t(opt.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Kisan Credit Card Status */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('kccStatusTitle')}</Text>
              <View style={styles.toggleRowThree}>
                {[
                  { value: 'active', labelKey: 'active' },
                  { value: 'inactive', labelKey: 'inactive' },
                  { value: 'pending', labelKey: 'appliedPending' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.toggleBtnThree, kccStatus === item.value && styles.toggleBtnActive]}
                    onPress={() => setKccStatus(item.value as any)}
                  >
                    <Text style={[styles.toggleBtnText, kccStatus === item.value && styles.toggleBtnTextActive]}>
                      {t(item.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Crop Insurance (PMFBY) Status */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('pmfbyStatusTitle')}</Text>
              <View style={styles.toggleRowFour}>
                {[
                  { value: 'covered', labelKey: 'covered' },
                  { value: 'not_covered', labelKey: 'notCovered' },
                  { value: 'pending', labelKey: 'appliedPending' },
                  { value: 'unknown', labelKey: 'dontKnow' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.toggleBtnFour, pmfbyStatus === item.value && styles.toggleBtnActive]}
                    onPress={() => setPmfbyStatus(item.value as any)}
                  >
                    <Text style={[styles.toggleBtnTextSmall, pmfbyStatus === item.value && styles.toggleBtnTextActive]}>
                      {t(item.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Success Alert Banner */}
        {savedSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={20} color={Colors.success[700]} />
            <Text style={styles.successText}>{t('profileSavedSuccess')}</Text>
          </View>
        )}

        {/* Step Navigation Buttons (With ample bottom spacing for tab bar) */}
        <View style={styles.actionsBar}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={saving}>
              <ChevronLeft size={18} color={Colors.neutral[700]} />
              <Text style={styles.backButtonText}>{t('backBtn')}</Text>
            </TouchableOpacity>
          )}

          {!isOnboarding && currentStep < 4 && (
            <TouchableOpacity
              style={[styles.quickSaveButton, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={Colors.primary[700]} size="small" />
              ) : (
                <>
                  <Check size={16} color={Colors.primary[700]} />
                  <Text style={styles.quickSaveButtonText}>
                    {language === 'ta' ? 'சேமி' : 'Save'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>{t('continueBtn')}</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {isOnboarding ? t('completeProfileBtn') : t('saveProfileBtn')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* District Picker Modal */}
      <Modal visible={showDistrictModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectDistrict')}</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <X size={22} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchRow}>
              <Search size={18} color={Colors.neutral[400]} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchDistricts')}
                value={districtSearch}
                onChangeText={setDistrictSearch}
                autoFocus
                returnKeyType="search"
                enterKeyHint="search"
                blurOnSubmit={true}
                onSubmitEditing={() => {
                  if (filteredDistricts.length > 0) {
                    setDistrict(filteredDistricts[0]);
                    setShowDistrictModal(false);
                  }
                }}
              />
            </View>
            <ScrollView style={styles.modalList}>
              {filteredDistricts.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.modalItem, district === d && styles.modalItemActive]}
                  onPress={() => {
                    setDistrict(d);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, district === d && styles.modalItemTextActive]}>
                    {d}
                  </Text>
                  {district === d && <Check size={18} color={Colors.primary[600]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Picker Modal */}
      <Modal visible={showStateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectState')}</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <X size={22} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {STATES_LIST.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.modalItem, state === st && styles.modalItemActive]}
                  onPress={() => {
                    setState(st);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, state === st && styles.modalItemTextActive]}>
                    {st}
                  </Text>
                  {state === st && <Check size={18} color={Colors.primary[600]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  topModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[600],
    textTransform: 'uppercase',
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary[600],
    borderRadius: 3,
  },
  stepPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: Colors.primary[600],
  },
  stepPillDone: {
    backgroundColor: Colors.success[600],
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral[600],
  },
  stepPillTextActive: {
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepSection: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  formGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[500],
    marginTop: 8,
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.neutral[400],
  },
  input: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.neutral[900],
  },
  readOnlyInput: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[200],
    color: Colors.neutral[600],
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.neutral[0],
  },
  pickerTriggerText: {
    fontSize: 15,
    color: Colors.neutral[900],
    fontWeight: '500',
  },
  cardList: {
    gap: 8,
  },
  selectableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
  },
  selectableCardActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: Colors.primary[600],
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.primary[600],
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  cardTitleActive: {
    color: Colors.primary[900],
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
  },
  toggleRowThree: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtnThree: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
  },
  toggleRowFour: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toggleBtnFour: {
    width: '48%',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
  },
  toggleBtnActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  toggleBtnTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  toggleBtnTextActive: {
    color: Colors.primary[700],
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  tagPillActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral[700],
  },
  tagTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  selectedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  selectedCropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  selectedCropText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[900],
  },
  customAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[0],
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  quickSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary[300],
    backgroundColor: Colors.primary[50],
    gap: 6,
  },
  quickSaveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    gap: 6,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.success[600],
    gap: 6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success[50],
    borderWidth: 1,
    borderColor: Colors.success[500],
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  successText: {
    fontSize: 13,
    color: Colors.success[700],
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral[900],
  },
  modalList: {
    maxHeight: 320,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalItemActive: {
    backgroundColor: Colors.primary[50],
  },
  modalItemText: {
    fontSize: 15,
    color: Colors.neutral[800],
  },
  modalItemTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  genderOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderOptionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionBtnActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  genderOptionTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
});
