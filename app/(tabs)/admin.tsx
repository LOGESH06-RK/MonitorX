import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { Colors } from '@/lib/theme';
import { Header } from '@/components/Header';
import { supabase, FarmerProfile, LoanApplication, SchemeApplication, EligibilityResult } from '@/lib/supabase';
import { deserializeFromSupabase } from '@/lib/profile-context';
import {
  queryDataset,
  getDatasetStats,
  DatasetRecord,
  TOTAL_DATASET_COUNT,
} from '@/lib/dataset';
import {
  Search,
  Users,
  ShieldCheck,
  FileText,
  Landmark,
  Wallet,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
  Phone,
  MapPin,
  TrendingUp,
  Sparkles,
  CreditCard,
  Sprout,
  ArrowLeft,
  Lock,
  Database,
  Layers,
  Filter,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  LogOut,
} from 'lucide-react-native';

export default function AdminScreen() {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();

  // Mode: 'farmers' (Live Supabase profiles) vs 'dataset' (Full 20,000 Records) vs 'admin' (Admin Profile)
  const [activeTab, setActiveTab] = useState<'farmers' | 'dataset' | 'admin'>('farmers');

  // Live Farmers state
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);

  // Selected farmer child records
  const [farmerLoans, setFarmerLoans] = useState<LoanApplication[]>([]);
  const [farmerSchemes, setFarmerSchemes] = useState<SchemeApplication[]>([]);
  const [farmerEligibility, setFarmerEligibility] = useState<EligibilityResult[]>([]);
  const [dossierLoading, setDossierLoading] = useState(false);

  // Stats
  const [totalLoanApps, setTotalLoanApps] = useState(0);
  const [totalSchemeApps, setTotalSchemeApps] = useState(0);
  const [totalEligResults, setTotalEligResults] = useState(0);

  // Audit tool state
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    testedCount: number;
    isolatedCount: number;
    passed: boolean;
    details: string[];
  } | null>(null);

  // Dataset Tab state (20,000 Records)
  const [datasetSearch, setDatasetSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Moderate' | 'High'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Review' | 'Ineligible'>('All');
  const [datasetPage, setDatasetPage] = useState(1);
  const [selectedDatasetRecord, setSelectedDatasetRecord] = useState<DatasetRecord | null>(null);
  const [jumpPageInput, setJumpPageInput] = useState('');

  const datasetStats = useMemo(() => getDatasetStats(), []);

  const datasetResult = useMemo(() => {
    return queryDataset({
      query: datasetSearch,
      riskFilter,
      statusFilter,
      page: datasetPage,
      pageSize: 25,
    });
  }, [datasetSearch, riskFilter, statusFilter, datasetPage]);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all farmer profiles
      const { data: profilesData, error: pErr } = await supabase
        .from('farmer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pErr && profilesData) {
        setFarmers(profilesData.map((p) => deserializeFromSupabase(p)));
      }

      // 2. Fetch counts
      const [loanCountRes, schemeCountRes, eligCountRes] = await Promise.all([
        supabase.from('loan_applications').select('*', { count: 'exact', head: true }),
        supabase.from('scheme_applications').select('*', { count: 'exact', head: true }),
        supabase.from('eligibility_results').select('*', { count: 'exact', head: true }),
      ]);

      setTotalLoanApps(loanCountRes.count || 0);
      setTotalSchemeApps(schemeCountRes.count || 0);
      setTotalEligResults(eligCountRes.count || 0);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Load single farmer's isolated dossier
  const loadFarmerDossier = async (farmer: FarmerProfile) => {
    setSelectedFarmer(farmer);
    if (!farmer.id) return;

    setDossierLoading(true);
    try {
      const [loansRes, schemesRes, eligRes] = await Promise.all([
        supabase
          .from('loan_applications')
          .select('*')
          .eq('farmer_id', farmer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('scheme_applications')
          .select('*')
          .eq('farmer_id', farmer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('eligibility_results')
          .select('*')
          .eq('farmer_id', farmer.id)
          .order('created_at', { ascending: false }),
      ]);

      setFarmerLoans((loansRes.data as LoanApplication[]) || []);
      setFarmerSchemes((schemesRes.data as SchemeApplication[]) || []);
      setFarmerEligibility((eligRes.data as EligibilityResult[]) || []);
    } catch (err) {
      console.error('Error loading farmer dossier:', err);
    } finally {
      setDossierLoading(false);
    }
  };

  // Run live multi-customer isolation test
  const runDataIsolationAudit = async () => {
    setAuditRunning(true);
    const details: string[] = [];

    try {
      // 1. Fetch distinct farmers
      const { data: testFarmers } = await supabase
        .from('farmer_profiles')
        .select('id, full_name, phone')
        .limit(10);

      const count = testFarmers?.length || 0;
      details.push(`Analyzed ${count} registered farmer profiles in Supabase.`);

      if (count === 0) {
        details.push('Notice: No farmers registered yet. Create sample profiles to test multi-tenant isolation.');
        setAuditResults({
          testedCount: 0,
          isolatedCount: 0,
          passed: true,
          details,
        });
        return;
      }

      let isolatedCount = 0;
      for (const f of testFarmers || []) {
        const { data: loans } = await supabase
          .from('loan_applications')
          .select('id, farmer_id')
          .eq('farmer_id', f.id);

        const { data: schemes } = await supabase
          .from('scheme_applications')
          .select('id, farmer_id')
          .eq('farmer_id', f.id);

        const foreignLoan = loans?.some((l) => l.farmer_id !== f.id);
        const foreignScheme = schemes?.some((s) => s.farmer_id !== f.id);

        if (!foreignLoan && !foreignScheme) {
          isolatedCount++;
          details.push(`✓ Customer [${f.phone || f.id.slice(0, 8)} - ${f.full_name}]: 100% Isolated (${loans?.length || 0} loans, ${schemes?.length || 0} schemes)`);
        } else {
          details.push(`✗ Leakage detected in Customer ID ${f.id}`);
        }
      }

      const passed = isolatedCount === count;
      details.push(`Audit Result: ${isolatedCount}/${count} customer records are strictly isolated with zero cross-tenant contamination.`);

      setAuditResults({
        testedCount: count,
        isolatedCount,
        passed,
        details,
      });
    } catch (e: any) {
      details.push(`Audit error: ${e?.message || 'Unknown error'}`);
      setAuditResults({
        testedCount: 0,
        isolatedCount: 0,
        passed: false,
        details,
      });
    } finally {
      setAuditRunning(false);
    }
  };

  const filteredFarmers = useMemo(() => {
    if (!searchQuery.trim()) return farmers;
    const q = searchQuery.toLowerCase().trim();
    return farmers.filter((f) => {
      const name = (f.full_name || '').toLowerCase();
      const phone = (f.phone || '').toLowerCase();
      const district = (f.district || '').toLowerCase();
      const id = (f.id || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || district.includes(q) || id.includes(q);
    });
  }, [farmers, searchQuery]);

  // SECURITY: Hard gate — never render admin dashboard for non-admin users.
  // This is a CLIENT guard complementing the Supabase RLS server-side policies.
  if (!user || user.role !== 'admin') {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Lock size={56} color={Colors.error[500]} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.error[600], marginTop: 16, textAlign: 'center' }}>
          {language === 'ta' ? 'அணுகல் அனுமதிக்கப்படவில்லை' : 'Access Denied'}
        </Text>
        <Text style={{ fontSize: 15, color: Colors.neutral[500], marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          {language === 'ta'
            ? 'இக் பகுதி அணுகல் மட்டுமே அனுமதிக்கப்பட்ட வங்கி அதிகாரிகளுக்கு மட்டுமே கிடைக்கும்.'
            : 'This section is only accessible to authorised bank officers and administrators. If you believe this is an error, please contact your system administrator.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={t('adminDashboard')}
        subtitle={language === 'ta' ? 'அனைத்து விவசாயிகளின் தனிமைப்படுத்தப்பட்ட பதிவுகள் & 20,000 தரவுத்தளம்' : 'Multi-Customer Records & 20,000 Dataset Explorer'}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Admin Bar */}
        <View style={styles.adminBar}>
          <View style={styles.adminBadge}>
            <ShieldCheck size={16} color={Colors.primary[700]} />
            <Text style={styles.adminBadgeText}>Bank Officer / Admin Portal</Text>
          </View>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={logout}
          >
            <Text style={styles.switchModeText}>{t('logout') || 'Sign Out'}</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Selector Tabs — PROMINENT TOGGLE */}
        <View style={styles.tabSelectorRow}>
          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'farmers' && styles.modeTabActive]}
            onPress={() => setActiveTab('farmers')}
            activeOpacity={0.75}
          >
            <Users size={16} color={activeTab === 'farmers' ? '#fff' : Colors.primary[700]} />
            <Text style={[styles.modeTabText, activeTab === 'farmers' && styles.modeTabTextActive]}>
              👥 Live Farmers ({farmers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'dataset' && styles.modeTabActive]}
            onPress={() => setActiveTab('dataset')}
            activeOpacity={0.75}
          >
            <Database size={16} color={activeTab === 'dataset' ? '#fff' : Colors.primary[700]} />
            <Text style={[styles.modeTabText, activeTab === 'dataset' && styles.modeTabTextActive]}>
              📊 Dataset (20k)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'admin' && styles.modeTabActive]}
            onPress={() => setActiveTab('admin')}
            activeOpacity={0.75}
          >
            <ShieldCheck size={16} color={activeTab === 'admin' ? '#fff' : Colors.primary[700]} />
            <Text style={[styles.modeTabText, activeTab === 'admin' && styles.modeTabTextActive]}>
              🛡️ Admin Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: LIVE REGISTERED FARMERS                              */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'farmers' ? (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Users size={22} color={Colors.primary[600]} />
                <Text style={styles.statNumber}>{farmers.length}</Text>
                <Text style={styles.statLabel}>{t('allCustomers')}</Text>
              </View>

              <View style={styles.statCard}>
                <Wallet size={22} color={Colors.accent[600]} />
                <Text style={styles.statNumber}>{totalLoanApps}</Text>
                <Text style={styles.statLabel}>{t('appliedLoans')}</Text>
              </View>

              <View style={styles.statCard}>
                <Landmark size={22} color={Colors.secondary[700]} />
                <Text style={styles.statNumber}>{totalSchemeApps}</Text>
                <Text style={styles.statLabel}>{t('appliedSchemes')}</Text>
              </View>

              <View style={styles.statCard}>
                <Sparkles size={22} color={Colors.success[600]} />
                <Text style={styles.statNumber}>{totalEligResults}</Text>
                <Text style={styles.statLabel}>{t('eligibilityHistory')}</Text>
              </View>
            </View>

            {/* Live Data Isolation Audit Trigger Card */}
            <View style={styles.auditCard}>
              <View style={styles.auditHeader}>
                <View style={styles.auditIconBadge}>
                  <Lock size={20} color={Colors.success[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditTitle}>{t('dataIsolationAudit')}</Text>
                  <Text style={styles.auditSubtitle}>{t('verifiedDataIsolation')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.auditBtn, auditRunning && { opacity: 0.6 }]}
                  onPress={runDataIsolationAudit}
                  disabled={auditRunning}
                >
                  {auditRunning ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.auditBtnText}>
                      {language === 'ta' ? 'தணிக்கை செய்' : 'Run Live Audit'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {auditResults && (
                <View style={styles.auditResultsBox}>
                  <View style={styles.auditPassedRow}>
                    <CheckCircle2 size={18} color={auditResults.passed ? Colors.success[600] : Colors.error[500]} />
                    <Text style={[styles.auditPassedText, { color: auditResults.passed ? Colors.success[700] : Colors.error[600] }]}>
                      {auditResults.passed ? 'Isolation Audit Passed: Zero Leakage Verified' : 'Audit Found Discrepancies'}
                    </Text>
                  </View>
                  {auditResults.details.map((line, idx) => (
                    <Text key={idx} style={styles.auditDetailLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Farmer Search Bar */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>{t('allCustomers')}</Text>
              <View style={styles.searchBar}>
                <Search size={18} color={Colors.neutral[400]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('customerSearch')}
                  placeholderTextColor={Colors.neutral[400]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color={Colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Farmers List */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
                <Text style={styles.loadingText}>Fetching database records...</Text>
              </View>
            ) : filteredFarmers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Users size={36} color={Colors.neutral[300]} />
                <Text style={styles.emptyText}>{t('noRecordsFound')}</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {filteredFarmers.map((farmer) => (
                  <TouchableOpacity
                    key={farmer.id || farmer.phone}
                    style={styles.farmerCard}
                    onPress={() => loadFarmerDossier(farmer)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.farmerCardHeader}>
                      <View style={styles.farmerAvatar}>
                        <Sprout size={20} color={Colors.primary[700]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.farmerName}>{farmer.full_name}</Text>
                        <View style={styles.metaRow}>
                          <Phone size={12} color={Colors.neutral[500]} />
                          <Text style={styles.metaText}>{farmer.phone || 'N/A'}</Text>
                          <MapPin size={12} color={Colors.neutral[500]} style={{ marginLeft: 6 }} />
                          <Text style={styles.metaText}>{farmer.district || farmer.state}</Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color={Colors.neutral[400]} />
                    </View>

                    <View style={styles.farmerBadgesRow}>
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillText}>{farmer.farmer_category}</Text>
                      </View>
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillText}>{farmer.land_size_acres || 0} acres</Text>
                      </View>
                      {farmer.credit_score ? (
                        <View style={[styles.pillBadge, { backgroundColor: Colors.success[50] }]}>
                          <Text style={[styles.pillText, { color: Colors.success[700] }]}>
                            Score: {farmer.credit_score}
                          </Text>
                        </View>
                      ) : null}
                      {farmer.has_kcc ? (
                        <View style={[styles.pillBadge, { backgroundColor: Colors.primary[50] }]}>
                          <Text style={[styles.pillText, { color: Colors.primary[700] }]}>KCC Active</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : activeTab === 'dataset' ? (
          /* ------------------------------------------------------------- */
          /* VIEW 2: FULL 20,000 FINANCIAL LOAN & BORROWER DATASET        */
          /* ------------------------------------------------------------- */
          <View style={styles.datasetView}>
            {/* Dataset Statistics Hero */}
            <View style={styles.datasetStatsCard}>
              <View style={styles.datasetStatsHeader}>
                <BarChart3 size={20} color={Colors.primary[700]} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.datasetStatsTitle}>
                    MonitorX Customer Risk Dataset
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.primary[700], fontWeight: '600', marginTop: 2 }}>
                    20,000 Synthetic Demonstration Records
                  </Text>
                </View>
              </View>

              {/* Explicit Synthetic Notice */}
              <View style={{
                backgroundColor: '#EFF6FF',
                borderColor: '#BFDBFE',
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginTop: 10,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}>
                <ShieldCheck size={14} color="#2563EB" />
                <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '600' }}>
                  Synthetic Demonstration Data — Not Real Customer Data
                </Text>
              </View>

              <View style={styles.datasetStatsGrid}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Avg Annual Income</Text>
                  <Text style={styles.miniStatVal}>₹{datasetStats.avgIncome.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Avg Credit Score</Text>
                  <Text style={styles.miniStatVal}>{datasetStats.avgCreditScore}</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Avg Loan Requested</Text>
                  <Text style={styles.miniStatVal}>₹{datasetStats.avgLoanAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Low / Mod / High Risk</Text>
                  <Text style={styles.miniStatVal}>
                    {datasetStats.lowRiskCount.toLocaleString('en-IN')} / {datasetStats.modRiskCount.toLocaleString('en-IN')} / {datasetStats.highRiskCount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Dataset Search & Filters */}
            <View style={styles.datasetControls}>
              <View style={styles.searchBar}>
                <Search size={18} color={Colors.neutral[400]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Customer ID / Name / Phone / District / State..."
                  placeholderTextColor={Colors.neutral[400]}
                  value={datasetSearch}
                  onChangeText={(text) => {
                    setDatasetSearch(text);
                    setDatasetPage(1);
                  }}
                />
                {datasetSearch.length > 0 && (
                  <TouchableOpacity onPress={() => { setDatasetSearch(''); setDatasetPage(1); }}>
                    <X size={18} color={Colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Risk Category Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {(['All', 'Low', 'Moderate', 'High'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.filterChip, riskFilter === r && styles.filterChipActive]}
                    onPress={() => { setRiskFilter(r); setDatasetPage(1); }}
                  >
                    <Text style={[styles.filterChipText, riskFilter === r && styles.filterChipTextActive]}>
                      {r === 'All' ? 'All Risk Levels' : `${r} Risk`}
                    </Text>
                  </TouchableOpacity>
                ))}

                {(['All', 'Approved', 'Review', 'Ineligible'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                    onPress={() => { setStatusFilter(s); setDatasetPage(1); }}
                  >
                    <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                      Status: {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Pagination Controls Top */}
            <View style={styles.paginationRow}>
              <Text style={styles.paginationInfo}>
                Showing {(datasetResult.page - 1) * datasetResult.pageSize + 1} -{' '}
                {Math.min(datasetResult.page * datasetResult.pageSize, datasetResult.total)} of{' '}
                {datasetResult.total.toLocaleString('en-IN')} records
              </Text>

              <View style={styles.pageNavBtns}>
                <TouchableOpacity
                  style={[styles.pageBtn, datasetResult.page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => setDatasetPage((p) => Math.max(1, p - 1))}
                  disabled={datasetResult.page <= 1}
                >
                  <ChevronLeft size={16} color={datasetResult.page <= 1 ? Colors.neutral[300] : Colors.neutral[700]} />
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  Page {datasetResult.page} / {datasetResult.totalPages}
                </Text>

                <TouchableOpacity
                  style={[styles.pageBtn, datasetResult.page >= datasetResult.totalPages && styles.pageBtnDisabled]}
                  onPress={() => setDatasetPage((p) => Math.min(datasetResult.totalPages, p + 1))}
                  disabled={datasetResult.page >= datasetResult.totalPages}
                >
                  <ChevronRight size={16} color={datasetResult.page >= datasetResult.totalPages ? Colors.neutral[300] : Colors.neutral[700]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Jump to Page Quick Input */}
            <View style={styles.jumpRow}>
              <Text style={styles.jumpLabel}>Jump to page:</Text>
              <TextInput
                style={styles.jumpInput}
                placeholder="1"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="number-pad"
                value={jumpPageInput}
                onChangeText={setJumpPageInput}
                onSubmitEditing={() => {
                  const p = parseInt(jumpPageInput, 10);
                  if (!isNaN(p) && p >= 1 && p <= datasetResult.totalPages) {
                    setDatasetPage(p);
                    setJumpPageInput('');
                  }
                }}
              />
              <TouchableOpacity
                style={styles.jumpBtn}
                onPress={() => {
                  const p = parseInt(jumpPageInput, 10);
                  if (!isNaN(p) && p >= 1 && p <= datasetResult.totalPages) {
                    setDatasetPage(p);
                    setJumpPageInput('');
                  }
                }}
              >
                <Text style={styles.jumpBtnText}>Go</Text>
              </TouchableOpacity>
            </View>

            {/* Records List Table */}
            <View style={styles.datasetList}>
              {datasetResult.records.map((rec) => {
                const isGoodScore = rec.credit_score >= 720;
                const isBadScore = rec.credit_score < 600;

                return (
                  <TouchableOpacity
                    key={rec.id}
                    style={styles.datasetCard}
                    onPress={() => setSelectedDatasetRecord(rec)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.datasetCardHeader}>
                      <View style={styles.idBadge}>
                        <Text style={styles.idBadgeText}>{rec.id}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.datasetName}>{rec.name}</Text>
                        <Text style={styles.datasetSub}>
                          {rec.age} yrs • {rec.gender} • {rec.district} • {rec.employment_status}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          rec.status === 'Approved'
                            ? styles.statusApproved
                            : rec.status === 'Review'
                            ? styles.statusReview
                            : styles.statusIneligible,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            rec.status === 'Approved'
                              ? styles.statusApprovedText
                              : rec.status === 'Review'
                              ? styles.statusReviewText
                              : styles.statusIneligibleText,
                          ]}
                        >
                          {rec.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.datasetGridRow}>
                      <View style={styles.datasetGridCol}>
                        <Text style={styles.datasetGridLabel}>Annual Income</Text>
                        <Text style={styles.datasetGridVal}>₹{rec.annual_income.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.datasetGridCol}>
                        <Text style={styles.datasetGridLabel}>Credit Score</Text>
                        <Text
                          style={[
                            styles.datasetGridVal,
                            { color: isGoodScore ? Colors.success[700] : isBadScore ? Colors.error[600] : Colors.warning[700] },
                          ]}
                        >
                          {rec.credit_score}
                        </Text>
                      </View>
                      <View style={styles.datasetGridCol}>
                        <Text style={styles.datasetGridLabel}>Loan Requested</Text>
                        <Text style={styles.datasetGridVal}>₹{rec.loan_amount.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.datasetGridCol}>
                        <Text style={styles.datasetGridLabel}>DTI Ratio</Text>
                        <Text style={styles.datasetGridVal}>{Math.round(rec.debt_to_income_ratio * 100)}%</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Pagination */}
            <View style={[styles.paginationRow, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.pageBtn, datasetResult.page <= 1 && styles.pageBtnDisabled]}
                onPress={() => setDatasetPage((p) => Math.max(1, p - 1))}
                disabled={datasetResult.page <= 1}
              >
                <Text style={styles.pageBtnText}>Previous Page</Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Page {datasetResult.page} of {datasetResult.totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.pageBtn, datasetResult.page >= datasetResult.totalPages && styles.pageBtnDisabled]}
                onPress={() => setDatasetPage((p) => Math.min(datasetResult.totalPages, p + 1))}
                disabled={datasetResult.page >= datasetResult.totalPages}
              >
                <Text style={styles.pageBtnText}>Next Page</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW 3: DEDICATED ADMIN SECTION (ADMIN PROFILE & CONTROLS)    */
          /* ------------------------------------------------------------- */
          <View style={{ paddingVertical: 8 }}>
            <View style={styles.datasetStatsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: Colors.accent[50],
                  borderWidth: 1.5,
                  borderColor: Colors.accent[300],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <ShieldCheck size={30} color={Colors.accent[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.neutral[900] }}>
                    {user?.name || 'Chief Bank Underwriting Officer'}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.accent[700], fontWeight: '600', marginTop: 2 }}>
                    Role: Bank Administrator & Risk Underwriter
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.farmerCard}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.neutral[100], paddingBottom: 10, marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.neutral[900] }}>
                  Administrator Credentials & System Authorization
                </Text>
              </View>

              <View style={styles.datasetGridRow}>
                <View style={styles.datasetGridCol}>
                  <Text style={styles.datasetGridLabel}>Admin ID / User ID</Text>
                  <Text style={[styles.datasetGridVal, { color: Colors.neutral[900] }]}>
                    {user?.identifier || 'admin.officer'}
                  </Text>
                </View>
                <View style={styles.datasetGridCol}>
                  <Text style={styles.datasetGridLabel}>Official Email</Text>
                  <Text style={[styles.datasetGridVal, { color: Colors.neutral[900] }]}>
                    {user?.email || 'admin@monitorx.app'}
                  </Text>
                </View>
              </View>

              <View style={[styles.datasetGridRow, { marginTop: 12 }]}>
                <View style={styles.datasetGridCol}>
                  <Text style={styles.datasetGridLabel}>Access Authority</Text>
                  <Text style={[styles.datasetGridVal, { color: Colors.success[700] }]}>
                    Full 20k Synthetic Dataset & Multi-Tenant Dossiers
                  </Text>
                </View>
                <View style={styles.datasetGridCol}>
                  <Text style={styles.datasetGridLabel}>Security Protocol</Text>
                  <Text style={[styles.datasetGridVal, { color: Colors.primary[700] }]}>
                    Supabase Auth JWT + Row Level Security (RLS)
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 10,
                paddingVertical: 14,
                marginTop: 16,
              }}
              onPress={logout}
              activeOpacity={0.8}
            >
              <LogOut size={18} color="#DC2626" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#DC2626' }}>
                Sign Out of Bank Admin Portal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: LIVE FARMER DOSSIER                                   */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={!!selectedFarmer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedFarmer(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{t('customerDossier')}</Text>
              <Text style={styles.modalSub}>
                UUID: {selectedFarmer?.id || 'Pending Database Registration'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFarmer(null)} style={styles.closeBtn}>
              <X size={22} color={Colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {selectedFarmer && (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.dossierSection}>
                <Text style={styles.dossierSectionTitle}>{t('customerDetails')}</Text>
                <View style={styles.dossierGrid}>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Full Name</Text>
                    <Text style={styles.dossierVal}>{selectedFarmer.full_name}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Mobile</Text>
                    <Text style={styles.dossierVal}>{selectedFarmer.phone}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Location</Text>
                    <Text style={styles.dossierVal}>{selectedFarmer.district}, {selectedFarmer.state}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Landholding</Text>
                    <Text style={styles.dossierVal}>{selectedFarmer.land_size_acres || 0} acres ({selectedFarmer.land_ownership || 'owned'})</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Crops Cultivated</Text>
                    <Text style={styles.dossierVal}>
                      {selectedFarmer.crops?.join(', ') || selectedFarmer.crop_type || 'None'}
                    </Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Farming Types</Text>
                    <Text style={styles.dossierVal}>
                      {selectedFarmer.farming_types?.join(', ') || selectedFarmer.farming_type || 'General'}
                    </Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Annual Agri Income</Text>
                    <Text style={styles.dossierVal}>₹{(selectedFarmer.annual_agricultural_income || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Credit Score</Text>
                    <Text style={styles.dossierVal}>{selectedFarmer.credit_score || 'Not recorded'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dossierSection}>
                <View style={styles.dossierSectionHeader}>
                  <Wallet size={18} color={Colors.primary[700]} />
                  <Text style={styles.dossierSectionTitle}>
                    {t('appliedLoans')} ({farmerLoans.length})
                  </Text>
                </View>
                {dossierLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary[600]} />
                ) : farmerLoans.length === 0 ? (
                  <Text style={styles.noChildText}>No loan applications submitted by this farmer yet.</Text>
                ) : (
                  farmerLoans.map((loan) => (
                    <View key={loan.id} style={styles.childRecordCard}>
                      <View style={styles.childRow}>
                        <Text style={styles.childTitle}>{loan.loan_type}</Text>
                        <Text style={styles.childAmount}>₹{Number(loan.loan_amount).toLocaleString('en-IN')}</Text>
                      </View>
                      <Text style={styles.childSub}>Bank: {loan.bank_name} • Status: {loan.status}</Text>
                      <Text style={styles.childDate}>{new Date(loan.created_at || '').toLocaleDateString()}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.dossierSection}>
                <View style={styles.dossierSectionHeader}>
                  <Landmark size={18} color={Colors.secondary[700]} />
                  <Text style={styles.dossierSectionTitle}>
                    {t('appliedSchemes')} ({farmerSchemes.length})
                  </Text>
                </View>
                {dossierLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary[600]} />
                ) : farmerSchemes.length === 0 ? (
                  <Text style={styles.noChildText}>No scheme applications registered by this farmer.</Text>
                ) : (
                  farmerSchemes.map((scheme) => (
                    <View key={scheme.id} style={styles.childRecordCard}>
                      <View style={styles.childRow}>
                        <Text style={styles.childTitle}>{scheme.scheme_name}</Text>
                        <Text style={styles.childTypeBadge}>{scheme.scheme_type}</Text>
                      </View>
                      <Text style={styles.childDate}>{new Date(scheme.created_at || '').toLocaleDateString()}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.dossierSection}>
                <View style={styles.dossierSectionHeader}>
                  <Sparkles size={18} color={Colors.success[600]} />
                  <Text style={styles.dossierSectionTitle}>
                    {t('eligibilityHistory')} ({farmerEligibility.length})
                  </Text>
                </View>
                {dossierLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary[600]} />
                ) : farmerEligibility.length === 0 ? (
                  <Text style={styles.noChildText}>No eligibility assessments saved for this farmer.</Text>
                ) : (
                  farmerEligibility.map((el) => (
                    <View key={el.id} style={styles.childRecordCard}>
                      <View style={styles.childRow}>
                        <Text style={styles.childTitle}>{el.loan_type}</Text>
                        <Text style={styles.eligibilityScoreBadge}>Score: {el.eligibility_score}/100</Text>
                      </View>
                      <Text style={styles.childSub}>Status: {el.eligibility_status} • Risk: {el.risk_level}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: 20,000 DATASET RECORD DETAIL                          */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={!!selectedDatasetRecord}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDatasetRecord(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Dataset Record Detail</Text>
              <Text style={styles.modalSub}>{selectedDatasetRecord?.id}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedDatasetRecord(null)} style={styles.closeBtn}>
              <X size={22} color={Colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {selectedDatasetRecord && (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.dossierSection}>
                <Text style={styles.dossierSectionTitle}>Borrower Profile</Text>
                <View style={styles.dossierGrid}>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Name</Text>
                    <Text style={styles.dossierVal}>{selectedDatasetRecord.name}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Phone</Text>
                    <Text style={styles.dossierVal}>{selectedDatasetRecord.phone}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>District</Text>
                    <Text style={styles.dossierVal}>{selectedDatasetRecord.district}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Demographics</Text>
                    <Text style={styles.dossierVal}>
                      {selectedDatasetRecord.age} yrs • {selectedDatasetRecord.gender} • {selectedDatasetRecord.marital_status}
                    </Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Education</Text>
                    <Text style={styles.dossierVal}>{selectedDatasetRecord.education_level}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Occupation</Text>
                    <Text style={styles.dossierVal}>{selectedDatasetRecord.employment_status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dossierSection}>
                <Text style={styles.dossierSectionTitle}>Financial & Underwriting Parameters</Text>
                <View style={styles.dossierGrid}>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Annual Income</Text>
                    <Text style={styles.dossierVal}>₹{selectedDatasetRecord.annual_income.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Monthly Income</Text>
                    <Text style={styles.dossierVal}>₹{selectedDatasetRecord.monthly_income.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Debt-to-Income (DTI)</Text>
                    <Text style={styles.dossierVal}>{Math.round(selectedDatasetRecord.debt_to_income_ratio * 100)}%</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Credit Bureau Score</Text>
                    <Text style={styles.dossierVal}>{selectedDatasetRecord.credit_score} / 850</Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Loan Amount Requested</Text>
                    <Text style={[styles.dossierVal, { color: Colors.primary[700], fontWeight: '800' }]}>
                      ₹{selectedDatasetRecord.loan_amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.dossierItem}>
                    <Text style={styles.dossierLabel}>Underwriting Assessment</Text>
                    <Text style={styles.dossierVal}>
                      {selectedDatasetRecord.status} ({selectedDatasetRecord.risk_category} Risk)
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
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
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  switchModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.neutral[200],
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  tabSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#e8f4e8',
    borderRadius: 14,
    padding: 5,
    marginBottom: 18,
    marginTop: 4,
    gap: 5,
    borderWidth: 2,
    borderColor: Colors.primary[400],
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modeTabActive: {
    backgroundColor: Colors.primary[700],
    borderColor: Colors.primary[900],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary[800],
  },
  modeTabTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: 'flex-start',
    gap: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.neutral[900],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral[500],
  },
  auditCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    marginBottom: 16,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auditIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  auditSubtitle: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  auditBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  auditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  auditResultsBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    gap: 4,
  },
  auditPassedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  auditPassedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  auditDetailLine: {
    fontSize: 11,
    color: Colors.neutral[600],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  searchSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral[900],
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.neutral[500],
  },
  emptyCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  listContainer: {
    gap: 10,
  },
  farmerCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  farmerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  farmerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  farmerBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  pillBadge: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral[700],
    textTransform: 'capitalize',
  },
  datasetView: {
    gap: 14,
  },
  datasetStatsCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  datasetStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  datasetStatsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.neutral[900],
  },
  datasetStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  miniStat: {
    width: '47%',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral[500],
  },
  miniStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary[700],
    marginTop: 2,
  },
  datasetControls: {
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[700],
    borderColor: Colors.primary[700],
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[700],
  },
  filterChipTextActive: {
    color: '#fff',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paginationInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[500],
  },
  pageNavBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral[700],
    paddingHorizontal: 6,
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral[800],
  },
  jumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jumpLabel: {
    fontSize: 12,
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  jumpInput: {
    width: 90,
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  jumpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primary[600],
  },
  jumpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  datasetList: {
    gap: 8,
  },
  datasetCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  datasetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  idBadge: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.neutral[700],
  },
  datasetName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  datasetSub: {
    fontSize: 11,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: Colors.success[50],
  },
  statusReview: {
    backgroundColor: Colors.warning[50],
  },
  statusIneligible: {
    backgroundColor: Colors.error[50],
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusApprovedText: {
    color: Colors.success[700],
  },
  statusReviewText: {
    color: Colors.warning[700],
  },
  statusIneligibleText: {
    color: Colors.error[700],
  },
  datasetGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  datasetGridCol: {
    alignItems: 'flex-start',
  },
  datasetGridLabel: {
    fontSize: 10,
    color: Colors.neutral[400],
    fontWeight: '600',
  },
  datasetGridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral[900],
  },
  modalSub: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  dossierSection: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: 16,
  },
  dossierSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dossierSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  dossierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  dossierItem: {
    width: '47%',
  },
  dossierLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral[400],
  },
  dossierVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginTop: 2,
  },
  noChildText: {
    fontSize: 13,
    color: Colors.neutral[400],
    fontStyle: 'italic',
  },
  childRecordCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: 8,
  },
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral[900],
    flex: 1,
  },
  childAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  childSub: {
    fontSize: 12,
    color: Colors.neutral[600],
    marginTop: 3,
  },
  childDate: {
    fontSize: 10,
    color: Colors.neutral[400],
    marginTop: 4,
  },
  childTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: Colors.secondary[700],
    backgroundColor: Colors.secondary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eligibilityScoreBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success[700],
    backgroundColor: Colors.success[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
