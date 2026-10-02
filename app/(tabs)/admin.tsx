import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  StatusBar,
} from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { Colors } from '@/lib/theme';
import {
  supabase,
  FarmerProfile,
  LoanApplication,
  EligibilityResult,
  AdminActivityLog,
} from '@/lib/supabase';
import { deserializeFromSupabase } from '@/lib/profile-context';
import { governmentSchemes } from '@/lib/schemes';
import { assessLoanEligibility } from '@/lib/eligibility';
import {
  Search,
  Users,
  ShieldCheck,
  FileText,
  Landmark,
  Wallet,
  RefreshCw,
  ChevronRight,
  X,
  Phone,
  MapPin,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  UserCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Gavel,
  ArrowLeft,
  CreditCard,
  Calendar,
  Activity,
  Menu,
} from 'lucide-react-native';

// ─── ADMIN COLOR PALETTE (navy/slate — deliberately different from customer green) ───
const A = {
  bg: '#0F172A',
  sidebar: '#1E293B',
  header: '#1E293B',
  card: '#FFFFFF',
  pageBg: '#F1F5F9',
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  review: '#8B5CF6',
  reviewLight: '#EDE9FE',
  text: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  sidebarText: '#CBD5E1',
  sidebarActiveBg: 'rgba(59,130,246,0.15)',
};

