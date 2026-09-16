import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useProfile } from '@/lib/profile-context';
import { Colors } from '@/lib/theme';
import { Header } from '@/components/Header';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { loanProducts, LoanProduct, calculateEMI } from '@/lib/loans';
import { assessLoanEligibility } from '@/lib/eligibility';
import { supabase, EligibilityResult } from '@/lib/supabase';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  X,
  Brain,
  FileText,
  ArrowRight,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import { runMLPrediction, type MLPredictionResult } from '@/lib/ml-prediction';

export default function LoansScreen() {
  const { t, language } = useLanguage();
  const { profile } = useProfile();
  const [selectedLoan, setSelectedLoan] = useState<LoanProduct | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);

  // FIX: Per-loan amount/tenure state — keyed by loan.id to prevent cross-card contamination
  const [amountByLoan, setAmountByLoan] = useState<Record<string, string>>({});
  const [tenureByLoan, setTenureByLoan] = useState<Record<string, string>>({});

  const [calculating, setCalculating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);

  // ML Analysis state
  const [mlResult, setMlResult] = useState<MLPredictionResult | null>(null);
  const [mlAnalyzing, setMlAnalyzing] = useState(false);
  const [showMlSection, setShowMlSection] = useState(false);

  const handleApplyLoan = async (loan: LoanProduct) => {
    if (!profile?.id) {
      Alert.alert(
        language === 'ta' ? 'சுயவிவரம் தேவை' : 'Profile Required',
        language === 'ta' ? 'முதலில் உங்கள் விவசாய சுயவிவரத்தை அமைக்கவும்' : 'Please set up your farmer profile before expressing interest in a loan.'
      );
      return;
    }

    const rawAmount = parseFloat(amountByLoan[loan.id] || '');
    const rawTenure = parseInt(tenureByLoan[loan.id] || '', 10);

    // Validate amount range
    if (rawAmount && (rawAmount < loan.minAmount || rawAmount > loan.maxAmount)) {
      Alert.alert(
        language === 'ta' ? 'தொகை வரம்பு தவறு' : 'Invalid Amount',
        language === 'ta'
          ? `தொகை ₹${(loan.minAmount / 1000).toFixed(0)}K முதல் ₹${(loan.maxAmount / 100000).toFixed(1)}L வரை இருக்க வேண்டும்`
          : `Amount must be between ₹${loan.minAmount.toLocaleString('en-IN')} and ₹${loan.maxAmount.toLocaleString('en-IN')}`
      );
      return;
    }

    // Validate tenure range
    if (rawTenure && (rawTenure < loan.minTenureMonths || rawTenure > loan.maxTenureMonths)) {
      Alert.alert(
        language === 'ta' ? 'கால அளவு தவறு' : 'Invalid Tenure',
        language === 'ta'
          ? `கால அளவு ${loan.minTenureMonths} முதல் ${loan.maxTenureMonths} மாதங்கள் வரை இருக்க வேண்டும்`
          : `Tenure must be between ${loan.minTenureMonths} and ${loan.maxTenureMonths} months`
      );
      return;
    }

    const amount = rawAmount || loan.minAmount;
    const tenure = rawTenure || loan.minTenureMonths;

    setApplying(true);
    try {
      const { data, error } = await supabase.from('loan_applications').insert({
        farmer_id: profile.id,
        loan_type: loan.type,
        bank_name: loan.bank,
        loan_amount: amount,
        interest_rate: loan.interestRateValue,
        tenure_months: tenure,
        status: 'interested',
      }).select().single();

      if (!error && data) {
        setSubmittedApplicationId(data.id);
        setShowEligibility(false);
      } else {
        Alert.alert('Error', error?.message || 'Failed to submit loan interest');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleCheckEligibility = async (loan: LoanProduct) => {
    setSelectedLoan(loan);
    const rawAmount = parseFloat(amountByLoan[loan.id] || '');
    const rawTenure = parseInt(tenureByLoan[loan.id] || '', 10);
    const amount = rawAmount || loan.minAmount;
    const tenure = rawTenure || loan.minTenureMonths;

    if (!profile) {
      setShowEligibility(true);
      return;
    }

    setCalculating(true);
    const result = assessLoanEligibility(profile, loan.type, amount, tenure, loan);
    setEligibilityResult(result);
    setShowEligibility(true);

    try {
      await supabase.from('eligibility_results').insert({
        farmer_id: profile.id,
        loan_type: loan.type,
        requested_amount: amount,
        eligibility_status: result.eligibility_status,
        risk_level: result.risk_level,
        eligibility_score: result.eligibility_score,
        factors: result.factors,
        recommendations: result.recommendations,
      });
    } catch {
      // Non-critical: result still shown even if logging fails
    }
    setCalculating(false);
  };

  const handleRunMLAnalysis = () => {
    if (!profile || !selectedLoan) return;
    setMlAnalyzing(true);
    setShowMlSection(true);

    // Small delay to show loading state
    setTimeout(() => {
      try {
        const rawAmount = parseFloat(amountByLoan[selectedLoan.id] || '');
        const amount = rawAmount || selectedLoan.minAmount;
        const result = runMLPrediction(profile, amount, selectedLoan.type);
        setMlResult(result);
      } catch (err) {
        console.error('ML prediction error:', err);
        setMlResult(null);
      } finally {
        setMlAnalyzing(false);
      }
    }, 300);
  };

  const getMLCategoryColor = (category: string) => {
    if (category === 'likely_eligible') return Colors.success[600];
    if (category === 'needs_review') return Colors.warning[500];
    return Colors.error[500];
  };

  const getMLCategoryIcon = (category: string) => {
    if (category === 'likely_eligible') return <CheckCircle size={36} color={Colors.success[600]} />;
    if (category === 'needs_review') return <AlertCircle size={36} color={Colors.warning[500]} />;
    return <XCircle size={36} color={Colors.error[500]} />;
  };

  const getMLCategoryLabel = (category: string) => {
    if (category === 'likely_eligible') return t('mlLikelyEligible');
    if (category === 'needs_review') return t('mlNeedsReview');
    return t('mlHigherRisk');
  };

  const renderEligibilityIcon = (status: string) => {
    if (status === 'likely_eligible' || status === 'eligible')
      return <CheckCircle size={48} color={Colors.success[600]} />;
    if (status === 'potentially_eligible')
      return <AlertCircle size={48} color={Colors.warning[500]} />;
    return <XCircle size={48} color={Colors.error[500]} />;
  };

  const getEligibilityColor = (status: string) => {
    if (status === 'likely_eligible' || status === 'eligible') return Colors.success[600];
    if (status === 'potentially_eligible') return Colors.warning[500];
    return Colors.error[500];
  };

  const getEligibilityLabel = (status: string) => {
    if (status === 'likely_eligible' || status === 'eligible') return t('likelyEligible');
    if (status === 'potentially_eligible') return t('potentiallyEligible');
    return t('notEligible');
  };

  const getRiskLabel = (risk: string) => {
    if (risk === 'low_risk') return t('lowRisk');
    if (risk === 'medium_risk') return t('mediumRisk');
    return t('highRisk');
  };

  const emiPreview = useMemo(() => {
    if (!selectedLoan) return null;
    const amount = parseFloat(amountByLoan[selectedLoan.id] || '') || selectedLoan.minAmount;
    const tenure = parseInt(tenureByLoan[selectedLoan.id] || '', 10) || selectedLoan.minTenureMonths;
    return calculateEMI(amount, selectedLoan.interestRateValue, tenure);
  }, [selectedLoan, amountByLoan, tenureByLoan]);

  return (
    <View style={styles.container}>
      <Header title={t('agriculturalLoans')} subtitle={t('loanProducts')} />

      {!profile && (
        <View style={styles.noProfileBanner}>
          <Info size={18} color={Colors.accent[600]} />
          <Text style={styles.noProfileText}>{t('profileRequired')}</Text>
        </View>
      )}

      <FlatList
        data={loanProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const bankName = language === 'ta' ? item.bankTamil : item.bank;
          const loanType = language === 'ta' ? item.typeTamil : item.type;
          const eligibilityList = language === 'ta' ? item.eligibilityTamil : item.eligibility;
          return (
            <View style={styles.loanCard}>
              <View style={styles.loanHeader}>
                <View style={styles.loanHeaderLeft}>
                  <Text style={styles.bankName} numberOfLines={2}>{bankName}</Text>
                  <Text style={styles.loanType} numberOfLines={1}>{loanType}</Text>
                </View>
                <View style={styles.rateBadge}>
                  <Text style={styles.rateText}>{item.interestRate}</Text>
                </View>
              </View>

              <View style={styles.loanDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('loanAmount')}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    ₹{(item.minAmount / 1000).toFixed(0)}K - ₹{(item.maxAmount / 1000).toFixed(0)}K
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('tenure')}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {item.minTenureMonths}-{item.maxTenureMonths} {language === 'ta' ? 'மா' : 'mo'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('processingFee')}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{item.processingFee}</Text>
                </View>
              </View>

              <View style={styles.eligibilityPreview}>
                <Text style={styles.eligibilityLabel}>{t('eligibility')}:</Text>
                {eligibilityList.slice(0, 2).map((e, idx) => (
                  <Text key={idx} style={styles.eligibilityItem} numberOfLines={2}>
                    {'\u2022'} {e}
                  </Text>
                ))}
              </View>

              <View style={styles.loanFooter}>
                <Text style={styles.sourceText} numberOfLines={1}>
                  {t('source')}: {item.source.split(' — ')[0]}
                </Text>
                <Text style={styles.verifiedText}>
                  {t('lastVerified')}: {item.lastVerified}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('loanAmountLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`₹${item.minAmount.toLocaleString('en-IN')}`}
                    placeholderTextColor={Colors.neutral[400]}
                    keyboardType="numeric"
                    value={amountByLoan[item.id] || ''}
                    onChangeText={(v) => setAmountByLoan((prev) => ({ ...prev, [item.id]: v }))}
                    accessibilityLabel={`Loan amount for ${item.type}`}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('tenureLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`${item.minTenureMonths} mo`}
                    placeholderTextColor={Colors.neutral[400]}
                    keyboardType="numeric"
                    value={tenureByLoan[item.id] || ''}
                    onChangeText={(v) => setTenureByLoan((prev) => ({ ...prev, [item.id]: v }))}
                    accessibilityLabel={`Tenure for ${item.type}`}
                  />
                </View>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.checkButton, { flex: 1 }]}
                  onPress={() => handleCheckEligibility(item)}
                >
                  <Text style={styles.checkButtonText}>{t('checkEligibility')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.applyButton, { flex: 1 }, applying && { opacity: 0.6 }]}
                  onPress={() => handleApplyLoan(item)}
                  disabled={applying}
                >
                  <Text style={styles.applyButtonText}>{t('applyForLoan')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <>
            <DisclaimerBanner />
            <View style={{ height: 40 }} />
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      <Modal
        visible={showEligibility}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEligibility(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('loanEligibility')}</Text>
            <TouchableOpacity onPress={() => setShowEligibility(false)} style={styles.closeButton}>
              <X size={22} color={Colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
            {!profile ? (
              <View style={styles.noProfileModal}>
                <Info size={40} color={Colors.accent[500]} />
                <Text style={styles.noProfileModalText}>{t('profileRequired')}</Text>
              </View>
            ) : eligibilityResult ? (
              <>
                <View style={styles.resultHeader}>
                  {renderEligibilityIcon(eligibilityResult.eligibility_status)}
                  <Text
                    style={[styles.resultStatus, { color: getEligibilityColor(eligibilityResult.eligibility_status) }]}
                  >
                    {getEligibilityLabel(eligibilityResult.eligibility_status)}
                  </Text>
                  <View style={[styles.riskBadge, { backgroundColor: getEligibilityColor(eligibilityResult.eligibility_status) + '20' }]}>
                    <Text style={[styles.riskText, { color: getEligibilityColor(eligibilityResult.eligibility_status) }]}>
                      {getRiskLabel(eligibilityResult.risk_level)}
                    </Text>
                  </View>
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>{t('eligibilityScore')}</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreFill,
                        {
                          width: `${eligibilityResult.eligibility_score}%`,
                          backgroundColor: getEligibilityColor(eligibilityResult.eligibility_status),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreValue}>{eligibilityResult.eligibility_score}/100</Text>
                </View>

                {emiPreview && (
                  <View style={styles.emiPreviewBox}>
                    <Text style={styles.emiPreviewLabel}>{t('monthlyEMI')}</Text>
                    <Text style={styles.emiPreviewValue}>
                      ₹{Math.round(emiPreview.emi).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.emiPreviewSub}>
                      {t('totalInterest')}: ₹{Math.round(emiPreview.totalInterest).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                <View style={styles.factorsSection}>
                  <Text style={styles.factorsTitle}>{t('factorsAffecting')}</Text>
                  {eligibilityResult.factors.map((factor, idx) => (
                    <View key={idx} style={styles.factorItem}>
                      <View style={styles.factorIconContainer}>
                        {factor.impact === 'positive' ? (
                          <TrendingUp size={18} color={Colors.success[600]} />
                        ) : factor.impact === 'negative' ? (
                          <TrendingDown size={18} color={Colors.error[500]} />
                        ) : (
                          <Minus size={18} color={Colors.neutral[400]} />
                        )}
                      </View>
                      <View style={styles.factorContent}>
                        <Text style={styles.factorName}>
                          {language === 'ta' ? factor.factorTamil : factor.factor}
                        </Text>
                        <Text style={styles.factorExplanation}>
                          {language === 'ta' ? factor.explanationTamil : factor.explanation}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {eligibilityResult.recommendations.length > 0 && (
                  <View style={styles.recommendationsSection}>
                    <Text style={styles.recommendationsTitle}>{t('recommendations')}</Text>
                    {eligibilityResult.recommendations.map((rec, idx) => (
                      <View key={idx} style={styles.recommendationItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.aiDisclaimerBox}>
                  <Info size={14} color={Colors.warning[600]} />
                  <Text style={styles.aiDisclaimerText}>{t('aiEstimateOnly')}</Text>
                </View>

                {/* ─── ML Analysis Section ─── */}
                <View style={mlStyles.mlDivider}>
                  <View style={mlStyles.mlDividerLine} />
                  <Brain size={16} color={Colors.accent[500]} />
                  <Text style={mlStyles.mlDividerText}>{t('mlAnalysisTitle')}</Text>
                  <View style={mlStyles.mlDividerLine} />
                </View>

                {!showMlSection ? (
                  <TouchableOpacity
                    style={mlStyles.mlRunButton}
                    onPress={handleRunMLAnalysis}
                  >
                    <Sparkles size={18} color="#fff" />
                    <Text style={mlStyles.mlRunButtonText}>{t('mlRunAnalysis')}</Text>
                  </TouchableOpacity>
                ) : mlAnalyzing ? (
                  <View style={mlStyles.mlLoadingContainer}>
                    <Brain size={32} color={Colors.accent[400]} />
                    <Text style={mlStyles.mlLoadingText}>{t('mlAnalyzing')}</Text>
                    <Text style={mlStyles.mlSubText}>{t('mlAnalysisSubtitle')}</Text>
                  </View>
                ) : mlResult ? (
                  <View style={mlStyles.mlResultContainer}>
                    {/* ML Eligibility Score */}
                    <View style={mlStyles.mlScoreCard}>
                      <View style={mlStyles.mlScoreHeader}>
                        {getMLCategoryIcon(mlResult.category)}
                        <View style={mlStyles.mlScoreInfo}>
                          <Text style={[mlStyles.mlCategoryLabel, { color: getMLCategoryColor(mlResult.category) }]}>
                            {getMLCategoryLabel(mlResult.category)}
                          </Text>
                          <Text style={mlStyles.mlScoreSubLabel}>{t('mlEligibilityLikelihood')}</Text>
                        </View>
                        <View style={[mlStyles.mlPercentBadge, { backgroundColor: getMLCategoryColor(mlResult.category) + '18' }]}>
                          <Text style={[mlStyles.mlPercentText, { color: getMLCategoryColor(mlResult.category) }]}>
                            {mlResult.eligibilityPercent}%
                          </Text>
                        </View>
                      </View>
                      <View style={mlStyles.mlProgressBar}>
                        <View
                          style={[
                            mlStyles.mlProgressFill,
                            {
                              width: `${mlResult.eligibilityPercent}%`,
                              backgroundColor: getMLCategoryColor(mlResult.category),
                            },
                          ]}
                        />
                      </View>
                      <Text style={mlStyles.mlModelInfoText}>{t('mlModelInfo')}</Text>
                    </View>

                    {/* Positive Factors */}
                    {mlResult.positiveFactors.length > 0 && (
                      <View style={mlStyles.mlFactorsSection}>
                        <Text style={[mlStyles.mlFactorsTitle, { color: Colors.success[700] }]}>
                          {t('mlPositiveFactors')}
                        </Text>
                        {mlResult.positiveFactors.map((factor, idx) => (
                          <View key={`pos-${idx}`} style={mlStyles.mlFactorItem}>
                            <TrendingUp size={16} color={Colors.success[600]} style={{ marginTop: 2 }} />
                            <View style={mlStyles.mlFactorContent}>
                              <Text style={mlStyles.mlFactorName}>
                                {language === 'ta' ? factor.factorTamil : factor.factor}
                              </Text>
                              <Text style={mlStyles.mlFactorExplanation}>
                                {language === 'ta' ? factor.explanationTamil : factor.explanation}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Risk Factors */}
                    {mlResult.riskFactors.length > 0 && (
                      <View style={mlStyles.mlFactorsSection}>
                        <Text style={[mlStyles.mlFactorsTitle, { color: Colors.error[600] }]}>
                          {t('mlRiskFactors')}
                        </Text>
                        {mlResult.riskFactors.map((factor, idx) => (
                          <View key={`risk-${idx}`} style={mlStyles.mlFactorItem}>
                            <TrendingDown size={16} color={Colors.error[500]} style={{ marginTop: 2 }} />
                            <View style={mlStyles.mlFactorContent}>
                              <Text style={mlStyles.mlFactorName}>
                                {language === 'ta' ? factor.factorTamil : factor.factor}
                              </Text>
                              <Text style={mlStyles.mlFactorExplanation}>
                                {language === 'ta' ? factor.explanationTamil : factor.explanation}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Recommended Loan */}
                    {mlResult.recommendedLoan && (
                      <View style={mlStyles.mlRecommendationCard}>
                        <View style={mlStyles.mlRecHeader}>
                          <View style={mlStyles.mlRecBadge}>
                            <Text style={mlStyles.mlRecBadgeText}>{t('mlBestMatch')}</Text>
                          </View>
                          <Text style={mlStyles.mlRecTitle}>{t('mlRecommendedLoan')}</Text>
                        </View>
                        <Text style={mlStyles.mlRecBank}>
                          {language === 'ta' ? mlResult.recommendedLoan.loan.bankTamil : mlResult.recommendedLoan.loan.bank}
                        </Text>
                        <Text style={mlStyles.mlRecType}>
                          {language === 'ta' ? mlResult.recommendedLoan.loan.typeTamil : mlResult.recommendedLoan.loan.type}
                        </Text>
                        <Text style={mlStyles.mlRecRate}>{mlResult.recommendedLoan.loan.interestRate}</Text>
                        <View style={mlStyles.mlRecReasonBox}>
                          <ArrowRight size={14} color={Colors.accent[600]} />
                          <Text style={mlStyles.mlRecReasonText}>
                            {language === 'ta' ? mlResult.recommendedLoan.reasonTamil : mlResult.recommendedLoan.reason}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Alternative Loan */}
                    {mlResult.alternativeLoan && mlResult.category !== 'likely_eligible' && (
                      <View style={[mlStyles.mlRecommendationCard, { borderColor: Colors.warning[200], backgroundColor: Colors.warning[50] + '40' }]}>
                        <View style={mlStyles.mlRecHeader}>
                          <View style={[mlStyles.mlRecBadge, { backgroundColor: Colors.warning[100] }]}>
                            <Text style={[mlStyles.mlRecBadgeText, { color: Colors.warning[700] }]}>{t('mlAlternative')}</Text>
                          </View>
                          <Text style={mlStyles.mlRecTitle}>{t('mlAlternativeLoan')}</Text>
                        </View>
                        <Text style={mlStyles.mlRecBank}>
                          {language === 'ta' ? mlResult.alternativeLoan.loan.bankTamil : mlResult.alternativeLoan.loan.bank}
                        </Text>
                        <Text style={mlStyles.mlRecType}>
                          {language === 'ta' ? mlResult.alternativeLoan.loan.typeTamil : mlResult.alternativeLoan.loan.type}
                        </Text>
                        <View style={mlStyles.mlRecReasonBox}>
                          <ArrowRight size={14} color={Colors.warning[600]} />
                          <Text style={mlStyles.mlRecReasonText}>
                            {language === 'ta' ? mlResult.alternativeLoan.reasonTamil : mlResult.alternativeLoan.reason}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Suggested Amount Range */}
                    {mlResult.suggestedAmountRange && (
                      <View style={mlStyles.mlAmountCard}>
                        <Text style={mlStyles.mlAmountTitle}>{t('mlSuggestedAmount')}</Text>
                        <Text style={mlStyles.mlAmountValue}>
                          {`\u20B9${mlResult.suggestedAmountRange.min.toLocaleString('en-IN')} — \u20B9${mlResult.suggestedAmountRange.max.toLocaleString('en-IN')}`}
                        </Text>
                        <Text style={mlStyles.mlAmountSub}>{t('mlSuggestedRange')}</Text>
                        <Text style={mlStyles.mlAmountDisclaimer}>{t('mlFinalDecision')}</Text>
                      </View>
                    )}

                    {/* Required Documents */}
                    {mlResult.documents.length > 0 && (
                      <View style={mlStyles.mlDocumentsCard}>
                        <View style={mlStyles.mlDocHeader}>
                          <FileText size={16} color={Colors.accent[600]} />
                          <Text style={mlStyles.mlDocTitle}>{t('mlRequiredDocuments')}</Text>
                        </View>
                        {mlResult.documents.map((doc, idx) => (
                          <View key={idx} style={mlStyles.mlDocItem}>
                            <CheckCircle size={14} color={Colors.success[500]} />
                            <Text style={mlStyles.mlDocText}>
                              {language === 'ta' ? doc.nameTamil : doc.name}
                            </Text>
                          </View>
                        ))}
                        <Text style={mlStyles.mlDocDisclaimer}>{t('mlDocumentDisclaimer')}</Text>
                      </View>
                    )}

                    {/* ML Disclaimer */}
                    <View style={mlStyles.mlDisclaimerBox}>
                      <Shield size={14} color={Colors.accent[600]} />
                      <Text style={mlStyles.mlDisclaimerText}>{t('mlDisclaimer')}</Text>
                    </View>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.modalApplyBtn, applying && { opacity: 0.6 }]}
                  onPress={() => selectedLoan && handleApplyLoan(selectedLoan)}
                  disabled={applying}
                >
                  <Text style={styles.modalApplyBtnText}>
                    {applying ? t('loading') : `${t('submitApplication')} (${selectedLoan?.bank})`}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('loading')}</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Loan Application Submitted Confirmation Modal */}
      <Modal
        visible={!!submittedApplicationId}
        animationType="fade"
        transparent
        onRequestClose={() => setSubmittedApplicationId(null)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <CheckCircle size={48} color={Colors.success[600]} />
            <Text style={styles.successModalTitle}>{t('applicationSubmitted')}</Text>
            <Text style={styles.successModalSub}>{t('applicationSubmittedDesc')}</Text>
            <View style={styles.refBox}>
              <Text style={styles.refBoxLabel}>Database Reference ID:</Text>
              <Text style={styles.refBoxVal}>{submittedApplicationId}</Text>
            </View>
            <TouchableOpacity
              style={styles.successModalBtn}
              onPress={() => setSubmittedApplicationId(null)}
            >
              <Text style={styles.successModalBtnText}>OK</Text>
            </TouchableOpacity>
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
  noProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent[50],
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  noProfileText: {
    fontSize: 13,
    color: Colors.accent[700],
    flex: 1,
    flexShrink: 1,
  },
  loanCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  loanHeaderLeft: {
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: 2,
    flexShrink: 1,
  },
  loanType: {
    fontSize: 13,
    color: Colors.neutral[500],
    flexShrink: 1,
  },
  rateBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    flexShrink: 0,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  loanDetails: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.neutral[500],
    flexShrink: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[800],
    textAlign: 'right',
    flexShrink: 1,
  },
  eligibilityPreview: {
    marginBottom: 10,
  },
  eligibilityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 4,
  },
  eligibilityItem: {
    fontSize: 12,
    color: Colors.neutral[500],
    lineHeight: 18,
  },
  loanFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    marginBottom: 12,
    gap: 2,
  },
  sourceText: {
    fontSize: 11,
    color: Colors.neutral[400],
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.neutral[400],
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.neutral[800],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  checkButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkButtonText: {
    color: Colors.neutral[0],
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: Colors.accent[600],
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.neutral[0],
    fontSize: 14,
    fontWeight: '700',
  },
  modalApplyBtn: {
    backgroundColor: Colors.accent[600],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.accent[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalApplyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral[900],
    marginTop: 14,
    textAlign: 'center',
  },
  successModalSub: {
    fontSize: 13,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  refBox: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: 'center',
  },
  refBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral[500],
  },
  refBoxVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[700],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 3,
  },
  successModalBtn: {
    backgroundColor: Colors.primary[600],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  successModalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  noProfileModal: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  noProfileModalText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: '700',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  riskText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreContainer: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  scoreBar: {
    height: 10,
    backgroundColor: Colors.neutral[200],
    borderRadius: 5,
    marginBottom: 6,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 5,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral[800],
    textAlign: 'right',
  },
  emiPreviewBox: {
    backgroundColor: Colors.primary[50],
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  emiPreviewLabel: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  emiPreviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  emiPreviewSub: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  factorsSection: {
    marginBottom: 16,
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: 10,
  },
  factorItem: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[0],
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: 10,
  },
  factorIconContainer: {
    marginTop: 2,
  },
  factorContent: {
    flex: 1,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  factorExplanation: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 19,
  },
  recommendationsSection: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[500],
    marginTop: 7,
  },
  recommendationText: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 19,
    flex: 1,
  },
  aiDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.warning[200],
  },
  aiDisclaimerText: {
    fontSize: 12,
    color: Colors.warning[700],
    flex: 1,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: Colors.neutral[400],
  },
});

// ─── ML Analysis Styles ──────────────────────────────────────────────────────

const mlStyles = StyleSheet.create({
  mlDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 14,
  },
  mlDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.accent[200],
  },
  mlDividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent[600],
    letterSpacing: 0.3,
  },
  mlRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent[600],
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: Colors.accent[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  mlRunButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  mlLoadingContainer: {
    alignItems: 'center',
    padding: 30,
    gap: 10,
  },
  mlLoadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent[600],
  },
  mlSubText: {
    fontSize: 12,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  mlResultContainer: {
    gap: 12,
  },
  mlScoreCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mlScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mlScoreInfo: {
    flex: 1,
  },
  mlCategoryLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  mlScoreSubLabel: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  mlPercentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  mlPercentText: {
    fontSize: 20,
    fontWeight: '800',
  },
  mlProgressBar: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  mlProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  mlModelInfoText: {
    fontSize: 11,
    color: Colors.neutral[400],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mlFactorsSection: {
    gap: 6,
  },
  mlFactorsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  mlFactorItem: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[0],
    borderRadius: 8,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  mlFactorContent: {
    flex: 1,
  },
  mlFactorName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: 2,
  },
  mlFactorExplanation: {
    fontSize: 12,
    color: Colors.neutral[600],
    lineHeight: 17,
  },
  mlRecommendationCard: {
    backgroundColor: Colors.accent[50] + '60',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  mlRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mlRecBadge: {
    backgroundColor: Colors.accent[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mlRecBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mlRecTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral[700],
    flex: 1,
  },
  mlRecBank: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  mlRecType: {
    fontSize: 13,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  mlRecRate: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: 8,
  },
  mlRecReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.neutral[0],
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  mlRecReasonText: {
    fontSize: 12,
    color: Colors.neutral[600],
    lineHeight: 17,
    flex: 1,
  },
  mlAmountCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  mlAmountTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginBottom: 6,
  },
  mlAmountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary[700],
    marginBottom: 4,
  },
  mlAmountSub: {
    fontSize: 11,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  mlAmountDisclaimer: {
    fontSize: 10,
    color: Colors.neutral[400],
    fontStyle: 'italic',
    textAlign: 'center',
  },
  mlDocumentsCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  mlDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mlDocTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[800],
  },
  mlDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  mlDocText: {
    fontSize: 13,
    color: Colors.neutral[700],
    flex: 1,
  },
  mlDocDisclaimer: {
    fontSize: 11,
    color: Colors.neutral[400],
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  mlDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accent[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  mlDisclaimerText: {
    fontSize: 11,
    color: Colors.accent[700],
    flex: 1,
    lineHeight: 16,
  },
});
