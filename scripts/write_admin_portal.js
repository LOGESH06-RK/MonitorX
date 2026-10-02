
const fs = require('fs');
const path = require('path');

const adminPortal = `/**
 * MonitorX - Professional Admin Portal
 *
 * Completely distinct from the Customer UI (green theme → navy-blue banking theme).
 * Navigation: Dashboard | Applications | Customers | Admin Profile
 */

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
  Alert,
  Platform,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { Colors } from '@/lib/theme';
import { supabase, FarmerProfile, LoanApplication, AdminActivityLog } from '@/lib/supabase';
import { deserializeFromSupabase } from '@/lib/profile-context';
import { schemes } from '@/lib/schemes';
import {
  LayoutDashboard, FileText, Users, User, Search, Bell, LogOut,
  ChevronRight, ChevronLeft, X, Phone, MapPin, CheckCircle2, XCircle,
  Clock, AlertTriangle, Landmark, Wallet, TrendingUp, ShieldCheck,
  Sprout, CreditCard, Lock, Activity, Eye, CheckCircle, Building2,
} from 'lucide-react-native';

// ─── Constants ───────────────────────────────────────────────────────────────
const ADMIN_BLUE = '#1E40AF';
const ADMIN_BLUE_LIGHT = '#EFF6FF';

// ─── Types ───────────────────────────────────────────────────────────────────
type AdminSection = 'dashboard' | 'applications' | 'customers' | 'admin_profile';
type AppStatusFilter = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';

interface LoanAppWithFarmer extends LoanApplication {
  farmer?: FarmerProfile;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => '\u20b9' + Number(n || 0).toLocaleString('en-IN');

const fmtDate = (iso?: string | null) => {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusLabel = (s?: string) => {
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  if (s === 'under_review') return 'Under Review';
  return 'Pending';
};

const statusColors = (s?: string) => {
  if (s === 'approved') return { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' };
  if (s === 'rejected') return { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' };
  if (s === 'under_review') return { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' };
  return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' };
};

const appId = (id?: string) => id ? 'APP-' + id.replace(/-/g, '').slice(0, 5).toUpperCase() : 'APP-?????';

const logActivity = async (adminId: string, adminName: string, actionType: string, description: string, entityType?: string, entityId?: string, metadata?: Record<string, any>) => {
  try {
    await supabase.from('admin_activity_log').insert({ admin_id: adminId, admin_name: adminName, action_type: actionType, description, entity_type: entityType, entity_id: entityId, metadata: metadata || {} });
  } catch { /* non-critical */ }
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status?: string }) => {
  const c = statusColors(status);
  return (
    <View style={[S.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[S.badgeText, { color: c.text }]}>{statusLabel(status)}</Text>
    </View>
  );
};

const StatCard = ({ icon, value, label, color, bgColor }: { icon: React.ReactNode; value: string | number; label: string; color: string; bgColor: string }) => (
  <View style={[S.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <View style={[S.statIconBox, { backgroundColor: bgColor }]}>{icon}</View>
    <Text style={S.statValue}>{value}</Text>
    <Text style={S.statLabel}>{label}</Text>
  </View>
);

const SecHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <View style={S.secHeader}>
    <Text style={S.secTitle}>{title}</Text>
    {sub ? <Text style={S.secSub}>{sub}</Text> : null}
  </View>
);

function DetailItem({ label, value, highlight, full }: { label: string; value: string; highlight?: 'good' | 'bad' | 'neutral'; full?: boolean }) {
  const vc = highlight === 'good' ? '#166534' : highlight === 'bad' ? '#991B1B' : highlight === 'neutral' ? '#1E40AF' : '#374151';
  return (
    <View style={[S.detailItem, full && { width: '100%' }]}>
      <Text style={S.detailLabel}>{label}</Text>
      <Text style={[S.detailValue, highlight && { color: vc, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const [section, setSection] = useState<AdminSection>('dashboard');

  // Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [allApps, setAllApps] = useState<LoanAppWithFarmer[]>([]);
  const [actLog, setActLog] = useState<AdminActivityLog[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, customers: 0, reqAmt: 0, appAmt: 0 });

  // Applications page
  const [appSearch, setAppSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppStatusFilter>('all');
  const [selApp, setSelApp] = useState<LoanAppWithFarmer | null>(null);
  const [decLoading, setDecLoading] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Customers page
  const [custSearch, setCustSearch] = useState('');
  const [selCust, setSelCust] = useState<FarmerProfile | null>(null);
  const [custApps, setCustApps] = useState<LoanApplication[]>([]);
  const [custAppsLoading, setCustAppsLoading] = useState(false);

  const adminName = user?.name || 'Bank Admin Officer';
  const adminId = user?.identifier || user?.id || 'admin';

  // Security gate
  if (!user || user.role !== 'admin') {
    return (
      <View style={S.denied}>
        <Lock size={56} color={Colors.error[500]} />
        <Text style={S.deniedTitle}>Access Denied</Text>
        <Text style={S.deniedSub}>This portal is only accessible to authorised bank administrators.</Text>
      </View>
    );
  }

  // ── Data Fetch ────────────────────────────────────────────────────────────
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: fd } = await supabase.from('farmer_profiles').select('*').order('created_at', { ascending: false });
      const parsedFarmers = (fd || []).map(deserializeFromSupabase);
      setFarmers(parsedFarmers);

      const { data: ad } = await supabase.from('loan_applications').select('*').order('created_at', { ascending: false });
      const fMap = new Map(parsedFarmers.map(f => [f.id, f]));
      const apps: LoanAppWithFarmer[] = (ad || []).map(a => ({ ...a, farmer: fMap.get(a.farmer_id) }));
      setAllApps(apps);

      const reqAmt = apps.reduce((s, a) => s + Number(a.loan_amount || 0), 0);
      const approvedApps = apps.filter(a => a.admin_status === 'approved');
      setStats({
        total: apps.length,
        pending: apps.filter(a => !a.admin_status || a.admin_status === 'pending').length,
        underReview: apps.filter(a => a.admin_status === 'under_review').length,
        approved: approvedApps.length,
        rejected: apps.filter(a => a.admin_status === 'rejected').length,
        customers: parsedFarmers.length,
        reqAmt,
        appAmt: approvedApps.reduce((s, a) => s + Number(a.loan_amount || 0), 0),
      });

      const { data: ld } = await supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(20);
      setActLog(ld || []);
    } catch (e) { console.error('Admin load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Application Decisions ─────────────────────────────────────────────────
  const markUnderReview = async (app: LoanAppWithFarmer) => {
    if (!app.id) return;
    setDecLoading(true);
    try {
      const now = new Date().toISOString();
      await supabase.from('loan_applications').update({ admin_status: 'under_review', decided_by: adminId, updated_at: now }).eq('id', app.id);
      if (app.farmer_id) {
        await supabase.from('notifications').insert({ farmer_id: app.farmer_id, title: 'Application Under Review', message: \`Your loan application \${appId(app.id)} (\${app.loan_type}) is now under review by our team.\`, type: 'info', is_read: false, application_id: app.id, link_type: 'loan_application' });
      }
      await logActivity(adminId, adminName, 'application_review', \`Marked \${appId(app.id)} as Under Review\`, 'loan_application', app.id);
      const upd = { ...app, admin_status: 'under_review' as const, decided_by: adminId, updated_at: now };
      setAllApps(prev => prev.map(a => a.id === app.id ? upd : a));
      if (selApp?.id === app.id) setSelApp(upd);
    } catch { Alert.alert('Error', 'Failed to update status.'); }
    finally { setDecLoading(false); }
  };

  const doApprove = async () => {
    if (!selApp?.id) return;
    setDecLoading(true);
    try {
      const now = new Date().toISOString();
      await supabase.from('loan_applications').update({ admin_status: 'approved', admin_note: adminNote.trim() || null, decided_by: adminId, decided_at: now, updated_at: now, status: 'approved' }).eq('id', selApp.id);
      if (selApp.farmer_id) {
        await supabase.from('notifications').insert({ farmer_id: selApp.farmer_id, title: '\uD83C\uDF89 Loan Application Approved!', message: \`Your loan application \${appId(selApp.id)} (\${selApp.loan_type}) has been approved!\${adminNote.trim() ? ' Note: ' + adminNote.trim() : ''}\`, type: 'success', is_read: false, application_id: selApp.id, link_type: 'loan_application' });
      }
      await logActivity(adminId, adminName, 'application_approved', \`Approved \${appId(selApp.id)} \u2014 \${selApp.loan_type} \u2014 \${fmt(selApp.loan_amount)}\`, 'loan_application', selApp.id, { note: adminNote.trim() });
      const upd = { ...selApp, admin_status: 'approved' as const, admin_note: adminNote.trim() || null, decided_by: adminId, decided_at: now, updated_at: now, status: 'approved' };
      setAllApps(prev => prev.map(a => a.id === selApp.id ? upd : a));
      setSelApp(upd);
      setShowApprove(false); setAdminNote('');
      await loadData(true);
      Alert.alert('\u2705 Approved', \`Application \${appId(selApp.id)} approved. Customer notified.\`);
    } catch { Alert.alert('Error', 'Failed to approve.'); }
    finally { setDecLoading(false); }
  };

  const doReject = async () => {
    if (!selApp?.id || !rejectReason.trim()) { Alert.alert('Required', 'Please provide a rejection reason.'); return; }
    setDecLoading(true);
    try {
      const now = new Date().toISOString();
      await supabase.from('loan_applications').update({ admin_status: 'rejected', rejection_reason: rejectReason.trim(), admin_note: adminNote.trim() || null, decided_by: adminId, decided_at: now, updated_at: now, status: 'rejected' }).eq('id', selApp.id);
      if (selApp.farmer_id) {
        await supabase.from('notifications').insert({ farmer_id: selApp.farmer_id, title: 'Loan Application Rejected', message: \`Your loan application \${appId(selApp.id)} (\${selApp.loan_type}) has been rejected. Reason: \${rejectReason.trim()}\`, type: 'error', is_read: false, application_id: selApp.id, link_type: 'loan_application' });
      }
      await logActivity(adminId, adminName, 'application_rejected', \`Rejected \${appId(selApp.id)} \u2014 Reason: \${rejectReason.trim()}\`, 'loan_application', selApp.id, { reason: rejectReason.trim() });
      const upd = { ...selApp, admin_status: 'rejected' as const, rejection_reason: rejectReason.trim(), admin_note: adminNote.trim() || null, decided_by: adminId, decided_at: now, updated_at: now, status: 'rejected' };
      setAllApps(prev => prev.map(a => a.id === selApp.id ? upd : a));
      setSelApp(upd);
      setShowReject(false); setRejectReason(''); setAdminNote('');
      await loadData(true);
      Alert.alert('Rejected', \`Application \${appId(selApp.id)} rejected. Customer notified.\`);
    } catch { Alert.alert('Error', 'Failed to reject.'); }
    finally { setDecLoading(false); }
  };

  // ── Filtered Data ─────────────────────────────────────────────────────────
  const filteredApps = useMemo(() => {
    let apps = [...allApps];
    if (statusFilter !== 'all') apps = apps.filter(a => (a.admin_status || 'pending') === statusFilter);
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      apps = apps.filter(a => (a.farmer?.full_name || '').toLowerCase().includes(q) || (a.loan_type || '').toLowerCase().includes(q) || (a.bank_name || '').toLowerCase().includes(q) || appId(a.id).toLowerCase().includes(q));
    }
    return apps;
  }, [allApps, statusFilter, appSearch]);

  const filteredCusts = useMemo(() => {
    if (!custSearch.trim()) return farmers;
    const q = custSearch.toLowerCase();
    return farmers.filter(f => (f.full_name || '').toLowerCase().includes(q) || (f.phone || '').toLowerCase().includes(q) || (f.district || '').toLowerCase().includes(q));
  }, [farmers, custSearch]);

  const loadCustDetail = async (f: FarmerProfile) => {
    setSelCust(f);
    if (!f.id) return;
    setCustAppsLoading(true);
    try {
      const { data } = await supabase.from('loan_applications').select('*').eq('farmer_id', f.id).order('created_at', { ascending: false });
      setCustApps(data || []);
    } catch { setCustApps([]); }
    finally { setCustAppsLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ADMIN_BLUE} />}>
      <View style={S.welcomeBanner}>
        <View style={{ flex: 1 }}>
          <Text style={S.welcomeGreet}>Good day,</Text>
          <Text style={S.welcomeName}>{adminName}</Text>
          <Text style={S.welcomeRole}>Bank Admin Officer \u00b7 MonitorX Loan Management</Text>
        </View>
        <View style={S.welcomeAvatar}><ShieldCheck size={32} color="#fff" /></View>
      </View>

      <SecHeader title="Loan Overview" sub="All application statistics at a glance" />
      <View style={S.statsGrid}>
        <StatCard icon={<FileText size={20} color={ADMIN_BLUE} />} value={stats.total} label="Total Applications" color={ADMIN_BLUE} bgColor="#EFF6FF" />
        <StatCard icon={<Clock size={20} color="#B45309" />} value={stats.pending} label="Pending Review" color="#D97706" bgColor="#FFFBEB" />
        <StatCard icon={<CheckCircle2 size={20} color="#166534" />} value={stats.approved} label="Approved" color="#16A34A" bgColor="#F0FDF4" />
        <StatCard icon={<XCircle size={20} color="#991B1B" />} value={stats.rejected} label="Rejected" color="#DC2626" bgColor="#FEF2F2" />
        <StatCard icon={<Users size={20} color="#7C3AED" />} value={stats.customers} label="Registered Customers" color="#7C3AED" bgColor="#F5F3FF" />
        <StatCard icon={<TrendingUp size={20} color="#0E7490" />} value={fmt(stats.reqAmt)} label="Total Requested" color="#0E7490" bgColor="#ECFEFF" />
      </View>

      <SecHeader title="Recent Applications" sub="Latest loan applications submitted by customers" />
      <View style={S.tableCard}>
        {allApps.slice(0, 6).length === 0
          ? <View style={S.empty}><FileText size={32} color={Colors.neutral[300]} /><Text style={S.emptyTxt}>No applications yet</Text></View>
          : allApps.slice(0, 6).map(app => (
            <TouchableOpacity key={app.id} style={S.appRow} onPress={() => { setSelApp(app); setSection('applications'); }} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={S.appRowId}>{appId(app.id)}</Text>
                <Text style={S.appRowName}>{app.farmer?.full_name || 'Customer'}</Text>
                <Text style={S.appRowMeta}>{app.loan_type} \u00b7 {fmt(app.loan_amount)}</Text>
                <Text style={S.appRowDate}>{fmtDate(app.created_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <StatusBadge status={app.admin_status || 'pending'} />
                <ChevronRight size={16} color={Colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          ))
        }
        <TouchableOpacity style={S.viewAllBtn} onPress={() => setSection('applications')}>
          <Text style={S.viewAllTxt}>View All Applications</Text>
          <ChevronRight size={14} color={ADMIN_BLUE} />
        </TouchableOpacity>
      </View>

      <SecHeader title="Government Schemes" sub="Agriculture schemes managed by MonitorX" />
      <View style={S.tableCard}>
        {schemes.slice(0, 5).map(scheme => (
          <View key={scheme.id} style={S.schemeRow}>
            <Landmark size={16} color={ADMIN_BLUE} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={S.schemeName}>{scheme.name}</Text>
              <Text style={S.schemeMeta}>{(scheme as any).ministry || (scheme as any).department || 'Government'} \u00b7 {(scheme as any).type === 'central' ? 'Central Govt.' : 'Tamil Nadu Govt.'}</Text>
              {(scheme as any).benefit ? <Text style={S.schemeBenefit} numberOfLines={1}>{(scheme as any).benefit}</Text> : null}
            </View>
            <View style={S.schemeTag}><Text style={S.schemeTagTxt}>{(scheme as any).type === 'central' ? 'Central' : 'State'}</Text></View>
          </View>
        ))}
        <Text style={S.schemesCount}>{schemes.length} total schemes in MonitorX</Text>
      </View>

      <SecHeader title="Recent Activity" sub="Latest admin actions and system events" />
      <View style={S.tableCard}>
        {actLog.length === 0
          ? <View style={S.empty}><Activity size={28} color={Colors.neutral[300]} /><Text style={S.emptyTxt}>No activity recorded yet</Text></View>
          : actLog.slice(0, 8).map((log, idx) => (
            <View key={log.id || idx} style={S.actRow}>
              <View style={S.actDot} />
              <View style={{ flex: 1 }}>
                <Text style={S.actDesc}>{log.description}</Text>
                <Text style={S.actTime}>{fmtDateTime(log.created_at)}</Text>
              </View>
            </View>
          ))
        }
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // APPLICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const renderApplications = () => (
    <View style={{ flex: 1 }}>
      {/* App Detail Modal */}
      <Modal visible={!!selApp} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelApp(null)}>
        <SafeAreaView style={S.modalSafe}>
          {selApp && (
            <>
              <View style={S.modalHdr}>
                <TouchableOpacity style={S.modalBack} onPress={() => setSelApp(null)}>
                  <ChevronLeft size={22} color={ADMIN_BLUE} />
                  <Text style={S.modalBackTxt}>Applications</Text>
                </TouchableOpacity>
                <StatusBadge status={selApp.admin_status || 'pending'} />
              </View>
              <ScrollView style={S.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={S.appBanner}>
                  <Text style={S.appBannerId}>{appId(selApp.id)}</Text>
                  <Text style={S.appBannerType}>{selApp.loan_type}</Text>
                  <Text style={S.appBannerAmt}>{fmt(selApp.loan_amount)}</Text>
                  <Text style={S.appBannerBank}>{selApp.bank_name}</Text>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><User size={18} color={ADMIN_BLUE} /><Text style={S.detCardTitle}>Customer Information</Text></View>
                  <View style={S.detGrid}>
                    <DetailItem label="Full Name" value={selApp.farmer?.full_name || '\u2014'} />
                    <DetailItem label="Phone" value={selApp.farmer?.phone || '\u2014'} />
                    <DetailItem label="Location" value={(selApp.farmer?.district || '\u2014') + ', ' + (selApp.farmer?.state || 'Tamil Nadu')} />
                    <DetailItem label="Land Area" value={(selApp.farmer?.land_size_acres || 0) + ' Acres (' + (selApp.farmer?.land_ownership || '\u2014') + ')'} />
                    <DetailItem label="Crops" value={selApp.farmer?.crop_type || selApp.farmer?.crops?.join(', ') || '\u2014'} />
                    <DetailItem label="Category" value={(selApp.farmer?.farmer_category || '\u2014').toUpperCase()} />
                  </View>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><CreditCard size={18} color="#7C3AED" /><Text style={S.detCardTitle}>Financial Profile</Text></View>
                  <View style={S.detGrid}>
                    <DetailItem label="Annual Farm Income" value={fmt(selApp.farmer?.annual_agricultural_income || 0)} />
                    <DetailItem label="Other Income" value={fmt(selApp.farmer?.other_income || 0)} />
                    <DetailItem label="Existing Loans" value={fmt(selApp.farmer?.existing_loans || 0)} />
                    <DetailItem label="Monthly Expenses" value={fmt(selApp.farmer?.monthly_expenses || 0) + '/mo'} />
                    <DetailItem label="Credit Score" value={selApp.farmer?.credit_score ? String(selApp.farmer.credit_score) : 'Not provided'} />
                    <DetailItem label="Repayment History" value={selApp.farmer?.repayment_history || '\u2014'} />
                    <DetailItem label="KCC Status" value={selApp.farmer?.has_kcc ? '\u2713 Active' : 'Not linked'} />
                    <DetailItem label="PMFBY" value={selApp.farmer?.has_pmfby ? '\u2713 Covered' : 'Not covered'} />
                  </View>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><Wallet size={18} color="#D97706" /><Text style={S.detCardTitle}>Loan Details</Text></View>
                  <View style={S.detGrid}>
                    <DetailItem label="Loan Type" value={selApp.loan_type} />
                    <DetailItem label="Requested Amount" value={fmt(selApp.loan_amount)} />
                    <DetailItem label="Bank / Lender" value={selApp.bank_name} />
                    <DetailItem label="Interest Rate" value={selApp.interest_rate ? selApp.interest_rate + '% p.a.' : '\u2014'} />
                    <DetailItem label="Tenure" value={selApp.tenure_months ? selApp.tenure_months + ' months' : '\u2014'} />
                    <DetailItem label="Purpose" value={(selApp as any).purpose || '\u2014'} />
                    <DetailItem label="Application Date" value={fmtDate(selApp.created_at)} />
                    <DetailItem label="Last Updated" value={fmtDate((selApp as any).updated_at)} />
                  </View>
                </View>

                {(selApp.farmer?.credit_score || selApp.farmer?.annual_agricultural_income) ? (
                  <View style={S.detCard}>
                    <View style={S.detCardHdr}><TrendingUp size={18} color="#166534" /><Text style={S.detCardTitle}>MonitorX Decision Support</Text></View>
                    <View style={S.mlNotice}>
                      <AlertTriangle size={14} color="#D97706" />
                      <Text style={S.mlNoticeTxt}>AI-assisted analysis for decision support only. Admin makes the final decision.</Text>
                    </View>
                    <View style={S.detGrid}>
                      {selApp.farmer?.credit_score ? <DetailItem label="Credit Score" value={selApp.farmer.credit_score + ' / 900'} highlight={selApp.farmer.credit_score >= 700 ? 'good' : selApp.farmer.credit_score >= 600 ? 'neutral' : 'bad'} /> : null}
                      {selApp.farmer?.annual_agricultural_income ? <DetailItem label="Annual Income" value={fmt(selApp.farmer.annual_agricultural_income)} highlight="neutral" /> : null}
                      <DetailItem label="Risk Indicator"
                        value={(selApp.farmer?.credit_score || 0) >= 700 && (selApp.farmer?.annual_agricultural_income || 0) >= 60000 ? 'Low Risk \u2014 Recommended' : (selApp.farmer?.credit_score || 0) >= 600 ? 'Moderate Risk \u2014 Manual Review' : 'High Risk \u2014 Thorough Verification Required'}
                        highlight={(selApp.farmer?.credit_score || 0) >= 700 ? 'good' : (selApp.farmer?.credit_score || 0) >= 600 ? 'neutral' : 'bad'}
                      />
                    </View>
                  </View>
                ) : null}

                {(selApp as any).decided_at ? (
                  <View style={S.detCard}>
                    <View style={S.detCardHdr}><ShieldCheck size={18} color={ADMIN_BLUE} /><Text style={S.detCardTitle}>Admin Decision Record</Text></View>
                    <View style={S.detGrid}>
                      <DetailItem label="Decision" value={statusLabel(selApp.admin_status)} />
                      <DetailItem label="Decided By" value={(selApp as any).decided_by || '\u2014'} />
                      <DetailItem label="Decision Date" value={fmtDate((selApp as any).decided_at)} />
                      {(selApp as any).rejection_reason ? <DetailItem label="Rejection Reason" value={(selApp as any).rejection_reason} full /> : null}
                      {(selApp as any).admin_note ? <DetailItem label="Admin Note" value={(selApp as any).admin_note} full /> : null}
                    </View>
                  </View>
                ) : null}

                {(!selApp.admin_status || selApp.admin_status === 'pending' || selApp.admin_status === 'under_review') ? (
                  <View style={S.actBox}>
                    <Text style={S.actBoxTitle}>Admin Actions</Text>
                    {(!selApp.admin_status || selApp.admin_status === 'pending') ? (
                      <TouchableOpacity style={[S.actBtn, S.actBtnReview]} onPress={() => markUnderReview(selApp)} disabled={decLoading} activeOpacity={0.85}>
                        {decLoading ? <ActivityIndicator size="small" color="#9A3412" /> : <><Eye size={18} color="#9A3412" /><Text style={[S.actBtnTxt, { color: '#9A3412' }]}>Mark Under Review</Text></>}
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={[S.actBtn, S.actBtnApprove]} onPress={() => setShowApprove(true)} disabled={decLoading} activeOpacity={0.85}>
                      <CheckCircle2 size={18} color="#166534" /><Text style={[S.actBtnTxt, { color: '#166534' }]}>Approve Application</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[S.actBtn, S.actBtnReject]} onPress={() => setShowReject(true)} disabled={decLoading} activeOpacity={0.85}>
                      <XCircle size={18} color="#991B1B" /><Text style={[S.actBtnTxt, { color: '#991B1B' }]}>Reject Application</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Approve Dialog */}
      <Modal visible={showApprove} transparent animationType="fade">
        <View style={S.overlay}>
          <View style={S.dialog}>
            <View style={[S.dialogIcon, { backgroundColor: '#F0FDF4' }]}><CheckCircle2 size={28} color="#166534" /></View>
            <Text style={S.dialogTitle}>Confirm Approval</Text>
            <Text style={S.dialogBody}>Approve <Text style={{ fontWeight: '700' }}>{appId(selApp?.id)}</Text> ({selApp?.loan_type} \u2014 {fmt(selApp?.loan_amount || 0)}). Customer will be notified immediately.</Text>
            <Text style={S.dlgLabel}>Approval Note (Optional)</Text>
            <TextInput style={S.dlgInput} placeholder="Add an optional note..." placeholderTextColor={Colors.neutral[400]} value={adminNote} onChangeText={setAdminNote} multiline numberOfLines={3} />
            <View style={S.dlgActions}>
              <TouchableOpacity style={S.dlgCancel} onPress={() => { setShowApprove(false); setAdminNote(''); }}><Text style={S.dlgCancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[S.dlgConfirm, { backgroundColor: '#16A34A' }]} onPress={doApprove} disabled={decLoading}>
                {decLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.dlgConfirmTxt}>Approve</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Dialog */}
      <Modal visible={showReject} transparent animationType="fade">
        <View style={S.overlay}>
          <View style={S.dialog}>
            <View style={[S.dialogIcon, { backgroundColor: '#FEF2F2' }]}><XCircle size={28} color="#991B1B" /></View>
            <Text style={S.dialogTitle}>Confirm Rejection</Text>
            <Text style={S.dialogBody}>Reject <Text style={{ fontWeight: '700' }}>{appId(selApp?.id)}</Text>. Please provide a reason for the customer.</Text>
            <Text style={[S.dlgLabel, { color: '#991B1B' }]}>Rejection Reason <Text style={{ color: '#DC2626' }}>*</Text></Text>
            <TextInput style={[S.dlgInput, { borderColor: '#FECACA' }]} placeholder="e.g. Insufficient credit score, high debt ratio..." placeholderTextColor={Colors.neutral[400]} value={rejectReason} onChangeText={setRejectReason} multiline numberOfLines={3} />
            <Text style={S.dlgLabel}>Admin Note (Optional)</Text>
            <TextInput style={S.dlgInput} placeholder="Internal note (not visible to customer)" placeholderTextColor={Colors.neutral[400]} value={adminNote} onChangeText={setAdminNote} />
            <View style={S.dlgActions}>
              <TouchableOpacity style={S.dlgCancel} onPress={() => { setShowReject(false); setRejectReason(''); setAdminNote(''); }}><Text style={S.dlgCancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[S.dlgConfirm, { backgroundColor: '#DC2626' }]} onPress={doReject} disabled={decLoading}>
                {decLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.dlgConfirmTxt}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* List */}
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ADMIN_BLUE} />}>
        <SecHeader title="Loan Applications" sub={filteredApps.length + ' of ' + allApps.length + ' applications'} />
        <View style={S.searchBar}>
          <Search size={18} color={Colors.neutral[400]} />
          <TextInput style={S.searchInput} placeholder="Search by name, loan type, bank..." placeholderTextColor={Colors.neutral[400]} value={appSearch} onChangeText={setAppSearch} />
          {appSearch.length > 0 ? <TouchableOpacity onPress={() => setAppSearch('')}><X size={18} color={Colors.neutral[400]} /></TouchableOpacity> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(['all', 'pending', 'under_review', 'approved', 'rejected'] as AppStatusFilter[]).map(f => (
            <TouchableOpacity key={f} style={[S.chip, statusFilter === f && S.chipActive]} onPress={() => setStatusFilter(f)}>
              <Text style={[S.chipTxt, statusFilter === f && S.chipTxtActive]}>{f === 'all' ? 'All' : f === 'under_review' ? 'Under Review' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading ? <View style={S.loadBox}><ActivityIndicator size="large" color={ADMIN_BLUE} /><Text style={S.loadTxt}>Loading...</Text></View>
          : filteredApps.length === 0 ? <View style={S.empty}><FileText size={36} color={Colors.neutral[300]} /><Text style={S.emptyTxt}>No applications found</Text></View>
          : <View style={S.listGap}>
            {filteredApps.map(app => (
              <TouchableOpacity key={app.id} style={S.appCard} onPress={() => setSelApp(app)} activeOpacity={0.85}>
                <View style={S.appCardHdr}>
                  <View>
                    <Text style={S.appCardId}>{appId(app.id)}</Text>
                    <Text style={S.appCardName}>{app.farmer?.full_name || 'Unknown'}</Text>
                  </View>
                  <StatusBadge status={app.admin_status || 'pending'} />
                </View>
                <View style={S.appCardBody}>
                  <View style={{ flex: 1 }}><Text style={S.appCardLbl}>Loan Type</Text><Text style={S.appCardVal}>{app.loan_type}</Text></View>
                  <View style={{ flex: 1 }}><Text style={S.appCardLbl}>Amount</Text><Text style={[S.appCardVal, { color: ADMIN_BLUE, fontWeight: '700' }]}>{fmt(app.loan_amount)}</Text></View>
                  <View style={{ flex: 1 }}><Text style={S.appCardLbl}>Date</Text><Text style={S.appCardVal}>{fmtDate(app.created_at)}</Text></View>
                </View>
                <View style={S.appCardFoot}><Text style={S.appCardBank}>\uD83C\uDFE6 {app.bank_name}</Text>{app.farmer?.district ? <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>{app.farmer.district}</Text> : null}</View>
              </TouchableOpacity>
            ))}
          </View>
        }
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOMERS
  // ─────────────────────────────────────────────────────────────────────────
  const renderCustomers = () => (
    <View style={{ flex: 1 }}>
      <Modal visible={!!selCust} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelCust(null)}>
        <SafeAreaView style={S.modalSafe}>
          {selCust && (
            <>
              <View style={S.modalHdr}>
                <TouchableOpacity style={S.modalBack} onPress={() => setSelCust(null)}>
                  <ChevronLeft size={22} color={ADMIN_BLUE} />
                  <Text style={S.modalBackTxt}>Customers</Text>
                </TouchableOpacity>
                <View style={S.custTagBadge}><Text style={S.custTagTxt}>{(selCust.farmer_category || 'farmer').toUpperCase()}</Text></View>
              </View>
              <ScrollView style={S.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={S.custHero}>
                  <View style={S.custHeroAvatar}><User size={32} color={ADMIN_BLUE} /></View>
                  <Text style={S.custHeroName}>{selCust.full_name}</Text>
                  <Text style={S.custHeroId}>ID: {selCust.id?.slice(0, 8).toUpperCase() || '\u2014'}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                    <View style={S.custHeroPill}><Phone size={12} color={Colors.neutral[500]} /><Text style={S.custHeroPillTxt}>{selCust.phone || '\u2014'}</Text></View>
                    <View style={S.custHeroPill}><MapPin size={12} color={Colors.neutral[500]} /><Text style={S.custHeroPillTxt}>{selCust.district || '\u2014'}, {selCust.state || 'TN'}</Text></View>
                  </View>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><User size={18} color={ADMIN_BLUE} /><Text style={S.detCardTitle}>Personal Details</Text></View>
                  <View style={S.detGrid}>
                    <DetailItem label="Age" value={selCust.age ? selCust.age + ' years' : '\u2014'} />
                    <DetailItem label="Gender" value={selCust.gender || '\u2014'} />
                    <DetailItem label="District" value={selCust.district || '\u2014'} />
                    <DetailItem label="State" value={selCust.state || 'Tamil Nadu'} />
                    <DetailItem label="Joined" value={fmtDate(selCust.created_at)} />
                    <DetailItem label="Category" value={(selCust.farmer_category || '\u2014').toUpperCase()} />
                  </View>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><Sprout size={18} color="#166534" /><Text style={S.detCardTitle}>Agricultural Profile</Text></View>
                  <View style={S.detGrid}>
                    <DetailItem label="Land Area" value={(selCust.land_size_acres || 0) + ' Acres'} />
                    <DetailItem label="Ownership" value={selCust.land_ownership || '\u2014'} />
                    <DetailItem label="Crops" value={selCust.crop_type || selCust.crops?.join(', ') || '\u2014'} />
                    <DetailItem label="Farming Type" value={selCust.farming_type || '\u2014'} />
                    <DetailItem label="Irrigation" value={selCust.irrigation_type || (selCust.irrigation_available ? 'Available' : 'None')} />
                    <DetailItem label="KCC" value={selCust.has_kcc ? '\u2713 Active' : 'Not linked'} />
                  </View>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><CreditCard size={18} color="#7C3AED" /><Text style={S.detCardTitle}>Financial Summary</Text></View>
                  <View style={S.detGrid}>
                    <DetailItem label="Annual Farm Income" value={fmt(selCust.annual_agricultural_income || 0)} />
                    <DetailItem label="Other Income" value={fmt(selCust.other_income || 0)} />
                    <DetailItem label="Existing Loans" value={fmt(selCust.existing_loans || 0)} />
                    <DetailItem label="Monthly Expenses" value={fmt(selCust.monthly_expenses || 0) + '/mo'} />
                    <DetailItem label="Credit Score" value={selCust.credit_score ? String(selCust.credit_score) : 'Not provided'} />
                    <DetailItem label="Repayment History" value={selCust.repayment_history || '\u2014'} />
                  </View>
                </View>

                <View style={S.detCard}>
                  <View style={S.detCardHdr}><Wallet size={18} color="#D97706" /><Text style={S.detCardTitle}>Loan Applications ({custApps.length})</Text></View>
                  {custAppsLoading ? <ActivityIndicator size="small" color={ADMIN_BLUE} />
                    : custApps.length === 0 ? <Text style={S.noDataTxt}>No loan applications on record</Text>
                    : custApps.map(loan => (
                      <View key={loan.id} style={S.custLoanRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={S.custLoanType}>{loan.loan_type}</Text>
                          <Text style={S.custLoanMeta}>{fmt(loan.loan_amount)} \u00b7 {fmtDate(loan.created_at)}</Text>
                        </View>
                        <StatusBadge status={(loan as any).admin_status || 'pending'} />
                      </View>
                    ))
                  }
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ADMIN_BLUE} />}>
        <SecHeader title="Customers" sub={filteredCusts.length + ' of ' + farmers.length + ' registered customers'} />
        <View style={S.searchBar}>
          <Search size={18} color={Colors.neutral[400]} />
          <TextInput style={S.searchInput} placeholder="Search by name, phone, district..." placeholderTextColor={Colors.neutral[400]} value={custSearch} onChangeText={setCustSearch} />
          {custSearch.length > 0 ? <TouchableOpacity onPress={() => setCustSearch('')}><X size={18} color={Colors.neutral[400]} /></TouchableOpacity> : null}
        </View>
        {loading ? <View style={S.loadBox}><ActivityIndicator size="large" color={ADMIN_BLUE} /><Text style={S.loadTxt}>Loading customers...</Text></View>
          : filteredCusts.length === 0 ? <View style={S.empty}><Users size={36} color={Colors.neutral[300]} /><Text style={S.emptyTxt}>No customers found</Text></View>
          : <View style={S.listGap}>
            {filteredCusts.map(f => {
              const cnt = allApps.filter(a => a.farmer_id === f.id).length;
              return (
                <TouchableOpacity key={f.id} style={S.custCard} onPress={() => loadCustDetail(f)} activeOpacity={0.85}>
                  <View style={S.custAvatar}><User size={20} color={ADMIN_BLUE} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.custName}>{f.full_name}</Text>
                    <View style={S.custMeta}>
                      <Phone size={12} color={Colors.neutral[400]} />
                      <Text style={S.custMetaTxt}>{f.phone || '\u2014'}</Text>
                      <MapPin size={12} color={Colors.neutral[400]} style={{ marginLeft: 8 }} />
                      <Text style={S.custMetaTxt}>{f.district || f.state}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      <View style={S.custPill}><Text style={S.custPillTxt}>{(f.farmer_category || 'small').toUpperCase()}</Text></View>
                      {cnt > 0 ? <View style={[S.custPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}><Text style={[S.custPillTxt, { color: ADMIN_BLUE }]}>{cnt} app{cnt > 1 ? 's' : ''}</Text></View> : null}
                      {f.credit_score ? <View style={[S.custPill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}><Text style={[S.custPillTxt, { color: '#166534' }]}>Score: {f.credit_score}</Text></View> : null}
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.neutral[400]} />
                </TouchableOpacity>
              );
            })}
          </View>
        }
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PROFILE
  // ─────────────────────────────────────────────────────────────────────────
  const renderAdminProfile = () => (
    <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
      <View style={S.adminHero}>
        <View style={S.adminHeroAvatar}><ShieldCheck size={36} color="#fff" /></View>
        <Text style={S.adminHeroName}>{adminName}</Text>
        <Text style={S.adminHeroRole}>Bank Administrator \u00b7 Loan Management</Text>
        <View style={S.adminHeroBadge}><Text style={S.adminHeroBadgeTxt}>\uD83C\uDFE6 MonitorX Admin Portal</Text></View>
      </View>

      <View style={S.detCard}>
        <View style={S.detCardHdr}><User size={18} color={ADMIN_BLUE} /><Text style={S.detCardTitle}>Admin Information</Text></View>
        <View style={S.detGrid}>
          <DetailItem label="Admin ID" value={adminId} />
          <DetailItem label="Role" value="Bank Administrator" />
          <DetailItem label="Email" value={user?.email || '\u2014'} />
          <DetailItem label="Department" value="Loan Underwriting & Risk" />
          <DetailItem label="Security Level" value="Full Access \u2014 Admin Portal" />
        </View>
      </View>

      <SecHeader title="Work Summary" sub="Your performance and statistics" />
      <View style={S.statsGrid}>
        <StatCard icon={<FileText size={20} color={ADMIN_BLUE} />} value={stats.total} label="Total Applications" color={ADMIN_BLUE} bgColor="#EFF6FF" />
        <StatCard icon={<CheckCircle2 size={20} color="#166534" />} value={stats.approved} label="Approved" color="#16A34A" bgColor="#F0FDF4" />
        <StatCard icon={<XCircle size={20} color="#991B1B" />} value={stats.rejected} label="Rejected" color="#DC2626" bgColor="#FEF2F2" />
        <StatCard icon={<Clock size={20} color="#D97706" />} value={stats.pending + stats.underReview} label="Pending Actions" color="#D97706" bgColor="#FFFBEB" />
      </View>

      <SecHeader title="Pending Actions" sub="Applications requiring your attention" />
      <View style={S.tableCard}>
        {allApps.filter(a => !a.admin_status || a.admin_status === 'pending' || a.admin_status === 'under_review').length === 0
          ? <View style={S.empty}><CheckCircle size={28} color={Colors.neutral[300]} /><Text style={S.emptyTxt}>All applications reviewed!</Text></View>
          : allApps.filter(a => !a.admin_status || a.admin_status === 'pending' || a.admin_status === 'under_review').slice(0, 5).map(app => (
            <TouchableOpacity key={app.id} style={S.pendingRow} onPress={() => { setSelApp(app); setSection('applications'); }}>
              <View style={S.pendingDot} />
              <View style={{ flex: 1 }}>
                <Text style={S.pendingTitle}>{appId(app.id)} \u2014 {app.farmer?.full_name || 'Customer'}</Text>
                <Text style={S.pendingMeta}>{app.loan_type} \u00b7 {fmt(app.loan_amount)} \u00b7 {fmtDate(app.created_at)}</Text>
              </View>
              <StatusBadge status={app.admin_status || 'pending'} />
            </TouchableOpacity>
          ))
        }
      </View>

      <SecHeader title="Recent Activity" sub="Your recent admin actions" />
      <View style={S.tableCard}>
        {actLog.length === 0
          ? <View style={S.empty}><Activity size={28} color={Colors.neutral[300]} /><Text style={S.emptyTxt}>No activity recorded yet</Text></View>
          : actLog.slice(0, 10).map((log, idx) => (
            <View key={log.id || idx} style={S.actRow}>
              <View style={S.actDot} />
              <View style={{ flex: 1 }}>
                <Text style={S.actDesc}>{log.description}</Text>
                <Text style={S.actTime}>{fmtDateTime(log.created_at)}</Text>
              </View>
            </View>
          ))
        }
      </View>

      <TouchableOpacity style={S.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <LogOut size={18} color="#DC2626" />
        <Text style={S.logoutTxt}>Sign Out of Admin Portal</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ROOT RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const navItems = [
    { key: 'dashboard' as AdminSection, label: 'Dashboard', icon: (a: boolean) => <LayoutDashboard size={20} color={a ? '#fff' : ADMIN_BLUE} /> },
    { key: 'applications' as AdminSection, label: 'Applications', icon: (a: boolean) => <FileText size={20} color={a ? '#fff' : ADMIN_BLUE} /> },
    { key: 'customers' as AdminSection, label: 'Customers', icon: (a: boolean) => <Users size={20} color={a ? '#fff' : ADMIN_BLUE} /> },
    { key: 'admin_profile' as AdminSection, label: 'Admin Profile', icon: (a: boolean) => <User size={20} color={a ? '#fff' : ADMIN_BLUE} /> },
  ];

  return (
    <SafeAreaView style={S.root}>
      <View style={S.topHdr}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={S.topLogo}><Building2 size={18} color="#fff" /></View>
          <View>
            <Text style={S.topTitle}>MonitorX Admin</Text>
            <Text style={S.topSub}>Bank Loan Management Portal</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {stats.pending > 0 ? (
            <View style={S.notifBadge}>
              <Bell size={14} color="#fff" />
              <Text style={S.notifCount}>{stats.pending}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={S.topLogoutBtn} onPress={logout}><LogOut size={16} color={ADMIN_BLUE} /></TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {loading && section === 'dashboard'
          ? <View style={S.fullLoad}><ActivityIndicator size="large" color={ADMIN_BLUE} /><Text style={S.loadTxt}>Loading Admin Portal...</Text></View>
          : section === 'dashboard' ? renderDashboard()
          : section === 'applications' ? renderApplications()
          : section === 'customers' ? renderCustomers()
          : renderAdminProfile()
        }
      </View>

      <View style={S.bottomNav}>
        {navItems.map(item => {
          const active = section === item.key;
          return (
            <TouchableOpacity key={item.key} style={[S.navItem, active && S.navItemActive]} onPress={() => setSection(item.key)} activeOpacity={0.8}>
              {item.icon(active)}
              <Text style={[S.navLabel, active && S.navLabelActive]}>{item.label}</Text>
              {item.key === 'applications' && stats.pending > 0 ? (
                <View style={S.navDot}><Text style={S.navDotTxt}>{stats.pending}</Text></View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4FF' },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F9FAFB' },
  deniedTitle: { fontSize: 24, fontWeight: '800', color: '#991B1B', marginTop: 16, textAlign: 'center' },
  deniedSub: { fontSize: 15, color: Colors.neutral[500], marginTop: 10, textAlign: 'center', lineHeight: 22 },
  topHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: ADMIN_BLUE, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  topLogo: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  topSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  notifBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  notifCount: { fontSize: 11, fontWeight: '800', color: '#fff' },
  topLogoutBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  fullLoad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadTxt: { fontSize: 14, color: Colors.neutral[500] },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyTxt: { fontSize: 14, color: Colors.neutral[400] },
  listGap: { gap: 10 },
  secHeader: { marginBottom: 12, marginTop: 8 },
  secTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  secSub: { fontSize: 13, color: Colors.neutral[500], marginTop: 2 },
  welcomeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN_BLUE, borderRadius: 16, padding: 20, marginBottom: 20, marginTop: 4, shadowColor: ADMIN_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  welcomeGreet: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  welcomeName: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  welcomeRole: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  welcomeAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.neutral[500], marginTop: 2 },
  tableCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  appRowId: { fontSize: 11, fontWeight: '700', color: ADMIN_BLUE, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  appRowName: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
  appRowMeta: { fontSize: 12, color: Colors.neutral[500], marginTop: 1 },
  appRowDate: { fontSize: 11, color: Colors.neutral[400], marginTop: 1 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  viewAllTxt: { fontSize: 13, fontWeight: '700', color: ADMIN_BLUE },
  schemeRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  schemeName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  schemeMeta: { fontSize: 11, color: Colors.neutral[500], marginTop: 2 },
  schemeBenefit: { fontSize: 11, color: '#166534', marginTop: 2 },
  schemeTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE', alignSelf: 'flex-start' },
  schemeTagTxt: { fontSize: 10, fontWeight: '700', color: ADMIN_BLUE },
  schemesCount: { fontSize: 12, color: Colors.neutral[400], textAlign: 'center', paddingVertical: 10 },
  actRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  actDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ADMIN_BLUE, marginTop: 5 },
  actDesc: { fontSize: 13, color: '#374151', fontWeight: '500' },
  actTime: { fontSize: 11, color: Colors.neutral[400], marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  chipActive: { backgroundColor: ADMIN_BLUE, borderColor: ADMIN_BLUE },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTxtActive: { color: '#fff' },
  appCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  appCardHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  appCardId: { fontSize: 11, fontWeight: '700', color: ADMIN_BLUE, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  appCardName: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 2 },
  appCardBody: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  appCardLbl: { fontSize: 10, fontWeight: '600', color: Colors.neutral[400] },
  appCardVal: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 },
  appCardFoot: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  appCardBank: { fontSize: 12, color: Colors.neutral[500], fontWeight: '600' },
  custCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  custAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: ADMIN_BLUE_LIGHT, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE', marginRight: 12 },
  custName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  custMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  custMetaTxt: { fontSize: 12, color: Colors.neutral[500] },
  custPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  custPillTxt: { fontSize: 10, fontWeight: '700', color: '#374151' },
  modalSafe: { flex: 1, backgroundColor: '#F0F4FF' },
  modalHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalBack: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalBackTxt: { fontSize: 15, color: ADMIN_BLUE, fontWeight: '600' },
  modalScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  appBanner: { backgroundColor: ADMIN_BLUE, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: ADMIN_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  appBannerId: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  appBannerType: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4 },
  appBannerAmt: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 6 },
  appBannerBank: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  detCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  detCardHdr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 12 },
  detCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  detGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  detailItem: { width: '47%' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: Colors.neutral[400] },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 3 },
  mlNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 8, padding: 10, marginBottom: 12 },
  mlNoticeTxt: { fontSize: 11, color: '#92400E', flex: 1, lineHeight: 16 },
  actBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, gap: 10 },
  actBoxTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  actBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5 },
  actBtnApprove: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  actBtnReject: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actBtnReview: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  actBtnTxt: { fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 16 },
  dialogIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  dialogTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10 },
  dialogBody: { fontSize: 14, color: Colors.neutral[600], textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  dlgLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  dlgInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 16, minHeight: 60, textAlignVertical: 'top' },
  dlgActions: { flexDirection: 'row', gap: 12 },
  dlgCancel: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  dlgCancelTxt: { fontSize: 14, fontWeight: '700', color: '#374151' },
  dlgConfirm: { flex: 2, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  dlgConfirmTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  custTagBadge: { backgroundColor: ADMIN_BLUE_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  custTagTxt: { fontSize: 11, fontWeight: '700', color: ADMIN_BLUE },
  custHero: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  custHeroAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: ADMIN_BLUE_LIGHT, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#BFDBFE', marginBottom: 12 },
  custHeroName: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  custHeroId: { fontSize: 12, color: Colors.neutral[500], fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 4 },
  custHeroPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  custHeroPillTxt: { fontSize: 12, color: Colors.neutral[600] },
  custLoanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  custLoanType: { fontSize: 13, fontWeight: '700', color: '#111827' },
  custLoanMeta: { fontSize: 12, color: Colors.neutral[500], marginTop: 2 },
  noDataTxt: { fontSize: 13, color: Colors.neutral[400], fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  adminHero: { alignItems: 'center', backgroundColor: ADMIN_BLUE, borderRadius: 16, padding: 28, marginBottom: 16, shadowColor: ADMIN_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  adminHeroAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  adminHeroName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  adminHeroRole: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  adminHeroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  adminHeroBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' },
  pendingTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  pendingMeta: { fontSize: 12, color: Colors.neutral[500], marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, paddingVertical: 14, marginTop: 6, marginBottom: 16 },
  logoutTxt: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 10, marginHorizontal: 4, gap: 3, position: 'relative' },
  navItemActive: { backgroundColor: ADMIN_BLUE },
  navLabel: { fontSize: 10, fontWeight: '600', color: ADMIN_BLUE },
  navLabelActive: { color: '#fff' },
  navDot: { position: 'absolute', top: 2, right: 10, backgroundColor: '#DC2626', borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  navDotTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
`;

fs.writeFileSync(path.join(__dirname, '..', 'app', '(tabs)', 'admin.tsx'), content, 'utf8');
console.log('✅ admin.tsx written successfully. Size:', fs.statSync(path.join(__dirname, '..', 'app', '(tabs)', 'admin.tsx')).size, 'bytes');
