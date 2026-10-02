import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/profile-context';
import { Header } from '@/components/Header';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { ProfileWizard } from '@/components/ProfileWizard';
import { supabase, LoanApplication } from '@/lib/supabase';
import {
  LogOut,
  User,
  Phone,
  Mail,
  MapPin,
  Coins,
  Sprout,
  Landmark,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Layers,
  Calendar,
  Pencil,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Bell,
} from 'lucide-react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/lib/theme';

type ProfileTab = 'profile' | 'applications';

// ─── Application status helpers ───────────────────────────────────────────────
function normalizeStatus(status?: string | null): 'pending' | 'under_review' | 'approved' | 'rejected' {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'under_review' || s === 'under review' || s === 'review') return 'under_review';
  return 'pending';
}

function getStatusMeta(status: string) {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'approved': return { bg: '#D1FAE5', text: '#10B981', border: '#A7F3D0', label: 'Approved' };
    case 'rejected': return { bg: '#FEE2E2', text: '#EF4444', border: '#FECACA', label: 'Rejected' };
    case 'under_review': return { bg: '#EDE9FE', text: '#8B5CF6', border: '#DDD6FE', label: 'Under Review' };
    default: return { bg: '#FEF3C7', text: '#F59E0B', border: '#FDE68A', label: 'Pending' };
  }
}

