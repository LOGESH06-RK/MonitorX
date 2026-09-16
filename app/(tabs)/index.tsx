import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/profile-context';
import { Colors } from '@/lib/theme';
import { Header } from '@/components/Header';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import {
  Landmark,
  Wallet,
  CheckCircle,
  Tag,
  Calculator,
  Search,
  Bell,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type QuickAction = {
  icon: React.ReactNode;
  labelKey: string;
  bgColor: string;
  route: string;
};

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { profile, hasProfile } = useProfile();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch {
      // ignore
    }
  };

  const actions: QuickAction[] = [
    {
      icon: <Landmark size={20} color={Colors.primary[700]} />,
      labelKey: 'governmentSchemes',
      bgColor: Colors.primary[50],
      route: '/(tabs)/schemes',
    },
    {
      icon: <Wallet size={20} color={Colors.accent[700]} />,
      labelKey: 'agriculturalLoans',
      bgColor: Colors.accent[50],
      route: '/(tabs)/loans',
    },
    {
      icon: <CheckCircle size={20} color={Colors.success[700]} />,
      labelKey: 'loanEligibility',
      bgColor: Colors.success[50],
      route: '/(tabs)/loans',
    },
    {
      icon: <Tag size={20} color={Colors.secondary[700]} />,
      labelKey: 'subsidies',
      bgColor: Colors.secondary[50],
      route: '/(tabs)/schemes',
    },
    {
      icon: <Calculator size={20} color={Colors.primary[800]} />,
      labelKey: 'emiCalculator',
      bgColor: Colors.primary[100],
      route: '/(tabs)/calculator',
    },
    {
      icon: <Search size={20} color={Colors.accent[800]} />,
      labelKey: 'findBenefits',
      bgColor: Colors.accent[100],
      route: '/(tabs)/schemes',
    },
  ];

  const customerName = profile?.full_name || user?.name || (language === 'ta' ? 'விவசாயி' : 'Customer');

  return (
    <View style={styles.container}>
      <Header title={t('appName')} subtitle={t('appTagline')} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeText}>
                {language === 'ta' ? `வரவேற்கிறோம், ${customerName}` : `Welcome, ${customerName}`}
              </Text>
              <Text style={styles.questionText}>{t('whatDoYouNeed')}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color={Colors.primary[600]} />
              <Text style={styles.verifiedBadgeText}>MonitorX</Text>
            </View>
          </View>

          {/* Quick Profile Status Summary */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>{t('farmerCategory')}</Text>
              <Text style={styles.summaryItemVal}>{profile?.farmer_category ? profile.farmer_category.toUpperCase() : 'STANDARD'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>{t('landSize')}</Text>
              <Text style={styles.summaryItemVal}>{profile?.land_size_acres || 0} {language === 'ta' ? 'ஏக்கர்' : 'acres'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>KCC</Text>
              <Text style={[styles.summaryItemVal, profile?.has_kcc ? styles.textActive : styles.textInactive]}>
                {profile?.has_kcc ? (language === 'ta' ? 'செயலில்' : 'Active') : (language === 'ta' ? 'இல்லை' : 'None')}
              </Text>
            </View>
          </View>
        </View>

        {/* Compact Quick Actions Grid (Issue 26) */}
        <View style={styles.actionsContainer}>
          <Text style={styles.gridSectionHeader}>
            {language === 'ta' ? 'விரைவு சேவைகள்' : 'Quick Services'}
          </Text>
          <View style={styles.actionsGridCompact}>
            {actions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.actionCardCompact}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconCompact, { backgroundColor: action.bgColor }]}>
                  {action.icon}
                </View>
                <Text style={styles.actionLabelCompact} numberOfLines={2}>
                  {t(action.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile Card Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={Colors.neutral[700]} />
            <Text style={styles.sectionTitle}>{t('myProfile')}</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileGridRow}>
              <View style={styles.profileMetaBox}>
                <Text style={styles.profileMetaLabel}>{t('district')}</Text>
                <Text style={styles.profileMetaValue}>{profile?.district || profile?.state || 'Tamil Nadu'}</Text>
              </View>
              <View style={styles.profileMetaBox}>
                <Text style={styles.profileMetaLabel}>{t('cropType')}</Text>
                <Text style={styles.profileMetaValue}>{profile?.crop_type || (profile?.crops && profile.crops[0]) || '-'}</Text>
              </View>
            </View>

            <View style={styles.profileGridRow}>
              <View style={styles.profileMetaBox}>
                <Text style={styles.profileMetaLabel}>{t('annualIncome')}</Text>
                <Text style={styles.profileMetaValue}>
                  ₹{(profile?.annual_agricultural_income || 0).toLocaleString('en-IN')}/yr
                </Text>
              </View>
              <View style={styles.profileMetaBox}>
                <Text style={styles.profileMetaLabel}>{t('existingMonthlyEmi')}</Text>
                <Text style={styles.profileMetaValue}>
                  ₹{(profile?.existing_monthly_emi || 0).toLocaleString('en-IN')}/mo
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.editText}>{language === 'ta' ? 'முழு சுயவிவரத்தைக் காண்க' : 'View Full Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={18} color={Colors.neutral[700]} />
            <Text style={styles.sectionTitle}>{t('notifications')}</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.notifCard}>
            <TrendingUp size={20} color={Colors.primary[600]} style={styles.notifIcon} />
            <Text style={styles.notifText}>
              {language === 'ta'
                ? 'PM-KISAN திட்டத்தின் புதிய தவணை வழங்கப்பட்டது. உங்கள் வங்கி கணக்கை சரிபார்க்கவும்.'
                : 'PM-KISAN 17th installment credited. Check your linked DBT Aadhaar bank account.'}
            </Text>
          </View>
        </View>

        <DisclaimerBanner />
        <View style={{ height: 100 }} />
      </ScrollView>
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
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.neutral[900],
    lineHeight: 25,
  },
  questionText: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontWeight: '500',
  },
  summaryItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginTop: 2,
  },
  textActive: {
    color: Colors.success[700],
  },
  textInactive: {
    color: Colors.neutral[600],
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.neutral[200],
  },
  onboardingPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[300],
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  promptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTextCol: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary[900],
  },
  promptSubtitle: {
    fontSize: 11,
    color: Colors.primary[800],
    marginTop: 1,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  gridSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  actionsGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionCardCompact: {
    width: '31%',
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconCompact: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabelCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral[800],
    textAlign: 'center',
    lineHeight: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral[800],
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  profileGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  profileMetaBox: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    padding: 8,
    borderRadius: 8,
  },
  profileMetaLabel: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontWeight: '500',
  },
  profileMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginTop: 2,
  },
  editButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    marginTop: 4,
  },
  editText: {
    fontSize: 12,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  noProfileCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  noProfileText: {
    fontSize: 13,
    color: Colors.neutral[600],
    marginBottom: 10,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: 10,
  },
  notifIcon: {
    marginTop: 2,
  },
  notifText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.neutral[700],
  },
});