type AdminSection = 'dashboard' | 'applications' | 'customers' | 'profile';
type AppWithFarmer = LoanApplication & {
  farmer?: FarmerProfile;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_district?: string;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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

function formatCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(d?: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

function InfoItem({ label, value, highlight, wide }: { label: string; value: string; highlight?: boolean; wide?: boolean }) {
  return (
    <View style={{ width: wide ? '100%' : '50%', paddingRight: 10, marginBottom: 14 }}>
      <Text style={{ fontSize: 11, color: A.textLight, fontWeight: '500', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: highlight ? A.primary : A.text, fontWeight: highlight ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminScreen() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateToSection = (section: AdminSection, filter?: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected') => {
    if (filter) {
      setApplicationFilter(filter);
    }
    setActiveSection(section);
    setSidebarOpen(false);
  };

  if (!user || user.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: A.pageBg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Lock size={56} color={A.danger} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: A.danger, marginTop: 16, textAlign: 'center' }}>Access Denied</Text>
        <Text style={{ fontSize: 14, color: A.textMid, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
          This portal is restricted to authorised bank administrators only.
        </Text>
      </View>
    );
  }

  type NavItem = { section: AdminSection; label: string };
  const navItems: NavItem[] = [
    { section: 'dashboard', label: 'Dashboard' },
    { section: 'applications', label: 'Applications' },
    { section: 'customers', label: 'Customers' },
    { section: 'profile', label: 'Admin Profile' },
  ];

  const navIcons: Record<AdminSection, React.ReactNode> = {
    dashboard: <LayoutDashboard size={18} />,
    applications: <ClipboardList size={18} />,
    customers: <Users size={18} />,
    profile: <UserCircle size={18} />,
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection user={user} onNavigate={navigateToSection} />;
      case 'applications': return <ApplicationsSection user={user} initialFilter={applicationFilter} onFilterChange={setApplicationFilter} />;
      case 'customers': return <CustomersSection user={user} />;
      case 'profile': return <AdminProfileSection user={user} logout={logout} onNavigate={navigateToSection} />;
      default: return null;
    }
  };

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={A.bg} />
      {/* HEADER */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <TouchableOpacity style={S.menuBtn} onPress={() => setSidebarOpen(!sidebarOpen)} activeOpacity={0.7}>
            <Menu size={20} color="#fff" />
          </TouchableOpacity>
          <ShieldCheck size={18} color={A.primary} />
          <Text style={S.headerBrand}>MonitorX</Text>
          <View style={S.adminPill}><Text style={S.adminPillTxt}>ADMIN PORTAL</Text></View>
        </View>
        <View style={S.headerRight}>
          <View style={S.nameTag}>
            <UserCircle size={14} color={A.primary} />
            <Text style={S.nameTagTxt} numberOfLines={1}>{user?.name || user?.identifier || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={S.logoutHdr} onPress={logout} activeOpacity={0.8}>
            <LogOut size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={S.body}>
        {/* SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setSidebarOpen(false)} />
        )}
        {/* SIDEBAR */}
        <View style={[S.sidebar, sidebarOpen && S.sidebarOpen]}>
          <Text style={S.sidebarHdrTxt}>NAVIGATION</Text>
          {navItems.map(item => {
            const active = activeSection === item.section;
            return (
              <TouchableOpacity
                key={item.section}
                style={[S.navItem, active && S.navItemActive]}
                onPress={() => { setActiveSection(item.section); setSidebarOpen(false); }}
                activeOpacity={0.8}
              >
                <View style={{ opacity: active ? 1 : 0.6 }}>
                  {React.cloneElement(navIcons[item.section] as React.ReactElement<any>, { color: active ? A.primary : A.sidebarText })}
                </View>
                <Text style={[S.navLabel, active && S.navLabelActive]}>{item.label}</Text>
                {active && <View style={S.navIndicator} />}
              </TouchableOpacity>
            );
          })}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={S.sidebarLogout} onPress={logout} activeOpacity={0.8}>
            <LogOut size={16} color="#f87171" />
            <Text style={S.sidebarLogoutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        {/* MAIN */}
        <View style={S.main}>{renderSection()}</View>
      </View>

      {/* BOTTOM NAV */}
      <View style={S.bottomNav}>
        {navItems.map(item => {
          const active = activeSection === item.section;
          return (
            <TouchableOpacity key={item.section} style={S.bottomNavItem} onPress={() => setActiveSection(item.section)} activeOpacity={0.8}>
              {React.cloneElement(navIcons[item.section] as React.ReactElement<any>, { color: active ? A.primary : '#64748B' })}
              <Text style={[S.bottomNavLbl, active && S.bottomNavLblActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardSection({ user, onNavigate }: { user: any; onNavigate?: (section: AdminSection, filter?: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected') => void }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, review: 0, customers: 0, reqAmt: 0, appAmt: 0 });
  const [recentApps, setRecentApps] = useState<AppWithFarmer[]>([]);
  const [activity, setActivity] = useState<AdminActivityLog[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppWithFarmer | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [appsRes, custRes, actRes] = await Promise.all([
        supabase.from('loan_applications').select('*, farmer_profiles(*)').order('created_at', { ascending: false }),
        supabase.from('farmer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(8),
      ]);
      const rawApps = (appsRes.data || []) as any[];
      const apps = rawApps.map((a: any) => {
        const normStatus = normalizeStatus(a.status || a.admin_status);
        return {
          ...a,
          status: normStatus,
          admin_status: normStatus,
          farmer: a.farmer_profiles ? deserializeFromSupabase(a.farmer_profiles) : undefined,
          farmer_name: a.farmer_profiles?.full_name || 'Unknown',
          farmer_phone: a.farmer_profiles?.phone || '',
          farmer_district: a.farmer_profiles?.district || '',
        };
      });
      setStats({
        total: apps.length,
        pending: apps.filter((a: any) => a.admin_status === 'pending').length,
        approved: apps.filter((a: any) => a.admin_status === 'approved').length,
        rejected: apps.filter((a: any) => a.admin_status === 'rejected').length,
        review: apps.filter((a: any) => a.admin_status === 'under_review').length,
        customers: custRes.count || 0,
        reqAmt: apps.reduce((s: number, a: any) => s + Number(a.loan_amount || 0), 0),
        appAmt: apps.filter((a: any) => a.admin_status === 'approved').reduce((s: number, a: any) => s + Number(a.loan_amount || 0), 0),
      });
      setRecentApps(apps.slice(0, 8));
      setActivity((actRes.data || []) as AdminActivityLog[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (selectedApp) {
    return (
      <ApplicationDetailModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onDecision={() => {
          setSelectedApp(null);
          load();
        }}
        adminUser={user}
        readOnly={false}
      />
    );
  }

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={A.primary} /><Text style={{ marginTop: 12, color: A.textMid }}>Loading dashboard...</Text></View>;

  return (
    <ScrollView style={DS.scroll} showsVerticalScrollIndicator={false}>
      <View style={DS.pageHdr}><Text style={DS.pageTitle}>Dashboard Overview</Text><Text style={DS.pageSub}>MonitorX Loan Management System</Text></View>

      {/* STAT CARDS */}
      <View style={DS.statsGrid}>
        {[
          { label: 'Total Applications', val: stats.total, color: A.primary, bg: A.primaryLight, section: 'applications' as const, filter: 'all' as const },
          { label: 'Pending Review', val: stats.pending, color: A.warning, bg: A.warningLight, section: 'applications' as const, filter: 'pending' as const },
          { label: 'Approved', val: stats.approved, color: A.success, bg: A.successLight, section: 'applications' as const, filter: 'approved' as const },
          { label: 'Rejected', val: stats.rejected, color: A.danger, bg: A.dangerLight, section: 'applications' as const, filter: 'rejected' as const },
          { label: 'Under Review', val: stats.review, color: A.review, bg: A.reviewLight, section: 'applications' as const, filter: 'under_review' as const },
          { label: 'Customers', val: stats.customers, color: '#0891B2', bg: '#ECFEFF', section: 'customers' as const, filter: undefined },
        ].map((c, i) => (
          <TouchableOpacity
            key={i}
            style={[DS.statCard]}
            onPress={() => onNavigate?.(c.section, c.filter)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[DS.statVal, { color: c.color }]}>{c.val}</Text>
              <ChevronRight size={14} color={c.color} />
            </View>
            <Text style={DS.statLbl}>{c.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={DS.statCardWide}>
          <View style={{ flex: 1 }}><Text style={DS.statLbl}>Loan Amount Requested</Text><Text style={[DS.statVal, { color: A.primary, fontSize: 18 }]}>{formatCurrency(stats.reqAmt)}</Text></View>
          <View style={{ width: 1, backgroundColor: A.border, marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}><Text style={DS.statLbl}>Loan Amount Approved</Text><Text style={[DS.statVal, { color: A.success, fontSize: 18 }]}>{formatCurrency(stats.appAmt)}</Text></View>
        </View>
      </View>

      {/* RECENT APPLICATIONS */}
      <View style={DS.card}>
        <View style={DS.cardHdr}>
          <ClipboardList size={18} color={A.primary} />
          <Text style={DS.cardTitle}>Recent Applications</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={load} activeOpacity={0.7}><RefreshCw size={16} color={A.textMid} /></TouchableOpacity>
        </View>
        {recentApps.length === 0 ? (
          <View style={DS.empty}><FileText size={32} color={A.border} /><Text style={DS.emptyTxt}>No applications yet</Text></View>
        ) : recentApps.map(app => (
          <TouchableOpacity key={app.id} style={DS.appRow} onPress={() => setSelectedApp(app)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={DS.appId}>APP-{(app.id || '').slice(0, 6).toUpperCase()}</Text>
              <Text style={DS.appName}>{app.farmer_name}</Text>
              <Text style={DS.appMeta}>{app.loan_type} · {formatCurrency(Number(app.loan_amount))}</Text>
              <Text style={DS.appDate}>{formatDate(app.created_at)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <StatusBadge status={app.admin_status || 'pending'} />
              <ChevronRight size={16} color={A.textLight} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* GOVERNMENT SCHEMES */}
      <View style={DS.card}>
        <View style={DS.cardHdr}>
          <Landmark size={18} color={A.primary} />
          <Text style={DS.cardTitle}>Government Schemes Overview</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 14, borderBottomWidth: 1, borderBottomColor: A.border }}>
          {[{ label: 'Central Schemes', val: governmentSchemes.filter(s => s.type === 'central').length }, { label: 'Tamil Nadu', val: governmentSchemes.filter(s => s.type === 'state').length }, { label: 'Total', val: governmentSchemes.length }].map((s, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: A.primary }}>{s.val}</Text>
              <Text style={{ fontSize: 11, color: A.textMid, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        {governmentSchemes.slice(0, 5).map(s => (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: A.border }}>
            <View style={{ backgroundColor: s.type === 'central' ? A.primaryLight : '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, minWidth: 65, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: s.type === 'central' ? A.primary : Colors.primary[700] }}>{s.type === 'central' ? 'Central' : 'TN State'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: A.text }} numberOfLines={1}>{s.name}</Text>
              <Text style={{ fontSize: 11, color: A.textMid }} numberOfLines={1}>{s.department}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* RECENT ACTIVITY */}
      <View style={DS.card}>
        <View style={DS.cardHdr}>
          <Activity size={18} color={A.primary} />
          <Text style={DS.cardTitle}>Recent Admin Activity</Text>
        </View>
        {activity.length === 0 ? (
          <View style={DS.empty}><Activity size={32} color={A.border} /><Text style={DS.emptyTxt}>No activity recorded yet</Text></View>
        ) : activity.map(act => (
          <View key={act.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: A.border }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: act.action_type === 'approved' ? A.success : act.action_type === 'rejected' ? A.danger : act.action_type === 'review' ? A.review : A.primary }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: A.text, fontWeight: '500' }}>{act.description}</Text>
              <Text style={{ fontSize: 11, color: A.textLight, marginTop: 2 }}>{formatDate(act.created_at)} · {act.admin_name || 'Admin'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function ApplicationsSection({
  user,
  initialFilter = 'all',
  onFilterChange,
}: {
  user: any;
  initialFilter?: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';
  onFilterChange?: (filter: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected') => void;
}) {
  const [apps, setApps] = useState<AppWithFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>(initialFilter);
  const [selectedApp, setSelectedApp] = useState<AppWithFarmer | null>(null);

  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*, farmer_profiles(*)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setApps(data.map((a: any) => {
          const normStatus = normalizeStatus(a.status || a.admin_status);
          return {
            ...a,
            status: normStatus,
            admin_status: normStatus,
            farmer: a.farmer_profiles ? deserializeFromSupabase(a.farmer_profiles) : undefined,
            farmer_name: a.farmer_profiles?.full_name || 'Unknown',
            farmer_phone: a.farmer_profiles?.phone || '',
            farmer_district: a.farmer_profiles?.district || '',
          };
        }));
      } else if (error) {
        console.error('Error fetching loan applications:', error);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let r = [...apps];
    if (statusFilter !== 'all') r = r.filter(a => (a.admin_status || 'pending') === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(a => {
        const name = (a.farmer_name || '').toLowerCase();
        const loanType = (a.loan_type || '').toLowerCase();
        const rawId = (a.id || '').toLowerCase();
        const formattedId = `app-${rawId.slice(0, 8)}`.toLowerCase();
        const phone = (a.farmer_phone || '').toLowerCase();
        const bank = (a.bank_name || '').toLowerCase();
        return name.includes(q) || loanType.includes(q) || rawId.includes(q) || formattedId.includes(q) || phone.includes(q) || bank.includes(q);
      });
    }
    return r;
  }, [apps, search, statusFilter]);

  const filterTabs = [{ key: 'all' as const, label: 'All' }, { key: 'pending' as const, label: 'Pending' }, { key: 'under_review' as const, label: 'Under Review' }, { key: 'approved' as const, label: 'Approved' }, { key: 'rejected' as const, label: 'Rejected' }];

  const handleSelectFilter = (key: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected') => {
    setStatusFilter(key);
    onFilterChange?.(key);
  };

  if (selectedApp) {
    return <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} onDecision={() => { setSelectedApp(null); loadApps(); }} adminUser={user} readOnly={false} />;
  }

  return (
    <ScrollView style={DS.scroll} showsVerticalScrollIndicator={false}>
      <View style={DS.pageHdr}><Text style={DS.pageTitle}>Loan Applications</Text><Text style={DS.pageSub}>Review and manage customer loan applications</Text></View>

      <View style={AP.searchBar}>
        <Search size={16} color={A.textLight} />
        <TextInput style={AP.searchInput} placeholder="Search by name, loan type, application ID..." placeholderTextColor={A.textLight} value={search} onChangeText={setSearch} returnKeyType="search" enterKeyHint="search" blurOnSubmit={true} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><X size={16} color={A.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {filterTabs.map(tab => (
          <TouchableOpacity key={tab.key} style={[AP.filterTab, statusFilter === tab.key && AP.filterTabActive]} onPress={() => handleSelectFilter(tab.key)} activeOpacity={0.7}>
            <Text style={[AP.filterTabTxt, statusFilter === tab.key && AP.filterTabTxtActive]}>
              {tab.label}{tab.key !== 'all' ? ` (${apps.filter(a => (a.admin_status || 'pending') === tab.key).length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, color: A.textMid }}>{loading ? 'Loading...' : `${filtered.length} application${filtered.length !== 1 ? 's' : ''} found`}</Text>
        <TouchableOpacity onPress={loadApps} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.7}>
          <RefreshCw size={14} color={A.primary} />
          <Text style={{ fontSize: 13, color: A.primary, fontWeight: '600' }}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={DS.empty}><ActivityIndicator size="large" color={A.primary} /><Text style={{ marginTop: 12, color: A.textMid }}>Loading...</Text></View>
      ) : filtered.length === 0 ? (
        <View style={DS.empty}><ClipboardList size={40} color={A.border} /><Text style={DS.emptyTxt}>No applications found</Text></View>
      ) : (
        filtered.map(app => (
          <TouchableOpacity key={app.id} style={AP.appCard} onPress={() => setSelectedApp(app)} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: A.primary }}>APP-{(app.id || '').slice(0, 8).toUpperCase()}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: A.text, marginTop: 2 }}>{app.farmer_name}</Text>
              </View>
              <StatusBadge status={app.admin_status || 'pending'} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {[{ Icon: Wallet, txt: app.loan_type }, { Icon: TrendingUp, txt: formatCurrency(Number(app.loan_amount)) }, { Icon: MapPin, txt: app.farmer_district || 'N/A' }, { Icon: Calendar, txt: formatDate(app.created_at) }].map(({ Icon, txt }, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon size={12} color={A.textLight} />
                  <Text style={{ fontSize: 12, color: A.textMid }}>{txt}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: A.border, paddingTop: 10 }}>
              <Text style={{ fontSize: 12, color: A.textMid }}>{app.bank_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, color: A.primary, fontWeight: '700' }}>Review Application</Text>
                <ChevronRight size={14} color={A.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION DETAIL + DECISION
// ═══════════════════════════════════════════════════════════════════════════════
function ApplicationDetailModal({ app, onClose, onDecision, adminUser, readOnly }: {
  app: AppWithFarmer; onClose: () => void; onDecision: () => void; adminUser: any; readOnly?: boolean;
}) {
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(app.farmer || null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (app.farmer_id) {
      setLoading(true);
      Promise.all([
        supabase.from('farmer_profiles').select('*').eq('id', app.farmer_id!).maybeSingle(),
        supabase.from('eligibility_results').select('*').eq('farmer_id', app.farmer_id!).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]).then(([pRes, eRes]) => {
        let fProfile = app.farmer || null;
        if (pRes.data) {
          fProfile = deserializeFromSupabase(pRes.data);
          setFarmerProfile(fProfile);
        }
        if (eRes.data) {
          setEligibility(eRes.data as EligibilityResult);
        } else if (fProfile) {
          try {
            const computed = assessLoanEligibility(
              fProfile,
              app.loan_type,
              Number(app.loan_amount || 0),
              Number(app.tenure_months || 12)
            );
            setEligibility(computed);
          } catch (err) {
            console.error('Eligibility assessment calculation error:', err);
          }
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [app.farmer_id]);

  const handleMarkReview = async () => {
    const adminName = adminUser?.name || adminUser?.identifier || 'Admin Officer';
    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({ status: 'under_review' })
      .eq('id', app.id!);

    if (updateError) {
      Alert.alert('Error', updateError.message || 'Failed to update status');
      return;
    }

    if (app.farmer_id) {
      try {
        await supabase.from('notifications').insert({
          farmer_id: app.farmer_id,
          title: 'Application Under Review',
          message: `Your loan application APP-${(app.id || '').slice(0, 6).toUpperCase()} is now under review by our loan officer.`,
          type: 'info',
          is_read: false,
        });
      } catch (err) {
        console.warn('Failed to insert notification:', err);
      }
    }
    try {
      await supabase.from('admin_activity_log').insert({
        admin_id: adminUser?.id || 'admin',
        admin_name: adminName,
        action_type: 'review',
        description: `Started review of APP-${(app.id || '').slice(0, 6).toUpperCase()} for ${app.farmer_name || farmerProfile?.full_name || 'Customer'}`,
        entity_type: 'loan_application',
        entity_id: app.id,
      });
    } catch {}
    Alert.alert('Under Review', 'Application marked as under review. Customer notified.', [{ text: 'OK', onPress: onDecision }]);
  };

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (deciding) return;
    if (decision === 'reject' && !rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason.');
      return;
    }
    setDeciding(true);
    try {
      const adminName = adminUser?.name || adminUser?.identifier || 'Admin Officer';
      const newStatus = decision === 'approve' ? 'approved' : 'rejected';
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          status: newStatus,
        })
        .eq('id', app.id!);

      if (updateError) throw updateError;

      if (app.farmer_id) {
        const appCode = `APP-${(app.id || '').slice(0, 6).toUpperCase()}`;
        const msg =
          decision === 'approve'
            ? `Your loan application ${appCode} for ${formatCurrency(Number(app.loan_amount))} has been approved.${adminNote.trim() ? ` Note: ${adminNote.trim()}` : ''}`
            : `Your loan application ${appCode} has been rejected. Reason: ${rejectionReason.trim()}`;
        try {
          await supabase.from('notifications').insert({
            farmer_id: app.farmer_id,
            title: decision === 'approve' ? 'Loan Application Approved' : 'Loan Application Rejected',
            message: msg,
            type: decision === 'approve' ? 'success' : 'warning',
            is_read: false,
          });
        } catch (err) {
          console.warn('Failed to insert notification:', err);
        }
      }
      try {
        await supabase.from('admin_activity_log').insert({
          admin_id: adminUser?.id || 'admin',
          admin_name: adminName,
          action_type: decision,
          description: `${decision === 'approve' ? 'Approved' : 'Rejected'} APP-${(app.id || '').slice(0, 6).toUpperCase()} for ${app.farmer_name || farmerProfile?.full_name || 'Customer'} — ${formatCurrency(Number(app.loan_amount))}`,
          entity_type: 'loan_application',
          entity_id: app.id,
          metadata: { loan_type: app.loan_type, loan_amount: app.loan_amount },
        });
      } catch {}
      setShowConfirm(null);
      Alert.alert(
        decision === 'approve' ? '✅ Application Approved' : '❌ Application Rejected',
        decision === 'approve'
          ? 'Loan application approved successfully. Customer has been notified.'
          : 'Loan application rejected. Customer has been notified with the reason.',
        [{ text: 'OK', onPress: onDecision }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to process decision.');
    } finally {
      setDeciding(false);
    }
  };

  const currentStatus = normalizeStatus(app.status || app.admin_status);

  return (
    <View style={{ flex: 1, backgroundColor: A.pageBg }}>
      <View style={DT.hdr}>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }} activeOpacity={0.7}><ArrowLeft size={20} color={A.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={DT.hdrTitle}>Application Review</Text>
          <Text style={DT.hdrSub}>APP-{(app.id || '').slice(0, 8).toUpperCase()}</Text>
        </View>
        <StatusBadge status={currentStatus} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Customer Info */}
        <View style={DT.section}>
          <View style={DT.sectHdr}><Users size={16} color={A.primary} /><Text style={DT.sectTitle}>Customer Information</Text></View>
          {loading ? <ActivityIndicator color={A.primary} /> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <InfoItem label="Full Name" value={farmerProfile?.full_name || app.farmer_name || 'N/A'} />
              <InfoItem label="Phone" value={farmerProfile?.phone || 'N/A'} />
              <InfoItem label="Location" value={`${farmerProfile?.district || ''}, ${farmerProfile?.state || 'Tamil Nadu'}`} />
              <InfoItem label="Farmer Category" value={(farmerProfile?.farmer_category || 'N/A').toUpperCase()} />
              <InfoItem label="Land Area" value={`${farmerProfile?.land_size_acres || 0} Acres`} />
              <InfoItem label="Crops" value={farmerProfile?.crops?.join(', ') || farmerProfile?.crop_type || 'N/A'} />
              <InfoItem label="Annual Income" value={formatCurrency(farmerProfile?.annual_agricultural_income || 0)} />
              <InfoItem label="Credit Score" value={farmerProfile?.credit_score ? String(farmerProfile.credit_score) : 'Not Provided'} />
              <InfoItem label="Existing Loans" value={formatCurrency(farmerProfile?.existing_loans || 0)} />
              <InfoItem label="KCC Status" value={farmerProfile?.has_kcc ? '✓ Active' : 'Not Linked'} />
            </View>
          )}
        </View>
        {/* Loan Info */}
        <View style={DT.section}>
          <View style={DT.sectHdr}><Wallet size={16} color={A.primary} /><Text style={DT.sectTitle}>Loan Application Details</Text></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <InfoItem label="Loan Type" value={app.loan_type} />
            <InfoItem label="Bank / Lender" value={app.bank_name} />
            <InfoItem label="Requested Amount" value={formatCurrency(Number(app.loan_amount))} highlight />
            <InfoItem label="Interest Rate" value={app.interest_rate ? `${app.interest_rate}% p.a.` : 'N/A'} />
            <InfoItem label="Tenure" value={app.tenure_months ? `${app.tenure_months} months` : 'N/A'} />
            <InfoItem label="Purpose" value={app.purpose || 'Agricultural purposes'} />
            <InfoItem label="Applied On" value={formatDate(app.created_at)} />
          </View>
        </View>
        {/* Eligibility Assessment */}
        {eligibility && (
          <View style={DT.section}>
            <View style={DT.sectHdr}><BarChart3 size={16} color={A.primary} /><Text style={DT.sectTitle}>MonitorX Eligibility Assessment (Decision Support)</Text></View>
            <View style={{ backgroundColor: eligibility.eligibility_status === 'Eligible' || eligibility.eligibility_status === 'likely_eligible' ? A.successLight : eligibility.eligibility_status === 'Conditionally Eligible' || eligibility.eligibility_status === 'potentially_eligible' ? A.warningLight : A.dangerLight, borderRadius: 10, padding: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: eligibility.eligibility_status === 'Eligible' || eligibility.eligibility_status === 'likely_eligible' ? A.success : eligibility.eligibility_status === 'Conditionally Eligible' || eligibility.eligibility_status === 'potentially_eligible' ? A.warning : A.danger }}>
                {eligibility.eligibility_status === 'likely_eligible' ? 'Likely Eligible' : eligibility.eligibility_status === 'potentially_eligible' ? 'Potentially Eligible' : eligibility.eligibility_status}
              </Text>
              <Text style={{ fontSize: 13, color: A.textMid, marginTop: 4 }}>Score: {eligibility.eligibility_score}/100 · Risk: {(eligibility.risk_level || '').replace('_', ' ').toUpperCase()}</Text>
              <Text style={{ fontSize: 11, color: A.textMid, marginTop: 6, fontStyle: 'italic' }}>⚠️ System AI recommendation only. The authorized bank officer makes the final decision.</Text>
            </View>
          </View>
        )}
        {/* Decision Record */}
        {(currentStatus === 'approved' || currentStatus === 'rejected') && (
          <View style={DT.section}>
            <View style={DT.sectHdr}><Gavel size={16} color={A.primary} /><Text style={DT.sectTitle}>Decision Record</Text></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <InfoItem label="Decision" value={currentStatus === 'approved' ? '✅ Approved' : '❌ Rejected'} highlight />
              <InfoItem label="Decided By" value={app.decided_by || 'Admin Officer'} />
              <InfoItem label="Decision Date" value={formatDate(app.decided_at)} />
              {app.admin_note ? <InfoItem label="Admin Note" value={app.admin_note} wide /> : null}
              {app.rejection_reason ? <InfoItem label="Rejection Reason" value={app.rejection_reason} wide /> : null}
            </View>
          </View>
        )}
        {/* Action Buttons */}
        {!readOnly && currentStatus !== 'approved' && currentStatus !== 'rejected' && (
          <View style={DT.section}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: A.text, marginBottom: 4 }}>Admin Decision</Text>
            <Text style={{ fontSize: 13, color: A.textMid, marginBottom: 16, lineHeight: 19 }}>Review the application details and eligibility assessment above before making a decision.</Text>
            {currentStatus === 'pending' && (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: A.reviewLight, borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 10, paddingVertical: 12, marginBottom: 10 }} onPress={handleMarkReview} activeOpacity={0.8}>
                <Eye size={16} color={A.review} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: A.review }}>Mark as Under Review</Text>
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: A.success, borderRadius: 10, paddingVertical: 14 }} onPress={() => setShowConfirm('approve')} activeOpacity={0.8}>
                <CheckCircle size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Approve Application</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: A.danger, borderRadius: 10, paddingVertical: 14 }} onPress={() => setShowConfirm('reject')} activeOpacity={0.8}>
                <XCircle size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Reject Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
      {/* Confirm Modal */}
      <Modal visible={!!showConfirm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: A.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: A.text, marginBottom: 6 }}>{showConfirm === 'approve' ? '✅ Confirm Approval' : '❌ Confirm Rejection'}</Text>
            <Text style={{ fontSize: 13, color: A.textMid, marginBottom: 16 }}>APP-{(app.id || '').slice(0, 8).toUpperCase()} · {app.farmer_name} · {formatCurrency(Number(app.loan_amount))}</Text>
            {showConfirm === 'approve' && <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: A.text, marginBottom: 6 }}>Approval Note (optional)</Text>
              <TextInput style={{ borderWidth: 1, borderColor: A.border, borderRadius: 8, padding: 10, fontSize: 14, color: A.text, minHeight: 80, textAlignVertical: 'top', marginBottom: 16, backgroundColor: A.pageBg }} placeholder="Add a note for the customer..." placeholderTextColor={A.textLight} multiline value={adminNote} onChangeText={setAdminNote} />
            </>}
            {showConfirm === 'reject' && <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: A.text, marginBottom: 6 }}>Rejection Reason (required)</Text>
              <TextInput style={{ borderWidth: 1, borderColor: A.border, borderRadius: 8, padding: 10, fontSize: 14, color: A.text, minHeight: 80, textAlignVertical: 'top', marginBottom: 16, backgroundColor: A.pageBg }} placeholder="Provide a clear reason for rejection..." placeholderTextColor={A.textLight} multiline value={rejectionReason} onChangeText={setRejectionReason} />
            </>}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: A.pageBg, borderWidth: 1, borderColor: A.border }} onPress={() => { setShowConfirm(null); setAdminNote(''); setRejectionReason(''); }} activeOpacity={0.8}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: A.textMid }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: showConfirm === 'approve' ? A.success : A.danger }} onPress={() => handleDecision(showConfirm!)} disabled={deciding} activeOpacity={0.8}>
                {deciding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{showConfirm === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function CustomersSection({ user }: { user: any }) {
  const [customers, setCustomers] = useState<FarmerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FarmerProfile | null>(null);
  const [custApps, setCustApps] = useState<LoanApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppWithFarmer | null>(null);

  useEffect(() => {
    supabase.from('farmer_profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCustomers((data || []).map((d: any) => deserializeFromSupabase(d)));
      setLoading(false);
    });
  }, []);

  const openCustomer = (c: FarmerProfile) => {
    setSelected(c);
    if (!c.id) return;
    setAppsLoading(true);
    supabase.from('loan_applications').select('*').eq('farmer_id', c.id).order('created_at', { ascending: false }).then(({ data }) => {
      const custLoans = (data || []).map((a: any) => {
        const normStatus = normalizeStatus(a.status || a.admin_status);
        return {
          ...a,
          status: normStatus,
          admin_status: normStatus,
        };
      });
      setCustApps(custLoans as LoanApplication[]);
      setAppsLoading(false);
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.district || '').toLowerCase().includes(q));
  }, [customers, search]);

  if (selectedApp) {
    return (
      <ApplicationDetailModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onDecision={() => {
          setSelectedApp(null);
          if (selected?.id) openCustomer(selected);
        }}
        adminUser={user}
        readOnly={false}
      />
    );
  }

  if (selected) {
    return (
      <View style={{ flex: 1, backgroundColor: A.pageBg }}>
        <View style={DT.hdr}>
          <TouchableOpacity onPress={() => setSelected(null)} style={{ padding: 4 }} activeOpacity={0.7}><ArrowLeft size={20} color={A.text} /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={DT.hdrTitle}>Customer Profile</Text><Text style={DT.hdrSub}>{selected.full_name}</Text></View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={DT.section}>
            <View style={DT.sectHdr}><Users size={16} color={A.primary} /><Text style={DT.sectTitle}>Personal Details</Text></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <InfoItem label="Full Name" value={selected.full_name} />
              <InfoItem label="Phone" value={selected.phone || 'N/A'} />
              <InfoItem label="Location" value={`${selected.district || ''}, ${selected.state || 'Tamil Nadu'}`} />
              <InfoItem label="Farmer Category" value={(selected.farmer_category || 'N/A').toUpperCase()} />
              <InfoItem label="Land Area" value={`${selected.land_size_acres || 0} Acres (${selected.land_ownership || 'N/A'})`} />
              <InfoItem label="Crops" value={selected.crops?.join(', ') || selected.crop_type || 'N/A'} />
            </View>
          </View>
          <View style={DT.section}>
            <View style={DT.sectHdr}><CreditCard size={16} color={A.primary} /><Text style={DT.sectTitle}>Financial Profile</Text></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <InfoItem label="Annual Income" value={formatCurrency(selected.annual_agricultural_income || 0)} highlight />
              <InfoItem label="Credit Score" value={selected.credit_score ? String(selected.credit_score) : 'Not Provided'} />
              <InfoItem label="Existing Loans" value={formatCurrency(selected.existing_loans || 0)} />
              <InfoItem label="Monthly EMI" value={formatCurrency(selected.existing_monthly_emi || 0)} />
              <InfoItem label="KCC Status" value={selected.has_kcc ? '✓ Active' : 'Not Linked'} />
              <InfoItem label="PMFBY Status" value={selected.has_pmfby ? '✓ Covered' : 'Not Covered'} />
            </View>
          </View>
          <View style={DT.section}>
            <View style={DT.sectHdr}><ClipboardList size={16} color={A.primary} /><Text style={DT.sectTitle}>Loan Applications ({custApps.length})</Text></View>
            {appsLoading ? <ActivityIndicator color={A.primary} /> :
              custApps.length === 0 ? <Text style={{ color: A.textLight, fontSize: 13 }}>No loan applications submitted.</Text> :
              custApps.map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: A.border, gap: 10 }}
                  onPress={() => setSelectedApp({ ...app, farmer: selected, farmer_name: selected.full_name, farmer_phone: selected.phone || '', farmer_district: selected.district || '' })}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: A.primary }}>APP-{(app.id || '').slice(0, 8).toUpperCase()}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: A.text, marginTop: 2 }}>{app.loan_type} · {formatCurrency(Number(app.loan_amount))}</Text>
                    <Text style={{ fontSize: 11, color: A.textLight, marginTop: 2 }}>{formatDate(app.created_at)}</Text>
                  </View>
                  <StatusBadge status={app.admin_status || 'pending'} />
                  <ChevronRight size={16} color={A.textLight} />
                </TouchableOpacity>
              ))
            }
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={DS.scroll} showsVerticalScrollIndicator={false}>
      <View style={DS.pageHdr}><Text style={DS.pageTitle}>Customer Management</Text><Text style={DS.pageSub}>View and manage registered customers</Text></View>
      <View style={AP.searchBar}>
        <Search size={16} color={A.textLight} />
        <TextInput style={AP.searchInput} placeholder="Search by name, phone, or district..." placeholderTextColor={A.textLight} value={search} onChangeText={setSearch} returnKeyType="search" enterKeyHint="search" blurOnSubmit={true} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><X size={16} color={A.textLight} /></TouchableOpacity>}
      </View>
      <Text style={{ fontSize: 13, color: A.textMid, marginBottom: 8 }}>{loading ? 'Loading...' : `${filtered.length} customer${filtered.length !== 1 ? 's' : ''}`}</Text>
      {loading ? <View style={DS.empty}><ActivityIndicator size="large" color={A.primary} /></View> :
        filtered.length === 0 ? <View style={DS.empty}><Users size={40} color={A.border} /><Text style={DS.emptyTxt}>No customers found</Text></View> :
        filtered.map(c => (
          <TouchableOpacity key={c.id} style={CU.card} onPress={() => openCustomer(c)} activeOpacity={0.8}>
            <View style={CU.avatar}><Text style={CU.avatarTxt}>{(c.full_name || 'C')[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={CU.name}>{c.full_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Phone size={11} color={A.textLight} />
                <Text style={{ fontSize: 12, color: A.textMid }}>{c.phone || 'No phone'}</Text>
                <MapPin size={11} color={A.textLight} />
                <Text style={{ fontSize: 12, color: A.textMid }}>{c.district || c.state || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10, fontWeight: '700', color: A.textMid }}>{(c.farmer_category || 'farmer').toUpperCase()}</Text></View>
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10, fontWeight: '700', color: A.textMid }}>{c.land_size_acres || 0} acres</Text></View>
                {c.has_kcc && <View style={{ backgroundColor: A.primaryLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10, fontWeight: '700', color: A.primary }}>KCC</Text></View>}
              </View>
            </View>
            <ChevronRight size={18} color={A.textLight} />
          </TouchableOpacity>
        ))
      }
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PROFILE SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function AdminProfileSection({
  user,
  logout,
  onNavigate,
}: {
  user: any;
  logout: () => void;
  onNavigate?: (section: AdminSection, filter?: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected') => void;
}) {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<AdminActivityLog[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, review: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(15),
      supabase.from('loan_applications').select('status'),
    ]).then(([actRes, appsRes]) => {
      setActivity((actRes.data || []) as AdminActivityLog[]);
      const rawApps = (appsRes.data || []) as any[];
      const apps = rawApps.map((a: any) => normalizeStatus(a.status));
      setStats({
        pending: apps.filter(s => s === 'pending').length,
        approved: apps.filter(s => s === 'approved').length,
        rejected: apps.filter(s => s === 'rejected').length,
        review: apps.filter(s => s === 'under_review').length,
      });
      setLoading(false);
    }).catch(err => {
      console.error('Error loading admin profile stats:', err);
      setLoading(false);
    });
  }, []);

  const adminName = user?.name || 'Chief Loan Officer';
  const adminEmail = user?.email || 'admin@monitorx.app';
  const adminId = user?.identifier || (user?.id ? user.id.slice(0, 12) : 'ADMIN-001');

  return (
    <ScrollView style={DS.scroll} showsVerticalScrollIndicator={false}>
      <View style={DS.pageHdr}><Text style={DS.pageTitle}>Admin Profile</Text><Text style={DS.pageSub}>Your account and work summary</Text></View>
      {/* Hero */}
      <View style={{ backgroundColor: A.sidebar, borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: A.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: A.primary }}>
          <ShieldCheck size={32} color={A.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{adminName}</Text>
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Bank Loan Officer & Administrator</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <View style={{ backgroundColor: A.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: '800', color: A.primary }}>ADMIN ACCESS</Text></View>
            <View style={{ backgroundColor: A.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: '800', color: A.success }}>ACTIVE</Text></View>
          </View>
        </View>
      </View>
      {/* Account Details */}
      <View style={DT.section}>
        <View style={DT.sectHdr}><UserCircle size={16} color={A.primary} /><Text style={DT.sectTitle}>Account Details</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <InfoItem label="Admin Name" value={adminName} />
          <InfoItem label="Admin ID" value={adminId} />
          <InfoItem label="Email" value={adminEmail} />
          <InfoItem label="Role" value="Bank Administrator" />
          <InfoItem label="Department" value="Loan & Credit Division" />
          <InfoItem label="Security" value="Supabase Auth + RLS" />
        </View>
      </View>
      {/* Work Summary */}
      <View style={DT.section}>
        <View style={[DT.sectHdr, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color={A.primary} />
            <Text style={DT.sectTitle}>Work Summary</Text>
          </View>
          <Text style={{ fontSize: 11, color: A.primary, fontWeight: '600' }}>Tap to view applications</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Pending Review', val: stats.pending, color: A.warning, bg: A.warningLight, filter: 'pending' as const },
            { label: 'Under Review', val: stats.review, color: A.review, bg: A.reviewLight, filter: 'under_review' as const },
            { label: 'Approved', val: stats.approved, color: A.success, bg: A.successLight, filter: 'approved' as const },
            { label: 'Rejected', val: stats.rejected, color: A.danger, bg: A.dangerLight, filter: 'rejected' as const },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={{
                width: '47%',
                borderRadius: 10,
                padding: 14,
                borderLeftWidth: 4,
                borderLeftColor: item.color,
                backgroundColor: item.bg,
              }}
              onPress={() => onNavigate?.('applications', item.filter)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: item.color }}>{item.val}</Text>
                <ChevronRight size={16} color={item.color} />
              </View>
              <Text style={{ fontSize: 12, color: A.textMid, marginTop: 4, fontWeight: '600' }}>{item.label}</Text>
              <Text style={{ fontSize: 11, color: item.color, marginTop: 4, fontWeight: '700' }}>View List →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Work Pending */}
      {(stats.pending + stats.review) > 0 && (
        <TouchableOpacity
          style={[DT.section, { backgroundColor: A.warningLight, borderColor: '#FDE68A', borderWidth: 1 }]}
          onPress={() => onNavigate?.('applications', stats.pending > 0 ? 'pending' : 'under_review')}
          activeOpacity={0.8}
        >
          <View style={[DT.sectHdr, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color={A.warning} />
              <Text style={[DT.sectTitle, { color: A.warning }]}>Work Pending ({stats.pending + stats.review})</Text>
            </View>
            <ChevronRight size={16} color={A.warning} />
          </View>
          <Text style={{ color: A.textMid, fontSize: 13, lineHeight: 22 }}>
            {stats.pending > 0 ? `\u2022 ${stats.pending} application${stats.pending > 1 ? 's' : ''} awaiting initial review\n` : ''}
            {stats.review > 0 ? `\u2022 ${stats.review} application${stats.review > 1 ? 's' : ''} under review requiring final decision` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: A.warning }}>Review pending applications now</Text>
            <ChevronRight size={14} color={A.warning} />
          </View>
        </TouchableOpacity>
      )}
      {/* Recent Activity */}
      <View style={DT.section}>
        <View style={DT.sectHdr}><Activity size={16} color={A.primary} /><Text style={DT.sectTitle}>Recent Activity</Text></View>
        {loading ? <ActivityIndicator color={A.primary} /> :
          activity.length === 0 ? <Text style={{ color: A.textLight, fontSize: 13 }}>No activity recorded yet.</Text> :
          activity.map(act => (
            <View key={act.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: A.border }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: act.action_type === 'approved' ? A.success : act.action_type === 'rejected' ? A.danger : act.action_type === 'review' ? A.review : A.primary }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: A.text, fontWeight: '500' }}>{act.description}</Text>
                <Text style={{ fontSize: 11, color: A.textLight, marginTop: 2 }}>{formatDate(act.created_at)}</Text>
              </View>
            </View>
          ))
        }
      </View>
      {/* Sign Out */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: A.danger, borderRadius: 12, paddingVertical: 14, marginTop: 8, marginBottom: 16 }} onPress={logout} activeOpacity={0.8}>
        <LogOut size={18} color="#fff" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Sign Out of Admin Portal</Text>
      </TouchableOpacity>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.pageBg },
  header: { backgroundColor: A.header, paddingTop: Platform.OS === 'ios' ? 50 : 36, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4, zIndex: 100 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  menuBtn: { padding: 4 },
  headerBrand: { color: '#fff', fontWeight: '800', fontSize: 16 },
  adminPill: { backgroundColor: A.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminPillTxt: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 130 },
  nameTagTxt: { color: '#93C5FD', fontSize: 12, fontWeight: '600' },
  logoutHdr: { backgroundColor: 'rgba(239,68,68,0.2)', padding: 6, borderRadius: 6 },
  body: { flex: 1, flexDirection: 'row' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 },
  sidebar: { position: 'absolute', top: 0, left: -240, bottom: 0, width: 240, backgroundColor: A.sidebar, zIndex: 60, paddingTop: 16, paddingBottom: 24 },
  sidebarOpen: { left: 0 },
  sidebarHdrTxt: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, position: 'relative' },
  navItemActive: { backgroundColor: A.sidebarActiveBg },
  navLabel: { color: A.sidebarText, fontSize: 14, fontWeight: '600' },
  navLabelActive: { color: A.primary },
  navIndicator: { position: 'absolute', right: 0, top: 8, bottom: 8, width: 3, backgroundColor: A.primary, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 8 },
  sidebarLogoutTxt: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  main: { flex: 1 },
  bottomNav: { flexDirection: 'row', backgroundColor: A.sidebar, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingBottom: Platform.OS === 'ios' ? 20 : 4, paddingTop: 8 },
  bottomNavItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  bottomNavLbl: { fontSize: 9, color: '#64748B', fontWeight: '600', marginTop: 2 },
  bottomNavLblActive: { color: A.primary },
});

const DS = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 16 },
  pageHdr: { paddingTop: 16, paddingBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: A.text },
  pageSub: { fontSize: 13, color: A.textMid, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { backgroundColor: A.card, borderRadius: 12, padding: 14, width: '47%', borderWidth: 1, borderColor: A.border, elevation: 1 },
  statCardWide: { backgroundColor: A.card, borderRadius: 12, padding: 14, width: '100%', borderWidth: 1, borderColor: A.border, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLbl: { fontSize: 12, color: A.textMid, fontWeight: '500' },
  card: { backgroundColor: A.card, borderRadius: 14, borderWidth: 1, borderColor: A.border, marginBottom: 16, overflow: 'hidden', elevation: 1 },
  cardHdr: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderBottomWidth: 1, borderBottomColor: A.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: A.text, flex: 1 },
  appRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderBottomWidth: 1, borderBottomColor: A.border },
  appId: { fontSize: 11, fontWeight: '700', color: A.primary, marginBottom: 2 },
  appName: { fontSize: 14, fontWeight: '700', color: A.text },
  appMeta: { fontSize: 12, color: A.textMid, marginTop: 2 },
  appDate: { fontSize: 11, color: A.textLight, marginTop: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTxt: { fontSize: 14, color: A.textLight },
});

const AP = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: A.card, borderRadius: 10, borderWidth: 1, borderColor: A.border, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: A.text },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: A.card, borderWidth: 1, borderColor: A.border, marginRight: 8 },
  filterTabActive: { backgroundColor: A.primary, borderColor: A.primary },
  filterTabTxt: { fontSize: 13, fontWeight: '600', color: A.textMid },
  filterTabTxtActive: { color: '#fff' },
  appCard: { backgroundColor: A.card, borderRadius: 12, borderWidth: 1, borderColor: A.border, marginBottom: 10, padding: 14, elevation: 1 },
});

const DT = StyleSheet.create({
  hdr: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: A.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: A.border, elevation: 2 },
  hdrTitle: { fontSize: 17, fontWeight: '800', color: A.text },
  hdrSub: { fontSize: 12, color: A.textMid, marginTop: 1 },
  section: { backgroundColor: A.card, borderRadius: 14, borderWidth: 1, borderColor: A.border, padding: 16, marginHorizontal: 16, marginTop: 14, elevation: 1 },
  sectHdr: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectTitle: { fontSize: 15, fontWeight: '700', color: A.text },
});

const CU = StyleSheet.create({
  card: { backgroundColor: A.card, borderRadius: 12, borderWidth: 1, borderColor: A.border, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: A.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '800', color: A.primary },
  name: { fontSize: 15, fontWeight: '700', color: A.text },
});