function StatusBadge({ status }: { status: string }) {
  const norm = normalizeStatus(status);
  const m = getStatusMeta(norm);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, backgroundColor: m.bg, borderColor: m.border }}>
      {norm === 'approved' && <CheckCircle size={11} color={m.text} />}
      {norm === 'rejected' && <XCircle size={11} color={m.text} />}
      {norm === 'under_review' && <Clock size={11} color={m.text} />}
      {norm === 'pending' && <AlertTriangle size={11} color={m.text} />}
      <Text style={{ fontSize: 11, fontWeight: '700', color: m.text }}>{m.label}</Text>
    </View>
  );
}

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(d?: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Application Timeline ─────────────────────────────────────────────────────
function ApplicationTimeline({ app, onClose }: { app: LoanApplication; onClose: () => void }) {
  const currentStatus = normalizeStatus(app.status || app.admin_status);
  const steps = [
    { key: 'submitted', label: 'Application Submitted', sub: `Submitted on ${formatDate(app.created_at)}`, done: true },
    { key: 'review', label: 'Under Review', sub: currentStatus === 'under_review' || currentStatus === 'approved' || currentStatus === 'rejected' ? 'Your application is being reviewed by our loan officer.' : 'Awaiting review', done: currentStatus === 'under_review' || currentStatus === 'approved' || currentStatus === 'rejected' },
    { key: 'decision', label: currentStatus === 'approved' ? 'Approved' : currentStatus === 'rejected' ? 'Rejected' : 'Decision', sub: currentStatus === 'approved' ? `Approved on ${formatDate(app.decided_at || app.updated_at || app.created_at)}${app.admin_note ? `. Note: ${app.admin_note}` : ''}` : currentStatus === 'rejected' ? `Rejected on ${formatDate(app.decided_at || app.updated_at || app.created_at)}. Reason: ${app.rejection_reason || 'No reason provided.'}` : 'Pending decision', done: currentStatus === 'approved' || currentStatus === 'rejected', rejected: currentStatus === 'rejected' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }} activeOpacity={0.7}><ArrowLeft size={20} color="#0F172A" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Application Tracking</Text>
          <Text style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>APP-{(app.id || '').slice(0, 8).toUpperCase()}</Text>
        </View>
        <StatusBadge status={currentStatus} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, margin: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>Loan Summary</Text>
          {[
            { label: 'Application ID', val: `APP-${(app.id || '').slice(0, 8).toUpperCase()}` },
            { label: 'Loan Type', val: app.loan_type },
            { label: 'Requested Amount', val: formatCurrency(Number(app.loan_amount)), highlight: true },
            { label: 'Bank / Lender', val: app.bank_name },
            { label: 'Application Date', val: formatDate(app.created_at) },
            { label: 'Last Updated', val: formatDate(app.updated_at) },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 13, color: '#475569' }}>{item.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: (item as any).highlight ? '#3B82F6' : '#0F172A' }}>{item.val}</Text>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 16 }}>Application Timeline</Text>
          {steps.map((step, i) => (
            <View key={step.key} style={{ flexDirection: 'row', gap: 14, marginBottom: i < steps.length - 1 ? 8 : 0 }}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: step.done ? (step.rejected ? '#FEE2E2' : '#D1FAE5') : '#F1F5F9', borderWidth: 2, borderColor: step.done ? (step.rejected ? '#EF4444' : '#10B981') : '#E2E8F0' }}>
                  {step.done && !step.rejected && <CheckCircle size={14} color="#10B981" />}
                  {step.done && step.rejected && <XCircle size={14} color="#EF4444" />}
                  {!step.done && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' }} />}
                </View>
                {i < steps.length - 1 && <View style={{ width: 2, flex: 1, marginTop: 4, backgroundColor: step.done ? '#10B981' : '#E2E8F0' }} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: step.done ? (step.rejected ? '#EF4444' : '#10B981') : '#94A3B8' }}>{step.label}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 }}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Decision note box */}
        {currentStatus === 'approved' && app.admin_note && (
          <View style={{ backgroundColor: '#D1FAE5', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0', padding: 14, marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 4 }}>Approval Note from Bank Officer</Text>
            <Text style={{ fontSize: 13, color: '#065F46' }}>{app.admin_note}</Text>
          </View>
        )}
        {currentStatus === 'rejected' && app.rejection_reason && (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 14, marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 4 }}>Rejection Reason</Text>
            <Text style={{ fontSize: 13, color: '#7F1D1D' }}>{app.rejection_reason}</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Applications Tab Content ─────────────────────────────────────────────────
function ApplicationsTab({ profileId }: { profileId?: string }) {
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (profileId) {
      loadApps();
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [profileId]);

  const loadApps = async () => {
    setLoading(true);
    const { data } = await supabase.from('loan_applications').select('*').eq('farmer_id', profileId!).order('created_at', { ascending: false });
    const mapped = (data || []).map((a: any) => ({
      ...a,
      status: normalizeStatus(a.status || a.admin_status),
      admin_status: normalizeStatus(a.status || a.admin_status),
    }));
    setApps(mapped as LoanApplication[]);
    setLoading(false);
  };

  const loadNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').eq('farmer_id', profileId!).eq('is_read', false).order('created_at', { ascending: false }).limit(5);
    setNotifications(data || []);
  };

  const markNotifRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (selectedApp) {
    return <ApplicationTimeline app={selectedApp} onClose={() => { setSelectedApp(null); loadApps(); }} />;
  }

  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
      {/* Unread Notifications */}
      {notifications.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Bell size={16} color={Colors.primary[700]} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.neutral[800] }}>Application Notifications</Text>
            <View style={{ backgroundColor: Colors.primary[600], paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, marginLeft: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{notifications.length}</Text>
            </View>
          </View>
          {notifications.map(n => (
            <View key={n.id} style={{ backgroundColor: Colors.primary[50], borderRadius: 10, borderWidth: 1, borderColor: Colors.primary[200], padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary[800] }}>{n.title}</Text>
                <Text style={{ fontSize: 12, color: Colors.primary[700], marginTop: 3, lineHeight: 18 }}>{n.message}</Text>
                <Text style={{ fontSize: 11, color: Colors.neutral[500], marginTop: 4 }}>{formatDate(n.created_at)}</Text>
              </View>
              <TouchableOpacity onPress={() => markNotifRead(n.id)} activeOpacity={0.7}>
                <Text style={{ fontSize: 12, color: Colors.primary[600], fontWeight: '700' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <ClipboardList size={18} color={Colors.neutral[700]} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.neutral[800], flex: 1 }}>My Loan Applications</Text>
        <TouchableOpacity onPress={loadApps} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: Colors.primary[600], fontWeight: '600' }}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', padding: 32 }}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={{ marginTop: 12, color: Colors.neutral[500] }}>Loading applications...</Text>
        </View>
      ) : !profileId ? (
        <View style={{ backgroundColor: Colors.neutral[0], borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.neutral[200] }}>
          <ClipboardList size={36} color={Colors.neutral[300]} />
          <Text style={{ fontSize: 14, color: Colors.neutral[500], marginTop: 10, textAlign: 'center' }}>Complete your profile first to apply for loans and track applications.</Text>
        </View>
      ) : apps.length === 0 ? (
        <View style={{ backgroundColor: Colors.neutral[0], borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.neutral[200] }}>
          <ClipboardList size={36} color={Colors.neutral[300]} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.neutral[700], marginTop: 12 }}>No Applications Yet</Text>
          <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            Go to the Loans tab to explore available loan products and submit your first application.
          </Text>
        </View>
      ) : (
        apps.map(app => (
          <TouchableOpacity
            key={app.id}
            style={{ backgroundColor: Colors.neutral[0], borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral[200], padding: 14, marginBottom: 10, elevation: 1 }}
            onPress={() => setSelectedApp(app)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary[600] }}>APP-{(app.id || '').slice(0, 8).toUpperCase()}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.neutral[900], marginTop: 2 }}>{app.loan_type}</Text>
              </View>
              <StatusBadge status={app.admin_status || 'pending'} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Text style={{ fontSize: 12, color: Colors.neutral[600] }}>Amount: <Text style={{ fontWeight: '700', color: Colors.primary[700] }}>{formatCurrency(Number(app.loan_amount))}</Text></Text>
              <Text style={{ fontSize: 12, color: Colors.neutral[600] }}>Bank: {app.bank_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.neutral[100], paddingTop: 10 }}>
              <Text style={{ fontSize: 11, color: Colors.neutral[500] }}>Applied: {formatDate(app.created_at)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, color: Colors.primary[600], fontWeight: '600' }}>Track Status</Text>
                <ChevronRight size={14} color={Colors.primary[600]} />
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { t, language } = useLanguage();
  const { logout, user } = useAuth();
  const { profile, loading, refreshProfile } = useProfile();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  // ─── ADMIN GUARD: Redirect admin users to Admin Portal ───
  if (user?.role === 'admin') {
    return <Redirect href="/(tabs)/admin" />;
  }

  const handleOpenEdit = (step = 1) => {
    setEditStep(step);
    setIsEditModalOpen(true);
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout failed:', e); }
  };

  const displayName = profile?.full_name || user?.name || (language === 'ta' ? '\u0bb5\u0bbe\u0da3\u0dd4\u0db8\u0dd9\u0dba\u0dcf\u0dbd\u0dbb\u0dca' : 'Customer');
  const displayPhone = profile?.phone || user?.phone || 'Not Provided';
  const displayEmail = user?.email || 'N/A';
  const displayId = user?.identifier || (profile?.user_id ? `MON${profile.user_id.replace(/\D/g, '').slice(-5)}` : (profile?.id ? profile.id.slice(0, 8).toUpperCase() : 'MON10001'));

  return (
    <View style={styles.container}>
      <Header
        title={t('myProfile')}
        subtitle={language === 'ta' ? '\u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0b9a\u0bc1\u0baf\u0bb5\u0bbf\u0bb5\u0bb0\u0bae\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0bae\u0bc7\u0bb2\u0bbe\u0ba3\u0bcd\u0bae\u0bc8' : 'Verified Profile & Account Management'}
      />

      {/* Top Bar */}
      <View style={styles.topActionsRow}>
        <View style={styles.userInfoBadge}>
          <ShieldCheck size={16} color={Colors.primary[700]} />
          <Text style={styles.userRoleText}>
            {language === 'ta' ? 'சரிபார்க்கப்பட்ட கணக்கு' : 'Verified Customer Account'}
          </Text>
        </View>
        <View style={styles.topRightActions}>
          {activeTab === 'profile' && (
            <TouchableOpacity style={styles.editProfileTopBtn} onPress={() => handleOpenEdit(1)} activeOpacity={0.8}>
              <Pencil size={15} color={Colors.primary[700]} />
              <Text style={styles.editProfileTopBtnText}>{t('editProfile') || 'Edit Profile'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={16} color="#DC2626" />
            <Text style={styles.logoutBtnText}>{t('logout') || 'Log Out'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
        >
          <User size={14} color={activeTab === 'profile' ? Colors.primary[700] : Colors.neutral[500]} />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.tabActive]}
          onPress={() => setActiveTab('applications')}
          activeOpacity={0.8}
        >
          <ClipboardList size={14} color={activeTab === 'applications' ? Colors.primary[700] : Colors.neutral[500]} />
          <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>Applications</Text>
        </TouchableOpacity>
      </View>

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' ? (
        <ApplicationsTab profileId={profile?.id} />
      ) : (
        /* PROFILE TAB — existing content preserved exactly */
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Profile Hero Header Card */}
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <User size={36} color={Colors.primary[700]} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroName}>{displayName}</Text>
                <TouchableOpacity style={styles.heroEditPillBtn} onPress={() => handleOpenEdit(1)} activeOpacity={0.8}>
                  <Pencil size={13} color={Colors.primary[700]} />
                  <Text style={styles.heroEditPillText}>{t('edit') || 'Edit'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.heroId}>Customer ID: {displayId}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>
                    {profile?.farmer_category ? `${profile.farmer_category.toUpperCase()} FARMER` : 'REGISTERED BORROWER'}
                  </Text>
                </View>
                {profile?.credit_score ? (
                  <View style={[styles.heroPill, { backgroundColor: Colors.success[50] }]}>
                    <Text style={[styles.heroPillText, { color: Colors.success[700] }]}>Credit Score: {profile.credit_score}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* 1. Personal Information */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <User size={18} color={Colors.primary[700]} />
                <Text style={styles.cardTitle}>{language === 'ta' ? '\u0ba4\u0ba9\u0bbf\u0ba8\u0baa\u0bb0\u0bcd \u0bb5\u0bbf\u0bb5\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd' : 'Personal Information'}</Text>
              </View>
              <TouchableOpacity style={styles.sectionEditAction} onPress={() => handleOpenEdit(1)} activeOpacity={0.7}>
                <Pencil size={14} color={Colors.primary[700]} />
                <Text style={styles.sectionEditText}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}><Text style={styles.label}>Full Name</Text><Text style={styles.valText}>{displayName}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Customer User ID</Text><Text style={styles.valText}>{displayId}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Contact Phone</Text><Text style={styles.valText}>{displayPhone}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Registered Email</Text><Text style={styles.valText}>{displayEmail}</Text></View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>{language === 'ta' ? '\u0bb5\u0baf\u0ba4\u0bc1 / \u0baa\u0bbe\u0bb2\u0bbf\u0ba9\u0bae\u0bcd' : 'Age / Gender'}</Text>
                <Text style={styles.valText}>
                  {profile?.age ? `${profile.age} ${language === 'ta' ? '\u0bb5\u0baf\u0ba4\u0bc1' : 'yrs'}` : 'N/A'} / {profile?.gender ? (profile.gender.toLowerCase() === 'male' ? (language === 'ta' ? '\u0b86\u0ba3\u0bcd (Male)' : 'Male') : profile.gender.toLowerCase() === 'female' ? (language === 'ta' ? '\u0baa\u0bc6\u0ba3\u0bcd (Female)' : 'Female') : profile.gender.toLowerCase() === 'other' ? (language === 'ta' ? '\u0bae\u0bb1\u0bcd\u0bb1\u0bb5\u0bc8 (Other)' : 'Other') : profile.gender) : 'N/A'}
                </Text>
              </View>
              <View style={styles.gridItem}><Text style={styles.label}>District & State</Text><Text style={styles.valText}>{profile?.district || 'N/A'}, {profile?.state || 'Tamil Nadu'}</Text></View>
            </View>
          </View>

          {/* 2. Agriculture & Farm Details */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Sprout size={18} color={Colors.success[700]} />
                <Text style={styles.cardTitle}>{language === 'ta' ? '\u0bb5\u0bbf\u0bb5\u0b9a\u0bbe\u0baf \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0ba8\u0bbf\u0bb2 \u0bb5\u0bbf\u0bb5\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd' : 'Agriculture & Farm Details'}</Text>
              </View>
              <TouchableOpacity style={styles.sectionEditAction} onPress={() => handleOpenEdit(2)} activeOpacity={0.7}>
                <Pencil size={14} color={Colors.success[700]} />
                <Text style={[styles.sectionEditText, { color: Colors.success[700] }]}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}><Text style={styles.label}>Land Area</Text><Text style={styles.valText}>{profile?.land_size_acres !== null && profile?.land_size_acres !== undefined ? `${profile.land_size_acres} Acres` : '0 Acres'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Land Ownership</Text><Text style={styles.valText}>{profile?.land_ownership || 'Not Specified'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Primary Crops</Text><Text style={styles.valText}>{profile?.crop_type || (profile?.crops && profile.crops.length > 0 ? profile.crops.join(', ') : 'Not Specified')}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Irrigation Source</Text><Text style={styles.valText}>{profile?.irrigation_type || 'Not Specified'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Kisan Credit Card (KCC)</Text><Text style={[styles.valText, { color: profile?.has_kcc ? Colors.primary[700] : Colors.neutral[600], fontWeight: '700' }]}>{profile?.has_kcc ? '\u2713 Active & Linked' : 'Not Linked'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>PMFBY Crop Insurance</Text><Text style={[styles.valText, { color: profile?.has_pmfby ? Colors.accent[700] : Colors.neutral[600], fontWeight: '700' }]}>{profile?.has_pmfby ? '\u2713 Covered' : 'Not Covered'}</Text></View>
            </View>
          </View>

          {/* 3. Financial & Income Information */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Coins size={18} color={Colors.secondary[700]} />
                <Text style={styles.cardTitle}>{language === 'ta' ? '\u0ba8\u0bbf\u0ba4\u0bbf \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0bb5\u0bb0\u0bc1\u0bae\u0bbe\u0ba9 \u0bb5\u0bbf\u0bb5\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd' : 'Financial & Income Details'}</Text>
              </View>
              <TouchableOpacity style={styles.sectionEditAction} onPress={() => handleOpenEdit(3)} activeOpacity={0.7}>
                <Pencil size={14} color={Colors.secondary[700]} />
                <Text style={[styles.sectionEditText, { color: Colors.secondary[700] }]}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}><Text style={styles.label}>Annual Farm Income</Text><Text style={[styles.valText, { color: Colors.primary[700], fontWeight: '700' }]}>\u20b9{(profile?.annual_agricultural_income || 0).toLocaleString('en-IN')}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Other Annual Income</Text><Text style={styles.valText}>\u20b9{(profile?.other_income || 0).toLocaleString('en-IN')}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Existing Active Loans</Text><Text style={styles.valText}>\u20b9{(profile?.existing_loans || 0).toLocaleString('en-IN')}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Monthly EMI Obligations</Text><Text style={styles.valText}>\u20b9{(profile?.existing_monthly_emi || 0).toLocaleString('en-IN')}/mo</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Monthly Living Expenses</Text><Text style={styles.valText}>\u20b9{(profile?.monthly_expenses || 0).toLocaleString('en-IN')}/mo</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Employment / Farming Category</Text><Text style={styles.valText}>{profile?.farming_type || (profile?.farmer_category ? `${profile.farmer_category.toUpperCase()} Farmer` : 'Farmer')}</Text></View>
            </View>
          </View>

          {/* 4. Credit Score & Repayment */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <CreditCard size={18} color={Colors.accent[700]} />
                <Text style={styles.cardTitle}>{language === 'ta' ? '\u0b95\u0b9f\u0ba9\u0bcd \u0bb5\u0bb0\u0bb2\u0bbe\u0bb1\u0bc1 & \u0ba4\u0b95\u0bc1\u0ba4\u0bbf' : 'Credit History & Repayment Track'}</Text>
              </View>
              <TouchableOpacity style={styles.sectionEditAction} onPress={() => handleOpenEdit(4)} activeOpacity={0.7}>
                <Pencil size={14} color={Colors.accent[700]} />
                <Text style={[styles.sectionEditText, { color: Colors.accent[700] }]}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}><Text style={styles.label}>Credit Score</Text><Text style={[styles.valText, { fontWeight: '800', color: Colors.neutral[900] }]}>{profile?.credit_score ? String(profile.credit_score) : (profile?.credit_score_unknown ? 'Unrated / First-time Borrower' : 'Not Provided')}</Text></View>
              <View style={styles.gridItem}><Text style={styles.label}>Repayment Track Record</Text><Text style={[styles.valText, { color: Colors.success[700], fontWeight: '700' }]}>{profile?.repayment_history === 'always_on_time' ? 'Always on Time (Excellent)' : profile?.repayment_history || 'Standard Standing'}</Text></View>
            </View>
          </View>

          {/* 5. Government Schemes */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Landmark size={18} color={Colors.primary[700]} />
                <Text style={styles.cardTitle}>{language === 'ta' ? '\u0b85\u0bb0\u0b9a\u0bc1 \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd' : 'Government Scheme Beneficiary Status'}</Text>
              </View>
            </View>
            <View style={styles.gridContainer}>
              <View style={[styles.gridItem, { width: '100%' }]}><Text style={styles.label}>Active Direct Benefit Schemes</Text><Text style={styles.valText}>{profile?.has_kcc ? 'PM-KISAN Samman Nidhi, Interest Subvention Scheme (ISS)' : 'PM-KISAN Samman Nidhi'}</Text></View>
              <View style={[styles.gridItem, { width: '100%', marginTop: 8 }]}><Text style={styles.label}>Subsidized Credit Status</Text><Text style={[styles.valText, { color: Colors.success[700] }]}>{profile?.has_kcc ? 'Eligible for 3% Prompt Repayment Incentive under Interest Subvention Scheme (ISS)' : 'Eligible for KCC Concessional Agricultural Credit'}</Text></View>
            </View>
          </View>

          {/* Edit Profile CTA */}
          <TouchableOpacity style={styles.mainEditProfileBtn} onPress={() => handleOpenEdit(1)} activeOpacity={0.85}>
            <Pencil size={18} color="#fff" />
            <Text style={styles.mainEditProfileBtnText}>{language === 'ta' ? '\u0b9a\u0bc1\u0baf\u0bb5\u0bbf\u0bb5\u0bb0\u0ba4\u0bcd\u0ba4\u0bc8\u0ba4\u0bcd \u0ba4\u0bbf\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bbf \u0baa\u0bc1\u0ba4\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd' : 'Edit & Update Complete Profile'}</Text>
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity style={styles.bottomLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.bottomLogoutText}>{language === 'ta' ? '\u0b95\u0ba3\u0b95\u0bcd\u0b95\u0bbf\u0bb2\u0bbf\u0bb0\u0bc1\u0ba8\u0bcd\u0ba4\u0bc1 \u0bb5\u0bc6\u0bb3\u0bbf\u0baf\u0bc7\u0bb1\u0bc1' : 'Sign Out of MonitorX'}</Text>
          </TouchableOpacity>
          <DisclaimerBanner />
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={false} onRequestClose={() => setIsEditModalOpen(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <ProfileWizard
            initialStep={editStep}
            onCancel={() => setIsEditModalOpen(false)}
            onSuccess={async () => { setIsEditModalOpen(false); if (refreshProfile) await refreshProfile(); }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  modalSafeArea: { flex: 1, backgroundColor: Colors.neutral[50] },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  topActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.neutral[0], borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
  topRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userInfoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary[50], paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary[200] },
  userRoleText: { fontSize: 12, fontWeight: '700', color: Colors.primary[800] },
  editProfileTopBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primary[50], borderWidth: 1, borderColor: Colors.primary[200] },
  editProfileTopBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary[800] },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  logoutBtnText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  tabSwitcher: { flexDirection: 'row', backgroundColor: Colors.neutral[0], borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary[600] },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.neutral[500] },
  tabTextActive: { color: Colors.primary[700] },
  heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral[0], borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1, borderColor: Colors.neutral[200], marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, gap: 14 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary[50], borderWidth: 1.5, borderColor: Colors.primary[200], justifyContent: 'center', alignItems: 'center' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroName: { fontSize: 18, fontWeight: '800', color: Colors.neutral[900], flex: 1 },
  heroEditPillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary[50], borderWidth: 1, borderColor: Colors.primary[200], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  heroEditPillText: { fontSize: 11, fontWeight: '700', color: Colors.primary[800] },
  heroId: { fontSize: 12, color: Colors.neutral[500], marginTop: 2, fontWeight: '500' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  heroPill: { backgroundColor: Colors.primary[100], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  heroPillText: { fontSize: 10, fontWeight: '700', color: Colors.primary[800] },
  sectionCard: { backgroundColor: Colors.neutral[0], borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1, borderColor: Colors.neutral[200], marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.neutral[100], marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.neutral[900] },
  sectionEditAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.neutral[50], borderWidth: 1, borderColor: Colors.neutral[200] },
  sectionEditText: { fontSize: 11, fontWeight: '700', color: Colors.primary[700] },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  gridItem: { width: '50%', paddingRight: 8 },
  label: { fontSize: 11, color: Colors.neutral[500], fontWeight: '500', marginBottom: 2 },
  valText: { fontSize: 13, color: Colors.neutral[800], fontWeight: '600' },
  mainEditProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary[600], borderRadius: BorderRadius.md, paddingVertical: 14, marginTop: 6, marginBottom: 10, shadowColor: Colors.primary[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
  mainEditProfileBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bottomLogoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: BorderRadius.md, paddingVertical: 12, marginTop: 4, marginBottom: 16 },
  bottomLogoutText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
});
