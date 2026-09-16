import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Sparkles,
  UserPlus,
  LogIn,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { useAuth, SignUpPayload } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { Colors, BorderRadius, Spacing, Typography } from '@/lib/theme';
import { LanguageToggle } from './LanguageToggle';

const TN_DISTRICTS = [
  'Thanjavur', 'Coimbatore', 'Salem', 'Madurai', 'Tiruchirappalli',
  'Erode', 'Tirunelveli', 'Dindigul', 'Vellore', 'Cuddalore',
  'Viluppuram', 'Tiruppur', 'Kanchipuram', 'Karur', 'Namakkal'
];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, loginWithPassword, signUpCustomer, resetPassword } = useAuth();
  const { t, language } = useLanguage();

  // Top role selection: 'customer' | 'admin'
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin'>('customer');

  // Customer sub-tab: 'signin' | 'signup'
  const [customerTab, setCustomerTab] = useState<'signin' | 'signup'>('signin');

  // Sign In inputs
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Admin inputs
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Sign Up Multi-Step State — NO PRE-FILLED DUMMY DATA
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [signUpData, setSignUpData] = useState<SignUpPayload>({
    fullName: '',
    age: undefined,
    gender: '',
    maritalStatus: '',
    phone: '',
    email: '',
    address: '',
    district: '',
    state: 'Tamil Nadu',
    annualIncome: 0,
    monthlyIncome: 0,
    employmentStatus: 'Farmer',
    existingLoans: 0,
    existingMonthlyEmi: 0,
    monthlyExpenses: 0,
    creditScore: undefined,
    creditScoreUnknown: false,
    repaymentHistory: 'always_on_time',
    loanAmountRequired: 0,
    loanPurpose: '',
    farmerCategory: 'small',
    landSizeAcres: 0,
    landOwnership: 'Owned',
    crops: [],
    farmingType: '',
    irrigationType: '',
    hasKcc: false,
    hasPmfby: false,
    receivingSchemes: false,
    schemeNames: '',
    previousSchemes: '',
  });
  const [cropInput, setCropInput] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  // General Status & Error handling
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>Initializing MonitorX...</Text>
      </View>
    );
  }

  // Once authenticated, render children protected routes
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Handle Customer or Admin Sign In
  const handleSignIn = async () => {
    setErrorMessage('');
    const id = selectedRole === 'admin' ? adminId.trim() : signInIdentifier.trim();
    const pass = selectedRole === 'admin' ? adminPassword : signInPassword;

    if (!id) {
      setErrorMessage(
        selectedRole === 'admin'
          ? (language === 'ta' ? 'தயவுசெய்து உங்கள் நிர்வாக ஐடியை உள்ளிடவும்' : 'Please enter your Admin ID')
          : (language === 'ta' ? 'தயவுசெய்து வாடிக்கையாளர் ஐடி, மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter your Customer ID, email address, or phone number.')
      );
      return;
    }

    if (!pass) {
      setErrorMessage(
        language === 'ta' ? 'தயவுசெய்து கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your password.'
      );
      return;
    }

    // ─── Client-side format validation (works on both Android & Web) ───
    const tokens = id.split(/[\s,+]+/).map((t) => t.trim()).filter(Boolean);
    const isEmailFmt = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
    const isPhoneFmt = (t: string) => {
      const d = t.replace(/\D/g, '');
      return d.length === 10 || (d.length === 12 && d.startsWith('91'));
    };

    if (selectedRole === 'admin') {
      const isAdminIdFmt = (t: string) => /^admin@[0-9]{5}$/.test(t);
      const hasValidAdminId = tokens.some(isAdminIdFmt);
      const hasValidContact = tokens.some((t) => isEmailFmt(t) || isPhoneFmt(t));

      if (!hasValidAdminId && !hasValidContact) {
        setErrorMessage(
          language === 'ta'
            ? 'தவறான நிர்வாக ஐடி, மின்னஞ்சல் அல்லது 10 இலக்க கைபேசி எண். admin@XXXXX (5 எண்கள்) பயன்படுத்தவும்.'
            : 'Invalid Admin ID, email, or 10-digit mobile. Use: admin@XXXXX (5 digits), email, or mobile.'
        );
        return;
      }
    } else {
      const isUserIdFmt = (t: string) => /^user@[0-9]{5}$/.test(t);
      const hasValidUserId = tokens.some(isUserIdFmt);
      const hasValidContact = tokens.some((t) => isEmailFmt(t) || isPhoneFmt(t));

      if (!hasValidUserId && !hasValidContact) {
        setErrorMessage(
          language === 'ta'
            ? 'தவறான பயனர் ஐடி, மின்னஞ்சல் அல்லது 10 இலக்க கைபேசி எண். user@XXXXX (5 எண்கள்) பயன்படுத்தவும்.'
            : 'Invalid User ID, email, or 10-digit mobile. Use: user@XXXXX (5 digits), email, or mobile.'
        );
        return;
      }
    }

    if (pass !== '12345' && pass !== '123456') {
      setErrorMessage(
        language === 'ta' ? 'தவறான கடவுச்சொல்.' : 'Invalid password.'
      );
      return;
    }
    // ──────────────────────────────────────────────────────────────────────

    setIsSubmitting(true);
    const result = await loginWithPassword(id, pass, selectedRole);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || (language === 'ta' ? 'தவறான உள்நுழைவு சான்றுகள்' : 'Invalid login credentials.'));
    }
  };

  // Step transitions in Registration
  const handleNextSignUpStep = () => {
    setErrorMessage('');

    if (signUpStep === 1) {
      if (!signUpData.fullName.trim()) {
        setErrorMessage(language === 'ta' ? 'முழு பெயரை உள்ளிடவும்' : 'Please enter your full name.');
        return;
      }
      if (!signUpData.age || signUpData.age < 18 || signUpData.age > 90) {
        setErrorMessage(language === 'ta' ? 'சரியான வயதை உள்ளிடவும் (18-90)' : 'Please enter a valid age (18-90).');
        return;
      }
      if (!signUpData.gender || !signUpData.gender.trim()) {
        setErrorMessage(
          language === 'ta'
            ? 'தயவுசெய்து உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும் (ஆண் / பெண் / மற்றவை)'
            : 'Please select your gender (Male, Female, or Other).'
        );
        return;
      }
      if (!signUpData.phone.trim() || signUpData.phone.replace(/\D/g, '').length !== 10) {
        setErrorMessage(language === 'ta' ? 'சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!signUpData.email.trim() || !signUpData.email.includes('@')) {
        setErrorMessage(language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்' : 'Please enter a valid email address.');
        return;
      }
      if (!signUpData.district || !signUpData.district.trim()) {
        setErrorMessage(language === 'ta' ? 'மாவட்டத்தை உள்ளிடவும்' : 'Please enter your district.');
        return;
      }
      setSignUpStep(2);
      return;
    }

    if (signUpStep === 2) {
      if (!signUpData.annualIncome || signUpData.annualIncome <= 0) {
        setErrorMessage(language === 'ta' ? 'வருடாந்திர வருமானத்தை உள்ளிடவும்' : 'Please enter your annual income.');
        return;
      }
      setSignUpStep(3);
      return;
    }

    if (signUpStep === 3) {
      if (!signUpData.landSizeAcres || signUpData.landSizeAcres <= 0) {
        setErrorMessage(language === 'ta' ? 'நில அளவை (ஏக்கர்) உள்ளிடவும்' : 'Please enter your land size in acres.');
        return;
      }
      // Update crops from input if provided
      if (cropInput.trim() && (!signUpData.crops || signUpData.crops.length === 0)) {
        signUpData.crops = cropInput.split(',').map((s) => s.trim()).filter(Boolean);
      }
      setSignUpStep(4);
      return;
    }

    if (signUpStep === 4) {
      if (!signUpPassword || signUpPassword.length < 4) {
        setErrorMessage(language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும் (குறைந்தது 4 எழுத்துக்கள்)' : 'Please set a password (at least 4 characters).');
        return;
      }
      setSignUpStep(5);
      return;
    }
  };

  // Verify OTP and complete Registration
  const handleVerifyOtpAndRegister = async () => {
    setErrorMessage('');
    if (!otpInput.trim()) {
      setErrorMessage(language === 'ta' ? 'OTP ஐ உள்ளிடவும்' : 'Please enter the verification OTP.');
      return;
    }

    if (otpInput.trim() !== '123456') {
      setErrorMessage(language === 'ta' ? 'தவறான OTP. மீண்டும் முயற்சிக்கவும்.' : 'Invalid OTP. Please try again.');
      return;
    }

    setIsSubmitting(true);
    const res = await signUpCustomer(signUpData, signUpPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to complete registration. Please try again.');
    }
  };

  // Forgot password dispatch
  const handleResetPasswordSubmit = async () => {
    setResetMessage(null);
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetMessage({
        type: 'error',
        text: language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்' : 'Please enter a valid email address.',
      });
      return;
    }

    setResetLoading(true);
    const res = await resetPassword(resetEmail);
    setResetLoading(false);

    if (res.success) {
      setResetMessage({
        type: 'success',
        text: language === 'ta'
          ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.'
          : 'Password reset link has been dispatched to your email address.',
      });
    } else {
      setResetMessage({
        type: 'error',
        text: res.error || 'Unable to send reset email. Please try again.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Bar */}
          <View style={styles.topHeader}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <ShieldCheck size={22} color={Colors.primary[700]} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.appName}>{t('appName')}</Text>
                <Text style={styles.appTagline} numberOfLines={1}>{t('appTagline')}</Text>
              </View>
            </View>
            <LanguageToggle />
          </View>

          {/* Main Card Container */}
          <View style={styles.mainCard}>
            {/* Top Role Selector Tabs */}
            <View style={styles.roleTabsRow}>
              <TouchableOpacity
                style={[styles.roleTab, selectedRole === 'customer' && styles.roleTabActive]}
                onPress={() => {
                  setSelectedRole('customer');
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <User size={18} color={selectedRole === 'customer' ? Colors.primary[700] : Colors.neutral[500]} />
                <Text style={[styles.roleTabText, selectedRole === 'customer' && styles.roleTabTextActive]} numberOfLines={2}>
                  {language === 'ta' ? 'வாடிக்கையாளர்\nபோர்டல்' : 'Customer Portal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleTab, selectedRole === 'admin' && styles.roleTabActiveAdmin]}
                onPress={() => {
                  setSelectedRole('admin');
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <Building2 size={18} color={selectedRole === 'admin' ? Colors.accent[700] : Colors.neutral[500]} />
                <Text style={[styles.roleTabText, selectedRole === 'admin' && styles.roleTabTextActiveAdmin]} numberOfLines={2}>
                  {language === 'ta' ? 'வங்கி நிர்வாக\nபோர்டல்' : 'Bank Admin Portal'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Box */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={Colors.error[600]} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* CUSTOMER PORTAL VIEW */}
            {selectedRole === 'customer' ? (
              <View style={styles.portalContent}>
                {/* Sign In vs Sign Up Sub-Tabs */}
                <View style={styles.subTabRow}>
                  <TouchableOpacity
                    style={[styles.subTab, customerTab === 'signin' && styles.subTabActive]}
                    onPress={() => {
                      setCustomerTab('signin');
                      setErrorMessage('');
                    }}
                  >
                    <LogIn size={16} color={customerTab === 'signin' ? Colors.primary[700] : Colors.neutral[500]} />
                    <Text style={[styles.subTabText, customerTab === 'signin' && styles.subTabTextActive]}>
                      {language === 'ta' ? 'உள்நுழையவும்' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subTab, customerTab === 'signup' && styles.subTabActive]}
                    onPress={() => {
                      setCustomerTab('signup');
                      setErrorMessage('');
                      setSignUpStep(1);
                    }}
                  >
                    <UserPlus size={16} color={customerTab === 'signup' ? Colors.primary[700] : Colors.neutral[500]} />
                    <Text style={[styles.subTabText, customerTab === 'signup' && styles.subTabTextActive]}>
                      {language === 'ta' ? 'புதிய கணக்கு' : 'New User? Sign Up'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 1. CUSTOMER SIGN IN */}
                {customerTab === 'signin' ? (
                  <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>
                      {language === 'ta' ? 'வாடிக்கையாளர் உள்நுழைவு' : 'Customer Sign In'}
                    </Text>
                    <Text style={styles.formSubtitle}>
                      {language === 'ta'
                        ? 'உங்கள் கணக்கில் உள்நுழைந்து கடன் மற்றும் மானிய விவரங்களை அணுகவும்'
                        : 'Sign in to access your loans, subsidies, and credit assessments.'}
                    </Text>

                    {/* Identifier */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        {language === 'ta' ? 'பயனர் ஐடி / மின்னஞ்சல் / கைபேசி எண் *' : 'User ID / Email ID / Mobile Number *'}
                      </Text>
                      <View style={styles.inputWrapper}>
                        <User size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder={language === 'ta' ? 'எ.கா. user@12345, மின்னஞ்சல் அல்லது தொலைபேசி' : 'e.g. user@12345, email, or 10-digit mobile'}
                          placeholderTextColor={Colors.neutral[400]}
                          value={signInIdentifier}
                          onChangeText={(t) => {
                            setSignInIdentifier(t);
                            setErrorMessage('');
                          }}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.inputLabel}>
                          {language === 'ta' ? 'கடவுச்சொல் *' : 'Password *'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setForgotModalVisible(true);
                            setResetMessage(null);
                            setResetEmail(signInIdentifier.includes('@') ? signInIdentifier : '');
                          }}
                        >
                          <Text style={styles.forgotLink}>
                            {language === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot Password?'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.inputWrapper}>
                        <Lock size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.textInput, { paddingRight: 40 }]}
                          placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter password'}
                          placeholderTextColor={Colors.neutral[400]}
                          secureTextEntry={!showSignInPassword}
                          value={signInPassword}
                          onChangeText={(t) => {
                            setSignInPassword(t);
                            setErrorMessage('');
                          }}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.eyeBtn}
                          onPress={() => setShowSignInPassword(!showSignInPassword)}
                        >
                          {showSignInPassword ? (
                            <EyeOff size={18} color={Colors.neutral[500]} />
                          ) : (
                            <Eye size={18} color={Colors.neutral[500]} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                      style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
                      onPress={handleSignIn}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Text style={styles.primaryBtnText}>
                            {language === 'ta' ? 'உள்நுழையவும்' : 'Sign In'}
                          </Text>
                          <ArrowRight size={18} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Switch to Sign Up link */}
                    <TouchableOpacity
                      style={styles.switchLinkBox}
                      onPress={() => {
                        setCustomerTab('signup');
                        setErrorMessage('');
                        setSignUpStep(1);
                      }}
                    >
                      <Text style={styles.switchLinkText}>
                        {language === 'ta' ? 'புதியவரா? ' : "Don't have an account? "}
                        <Text style={styles.boldLink}>
                          {language === 'ta' ? 'இப்போதே பதிவு செய்யவும்' : 'Sign Up here'}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* 2. CUSTOMER SIGN UP MULTI-STEP WIZARD (EMPTY INPUTS) */
                  <View style={styles.formContainer}>
                    {/* Step Progress Bar */}
                    <View style={styles.stepProgressHeader}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                          {signUpStep === 5 ? (language === 'ta' ? 'OTP சரிபார்ப்பு' : 'OTP Verification') : `Step ${signUpStep} of 4`}
                        </Text>
                      </View>
                      <Text style={styles.stepHeading}>
                        {signUpStep === 1 && (language === 'ta' ? 'தனிநபர் விவரங்கள்' : '1. Personal Details')}
                        {signUpStep === 2 && (language === 'ta' ? 'நிதி மற்றும் கடன் விவரங்கள்' : '2. Financial Details')}
                        {signUpStep === 3 && (language === 'ta' ? 'விவசாய மற்றும் நில விவரங்கள்' : '3. Agriculture & Land')}
                        {signUpStep === 4 && (language === 'ta' ? 'அரசு திட்டங்கள் & கடவுச்சொல்' : '4. Schemes & Password')}
                        {signUpStep === 5 && (language === 'ta' ? 'OTP சரிபார்த்து பதிவு முடித்தல்' : '5. Verify OTP & Register')}
                      </Text>
                    </View>

                    {/* STEP 1: Personal Details (NO Customer ID prompt) */}
                    {signUpStep === 1 && (
                      <View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'முழு பெயர் *' : 'Full Name *'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'உங்கள் முழு பெயரை உள்ளிடவும்' : 'Enter your full name'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={signUpData.fullName}
                            onChangeText={(t) => setSignUpData({ ...signUpData, fullName: t })}
                          />
                        </View>

                        <View style={styles.inputRow}>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'வயது *' : 'Age *'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder={language === 'ta' ? 'எ.கா. 38' : 'e.g. 38'}
                              placeholderTextColor={Colors.neutral[400]}
                              keyboardType="number-pad"
                              value={signUpData.age ? String(signUpData.age) : ''}
                              onChangeText={(t) => setSignUpData({ ...signUpData, age: parseInt(t) || undefined })}
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'பாலினம் *' : 'Gender *'}
                          </Text>
                          <View style={styles.genderOptionsRow}>
                            {[
                              { id: 'Male', labelEn: 'Male', labelTa: 'ஆண்' },
                              { id: 'Female', labelEn: 'Female', labelTa: 'பெண்' },
                              { id: 'Other', labelEn: 'Other', labelTa: 'மற்றவை' },
                            ].map((opt) => {
                              const isSelected = signUpData.gender === opt.id;
                              return (
                                <TouchableOpacity
                                  key={opt.id}
                                  style={[
                                    styles.genderOptionBtn,
                                    isSelected && styles.genderOptionBtnActive,
                                  ]}
                                  onPress={() => setSignUpData({ ...signUpData, gender: opt.id })}
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

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'கைபேசி எண் *' : 'Mobile Number *'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? '10 இலக்க கைபேசி எண்ணை உள்ளிடவும்' : 'Enter 10-digit mobile number'}
                            placeholderTextColor={Colors.neutral[400]}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={signUpData.phone}
                            onChangeText={(t) => setSignUpData({ ...signUpData, phone: t.replace(/\D/g, '') })}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'மின்னஞ்சல் முகவரி *' : 'Email Address *'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'மின்னஞ்சலை உள்ளிடவும்' : 'Enter email address'}
                            placeholderTextColor={Colors.neutral[400]}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={signUpData.email}
                            onChangeText={(t) => setSignUpData({ ...signUpData, email: t })}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'மாவட்டம் (தமிழ்நாடு) *' : 'District (Tamil Nadu) *'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'எ.கா. தஞ்சாவூர், மதுரை, சேலம்...' : 'e.g. Thanjavur, Madurai, Salem...'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={signUpData.district}
                            onChangeText={(t) => setSignUpData({ ...signUpData, district: t })}
                          />
                        </View>
                      </View>
                    )}

                    {/* STEP 2: Financial Details */}
                    {signUpStep === 2 && (
                      <View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'ஆண்டு வருமானம் (₹) *' : 'Annual Income (₹) *'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'ஆண்டு வருமானத்தை உள்ளிடவும் (எ.கா. 250000)' : 'Enter annual income (e.g. 250000)'}
                            placeholderTextColor={Colors.neutral[400]}
                            keyboardType="number-pad"
                            value={signUpData.annualIncome ? String(signUpData.annualIncome) : ''}
                            onChangeText={(t) => setSignUpData({ ...signUpData, annualIncome: parseInt(t) || 0 })}
                          />
                        </View>

                        <View style={styles.inputRow}>
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'மாதாந்திர வருமானம் (₹)' : 'Monthly Income (₹)'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder={language === 'ta' ? 'மாதாந்திர வருமானம்' : 'Monthly income'}
                              placeholderTextColor={Colors.neutral[400]}
                              keyboardType="number-pad"
                              value={signUpData.monthlyIncome ? String(signUpData.monthlyIncome) : ''}
                              onChangeText={(t) => setSignUpData({ ...signUpData, monthlyIncome: parseInt(t) || 0 })}
                            />
                          </View>

                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'மாதாந்திர செலவுகள் (₹)' : 'Monthly Expenses (₹)'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder={language === 'ta' ? 'மாதாந்திர செலவுகள்' : 'Monthly expenses'}
                              placeholderTextColor={Colors.neutral[400]}
                              keyboardType="number-pad"
                              value={signUpData.monthlyExpenses ? String(signUpData.monthlyExpenses) : ''}
                              onChangeText={(t) => setSignUpData({ ...signUpData, monthlyExpenses: parseInt(t) || 0 })}
                            />
                          </View>
                        </View>

                        <View style={styles.inputRow}>
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'தற்போதுள்ள கடன்கள் (₹)' : 'Existing Debt/Loans (₹)'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder="0"
                              placeholderTextColor={Colors.neutral[400]}
                              keyboardType="number-pad"
                              value={signUpData.existingLoans ? String(signUpData.existingLoans) : ''}
                              onChangeText={(t) => setSignUpData({ ...signUpData, existingLoans: parseInt(t) || 0 })}
                            />
                          </View>

                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'கடன் மதிப்பீடு (தெரிந்தால்)' : 'Credit Score (if known)'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder={language === 'ta' ? 'எ.கா. 700' : 'e.g. 700'}
                              placeholderTextColor={Colors.neutral[400]}
                              keyboardType="number-pad"
                              value={signUpData.creditScore ? String(signUpData.creditScore) : ''}
                              onChangeText={(t) => setSignUpData({ ...signUpData, creditScore: parseInt(t) || undefined })}
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'தேவையான கடன் தொகை (₹)' : 'Loan Amount Required (₹)'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'தேவையான கடன் தொகையை உள்ளிடவும்' : 'Enter desired loan amount'}
                            placeholderTextColor={Colors.neutral[400]}
                            keyboardType="number-pad"
                            value={signUpData.loanAmountRequired ? String(signUpData.loanAmountRequired) : ''}
                            onChangeText={(t) => setSignUpData({ ...signUpData, loanAmountRequired: parseInt(t) || 0 })}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'கடன் நோக்கம்' : 'Loan Purpose'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'பயிர் சாகுபடி / நீர்ப்பாசனம் / பண்ணை உபகரணங்கள்' : 'Crop Cultivation / Irrigation / Farm Equipment'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={signUpData.loanPurpose}
                            onChangeText={(t) => setSignUpData({ ...signUpData, loanPurpose: t })}
                          />
                        </View>
                      </View>
                    )}

                    {/* STEP 3: Agriculture / Farmer Details */}
                    {signUpStep === 3 && (
                      <View>
                        <View style={styles.inputRow}>
                          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'நிலப்பரப்பு (ஏக்கர்) *' : 'Land Area (Acres) *'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder="e.g. 4.0"
                              placeholderTextColor={Colors.neutral[400]}
                              keyboardType="decimal-pad"
                              value={signUpData.landSizeAcres ? String(signUpData.landSizeAcres) : ''}
                              onChangeText={(t) => setSignUpData({ ...signUpData, landSizeAcres: parseFloat(t) || 0 })}
                            />
                          </View>

                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>
                              {language === 'ta' ? 'நில உரிமை' : 'Land Ownership'}
                            </Text>
                            <TextInput
                              style={styles.simpleInput}
                              placeholder={language === 'ta' ? 'சொந்தம் / குத்தகை' : 'Owned / Leased'}
                              placeholderTextColor={Colors.neutral[400]}
                              value={signUpData.landOwnership}
                              onChangeText={(t) => setSignUpData({ ...signUpData, landOwnership: t })}
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'பயிரிடப்படும் பயிர்கள்' : 'Crops Cultivated'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'எ.கா. நெல், பருத்தி, வாழை, கரும்பு' : 'e.g. Paddy, Cotton, Banana, Sugarcane'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={cropInput || (signUpData.crops ? signUpData.crops.join(', ') : '')}
                            onChangeText={(t) => {
                              setCropInput(t);
                              setSignUpData({ ...signUpData, crops: t.split(',').map((s) => s.trim()).filter(Boolean) });
                            }}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'விவசாய / நில வகை' : 'Farming / Land Type'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'நஞ்சை / புஞ்சை / தோட்டம்' : 'Wetland (Nanjai) / Dryland (Punjai) / Garden'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={signUpData.farmingType}
                            onChangeText={(t) => setSignUpData({ ...signUpData, farmingType: t })}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'நீர்ப்பாசன ஆதாரம்' : 'Irrigation Source'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'ஆழ்துளை கிணறு / கால்வாய் / திறந்த கிணறு / மானாவாரி' : 'Borewell / Canal / Open Well / Rain-fed'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={signUpData.irrigationType}
                            onChangeText={(t) => setSignUpData({ ...signUpData, irrigationType: t })}
                          />
                        </View>
                      </View>
                    )}

                    {/* STEP 4: Government Schemes & Password */}
                    {signUpStep === 4 && (
                      <View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'செயலில் உள்ள அரசு திட்டம்(கள்) ஏதேனும் இருந்தால்' : 'Active Government Scheme(s) If Any'}
                          </Text>
                          <TextInput
                            style={styles.simpleInput}
                            placeholder={language === 'ta' ? 'எ.கா. PM-KISAN, PMFBY, சோலார் பம்ப் மானியம்' : 'e.g. PM-KISAN, PMFBY, Solar Pump Subsidy'}
                            placeholderTextColor={Colors.neutral[400]}
                            value={signUpData.schemeNames}
                            onChangeText={(t) => setSignUpData({ ...signUpData, schemeNames: t })}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {language === 'ta' ? 'கணக்கு கடவுச்சொல்லை அமைக்கவும் *' : 'Set Account Password *'}
                          </Text>
                          <View style={styles.inputWrapper}>
                            <Lock size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
                            <TextInput
                              style={[styles.textInput, { paddingRight: 40 }]}
                              placeholder={language === 'ta' ? 'பாதுகாப்பான கடவுச்சொல்லை உள்ளிடவும்' : 'Enter secure password'}
                              placeholderTextColor={Colors.neutral[400]}
                              secureTextEntry={!showSignUpPassword}
                              value={signUpPassword}
                              onChangeText={setSignUpPassword}
                              autoCapitalize="none"
                            />
                            <TouchableOpacity
                              style={styles.eyeBtn}
                              onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                            >
                              {showSignUpPassword ? (
                                <EyeOff size={18} color={Colors.neutral[500]} />
                              ) : (
                                <Eye size={18} color={Colors.neutral[500]} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* STEP 5: OTP Verification (NO 123456 displayed on screen) */}
                    {signUpStep === 5 && (
                      <View style={styles.otpStepBox}>
                        <View style={styles.otpIconBadge}>
                          <ShieldCheck size={32} color={Colors.primary[600]} />
                        </View>
                        <Text style={styles.otpTitle}>
                          {language === 'ta' ? 'மொபைலைச் சரிபார்த்து பதிவை முடிக்கவும்' : 'Verify Mobile & Complete Registration'}
                        </Text>
                        <Text style={styles.otpSubtitle}>
                          {language === 'ta'
                            ? `+91 ${signUpData.phone} க்கு அனுப்பப்பட்ட 6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்`
                            : 'Please enter the 6-digit verification code sent to'}{' '}
                          <Text style={{ fontWeight: '700', color: Colors.neutral[900] }}>
                            +91 {signUpData.phone}
                          </Text>
                        </Text>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { textAlign: 'center' }]}>
                            {language === 'ta' ? '6-இலக்க OTP ஐ உள்ளிடவும்' : 'ENTER 6-DIGIT OTP'}
                          </Text>
                          <TextInput
                            style={styles.otpBigInput}
                            placeholder="• • • • • •"
                            placeholderTextColor={Colors.neutral[300]}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otpInput}
                            onChangeText={setOtpInput}
                            autoFocus
                          />
                        </View>

                        <TouchableOpacity
                          style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
                          onPress={handleVerifyOtpAndRegister}
                          disabled={isSubmitting}
                          activeOpacity={0.8}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <View style={styles.btnContent}>
                              <Text style={styles.primaryBtnText}>
                                {language === 'ta' ? 'OTP சரிபார்த்து கணக்கை உருவாக்கவும்' : 'Verify OTP & Create Account'}
                              </Text>
                              <CheckCircle2 size={18} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Navigation Buttons for Steps 1-4 */}
                    {signUpStep < 5 && (
                      <View style={styles.wizardNavRow}>
                        {signUpStep > 1 ? (
                          <TouchableOpacity
                            style={styles.prevBtn}
                            onPress={() => {
                              setErrorMessage('');
                              setSignUpStep((s) => (s > 1 ? ((s - 1) as any) : s));
                            }}
                          >
                            <ChevronLeft size={18} color={Colors.neutral[700]} />
                            <Text style={styles.prevBtnText}>{t('backBtn')}</Text>
                          </TouchableOpacity>
                        ) : (
                          <View />
                        )}

                        <TouchableOpacity
                          style={styles.nextBtn}
                          onPress={handleNextSignUpStep}
                        >
                          <Text style={styles.nextBtnText}>
                            {signUpStep === 4
                              ? (language === 'ta' ? 'OTP க்கு தொடரவும்' : 'Proceed to OTP')
                              : t('continueBtn')}
                          </Text>
                          <ChevronRight size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              /* BANK ADMIN PORTAL VIEW */
              <View style={styles.portalContent}>
                <View style={styles.formContainer}>
                  <View style={styles.adminBadgeRow}>
                    <Building2 size={20} color={Colors.accent[700]} />
                    <Text style={styles.adminTitle}>
                      {language === 'ta' ? 'வங்கி நிர்வாக உள்நுழைவு' : 'Bank Admin & Officer Login'}
                    </Text>
                  </View>
                  <Text style={styles.formSubtitle}>
                    {language === 'ta'
                      ? 'கடன் அதிகாரிகள், ஆபத்து பகுப்பாய்வாளர்கள் மற்றும் நிர்வாகிகளுக்கான அங்கீகரிக்கப்பட்ட அணுகல்.'
                      : 'Authorized access for loan officers, risk underwriters, and benchmark analysts.'}
                  </Text>

                  {/* Admin ID */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {language === 'ta' ? 'நிர்வாக ஐடி *' : 'ADMIN ID *'}
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Building2 size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={language === 'ta' ? 'எ.கா. admin@12345' : 'e.g. admin@12345'}
                        placeholderTextColor={Colors.neutral[400]}
                        value={adminId}
                        onChangeText={(t) => {
                          setAdminId(t);
                          setErrorMessage('');
                        }}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* Admin Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {language === 'ta' ? 'கடவுச்சொல் *' : 'PASSWORD *'}
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, { paddingRight: 40 }]}
                        placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter admin password'}
                        placeholderTextColor={Colors.neutral[400]}
                        secureTextEntry={!showAdminPassword}
                        value={adminPassword}
                        onChangeText={(t) => {
                          setAdminPassword(t);
                          setErrorMessage('');
                        }}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowAdminPassword(!showAdminPassword)}
                      >
                        {showAdminPassword ? (
                          <EyeOff size={18} color={Colors.neutral[500]} />
                        ) : (
                          <Eye size={18} color={Colors.neutral[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Admin Login Button */}
                  <TouchableOpacity
                    style={[styles.primaryBtn, styles.adminBtn, isSubmitting && styles.btnDisabled]}
                    onPress={handleSignIn}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <View style={styles.btnContent}>
                        <Text style={styles.primaryBtnText}>
                          {language === 'ta' ? 'நிர்வாக உள்நுழைவு' : 'Secure Admin Login'}
                        </Text>
                        <ArrowRight size={18} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.securityNoticeRow}>
                    <Lock size={13} color={Colors.neutral[500]} />
                    <Text style={styles.securityNoticeText}>
                      {language === 'ta'
                        ? 'அங்கீகரிக்கப்பட்ட வங்கி நிர்வாகிகள் மட்டுமே'
                        : 'Authorized bank administrators and risk analysts only'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                <X size={20} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter your registered email address. We will send you instructions to reset your password.
            </Text>

            <TextInput
              style={styles.simpleInput}
              placeholder="name@example.com"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={resetEmail}
              onChangeText={setResetEmail}
            />

            {resetMessage && (
              <View
                style={[
                  styles.resetMsgBox,
                  resetMessage.type === 'success' ? styles.resetMsgSuccess : styles.resetMsgError,
                ]}
              >
                <Text
                  style={[
                    styles.resetMsgText,
                    resetMessage.type === 'success' ? styles.resetMsgTextSuccess : styles.resetMsgTextError,
                  ]}
                >
                  {resetMessage.text}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 16 }, resetLoading && styles.btnDisabled]}
              onPress={handleResetPasswordSubmit}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.neutral[600],
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.neutral[900],
  },
  appTagline: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontWeight: '500',
  },
  mainCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Platform.OS === 'android' ? 14 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  roleTabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  roleTabActive: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.primary[300],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleTabActiveAdmin: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.accent[300],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[600],
    textAlign: 'center',
    flexShrink: 1,
  },
  roleTabTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  roleTabTextActiveAdmin: {
    color: Colors.accent[800],
    fontWeight: '700',
  },
  subTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    marginBottom: 16,
    flexWrap: 'nowrap',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: Colors.primary[600],
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[500],
    flexShrink: 1,
  },
  subTabTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  portalContent: {
    marginTop: 4,
  },
  formContainer: {},
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 6,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  forgotLink: {
    fontSize: 12,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
  },
  inputIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.neutral[900],
  },
  simpleInput: {
    height: 44,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.neutral[900],
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary[600],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  adminBtn: {
    backgroundColor: Colors.accent[700],
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchLinkBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchLinkText: {
    fontSize: 13,
    color: Colors.neutral[600],
  },
  boldLink: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[100],
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error[700],
    lineHeight: 16,
    fontWeight: '500',
  },
  stepProgressHeader: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  wizardNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginLeft: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary[600],
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4,
  },
  otpStepBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  otpIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 13,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  otpBigInput: {
    width: 220,
    height: 50,
    backgroundColor: Colors.neutral[50],
    borderWidth: 2,
    borderColor: Colors.primary[500],
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  adminTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.accent[900],
    flexShrink: 1,
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  securityNoticeText: {
    fontSize: 11,
    color: Colors.neutral[500],
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.neutral[600],
    marginBottom: 14,
    lineHeight: 18,
  },
  resetMsgBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  resetMsgSuccess: {
    backgroundColor: Colors.success[50],
  },
  resetMsgError: {
    backgroundColor: Colors.error[50],
  },
  resetMsgText: {
    fontSize: 12,
  },
  resetMsgTextSuccess: {
    color: Colors.success[700],
  },
  resetMsgTextError: {
    color: Colors.error[700],
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
