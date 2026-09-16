import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/profile-context';
import { Header } from '@/components/Header';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { ProfileWizard } from '@/components/ProfileWizard';
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
} from 'lucide-react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/lib/theme';

export default function ProfileScreen() {
  const { t, language } = useLanguage();
  const { logout, user } = useAuth();
  const { profile, loading, refreshProfile } = useProfile();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStep, setEditStep] = useState(1);

  const handleOpenEdit = (step = 1) => {
    setEditStep(step);
    setIsEditModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const displayName = profile?.full_name || user?.name || (language === 'ta' ? 'வாடிக்கையாளர்' : 'Customer');
  const displayPhone = profile?.phone || user?.phone || 'Not Provided';
  const displayEmail = user?.email || 'N/A';
  const displayId = user?.identifier || (profile?.user_id ? `MON${profile.user_id.replace(/\D/g, '').slice(-5)}` : (profile?.id ? profile.id.slice(0, 8).toUpperCase() : 'MON10001'));

  return (
    <View style={styles.container}>
      <Header
        title={t('myProfile')}
        subtitle={language === 'ta' ? 'சரிபார்க்கப்பட்ட சுயவிவரம் மற்றும் மேலாண்மை' : 'Verified Profile & Account Management'}
      />

      {/* Top Bar with Role, Edit Profile & Logout */}
      <View style={styles.topActionsRow}>
        <View style={styles.userInfoBadge}>
          <ShieldCheck size={16} color={Colors.primary[700]} />
          <Text style={styles.userRoleText}>
            {user?.role === 'admin'
              ? '🏦 Bank Officer'
              : (language === 'ta' ? 'வாடிக்கையாளர் கணக்கு' : 'Verified Customer Account')}
          </Text>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.editProfileTopBtn}
            onPress={() => handleOpenEdit(1)}
            activeOpacity={0.8}
          >
            <Pencil size={15} color={Colors.primary[700]} />
            <Text style={styles.editProfileTopBtnText}>{t('editProfile') || 'Edit Profile'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={16} color="#DC2626" />
            <Text style={styles.logoutBtnText}>{t('logout') || 'Log Out'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <User size={36} color={Colors.primary[700]} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroName}>{displayName}</Text>
              <TouchableOpacity
                style={styles.heroEditPillBtn}
                onPress={() => handleOpenEdit(1)}
                activeOpacity={0.8}
              >
                <Pencil size={13} color={Colors.primary[700]} />
                <Text style={styles.heroEditPillText}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroId}>Customer ID: {displayId}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>
                  {profile?.farmer_category
                    ? `${profile.farmer_category.toUpperCase()} FARMER`
                    : 'REGISTERED BORROWER'}
                </Text>
              </View>
              {profile?.credit_score ? (
                <View style={[styles.heroPill, { backgroundColor: Colors.success[50] }]}>
                  <Text style={[styles.heroPillText, { color: Colors.success[700] }]}>
                    Credit Score: {profile.credit_score}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* 1. Personal Information Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <User size={18} color={Colors.primary[700]} />
              <Text style={styles.cardTitle}>
                {language === 'ta' ? 'தனிநபர் விவரங்கள்' : 'Personal Information'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionEditAction}
              onPress={() => handleOpenEdit(1)}
              activeOpacity={0.7}
            >
              <Pencil size={14} color={Colors.primary[700]} />
              <Text style={styles.sectionEditText}>{t('edit') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.valText}>{displayName}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Customer User ID</Text>
              <Text style={styles.valText}>{displayId}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Contact Phone</Text>
              <Text style={styles.valText}>{displayPhone}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Registered Email</Text>
              <Text style={styles.valText}>{displayEmail}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>
                {language === 'ta' ? 'வயது / பாலினம்' : 'Age / Gender'}
              </Text>
              <Text style={styles.valText}>
                {profile?.age ? `${profile.age} ${language === 'ta' ? 'வயது' : 'yrs'}` : 'N/A'} / {profile?.gender ? (
                  profile.gender.toLowerCase() === 'male' ? (language === 'ta' ? 'ஆண் (Male)' : 'Male') :
                  profile.gender.toLowerCase() === 'female' ? (language === 'ta' ? 'பெண் (Female)' : 'Female') :
                  profile.gender.toLowerCase() === 'other' ? (language === 'ta' ? 'மற்றவை (Other)' : 'Other') :
                  profile.gender
                ) : 'N/A'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>District & State</Text>
              <Text style={styles.valText}>
                {profile?.district || 'N/A'}, {profile?.state || 'Tamil Nadu'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Agriculture & Farm Details */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Sprout size={18} color={Colors.success[700]} />
              <Text style={styles.cardTitle}>
                {language === 'ta' ? 'விவசாய மற்றும் நில விவரங்கள்' : 'Agriculture & Farm Details'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionEditAction}
              onPress={() => handleOpenEdit(2)}
              activeOpacity={0.7}
            >
              <Pencil size={14} color={Colors.success[700]} />
              <Text style={[styles.sectionEditText, { color: Colors.success[700] }]}>{t('edit') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Land Area</Text>
              <Text style={styles.valText}>
                {profile?.land_size_acres !== null && profile?.land_size_acres !== undefined ? `${profile.land_size_acres} Acres` : '0 Acres'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Land Ownership</Text>
              <Text style={styles.valText}>{profile?.land_ownership || 'Not Specified'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Primary Crops</Text>
              <Text style={styles.valText}>
                {profile?.crop_type || (profile?.crops && profile.crops.length > 0 ? profile.crops.join(', ') : 'Not Specified')}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Irrigation Source</Text>
              <Text style={styles.valText}>
                {profile?.irrigation_type || 'Not Specified'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Kisan Credit Card (KCC)</Text>
              <Text style={[styles.valText, { color: profile?.has_kcc ? Colors.primary[700] : Colors.neutral[600], fontWeight: '700' }]}>
                {profile?.has_kcc ? '✓ Active & Linked' : 'Not Linked'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>PMFBY Crop Insurance</Text>
              <Text style={[styles.valText, { color: profile?.has_pmfby ? Colors.accent[700] : Colors.neutral[600], fontWeight: '700' }]}>
                {profile?.has_pmfby ? '✓ Covered' : 'Not Covered'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Financial & Income Information Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Coins size={18} color={Colors.secondary[700]} />
              <Text style={styles.cardTitle}>
                {language === 'ta' ? 'நிதி மற்றும் வருமான விவரங்கள்' : 'Financial & Income Details'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionEditAction}
              onPress={() => handleOpenEdit(3)}
              activeOpacity={0.7}
            >
              <Pencil size={14} color={Colors.secondary[700]} />
              <Text style={[styles.sectionEditText, { color: Colors.secondary[700] }]}>{t('edit') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Annual Farm Income</Text>
              <Text style={[styles.valText, { color: Colors.primary[700], fontWeight: '700' }]}>
                ₹{(profile?.annual_agricultural_income || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Other Annual Income</Text>
              <Text style={styles.valText}>
                ₹{(profile?.other_income || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Existing Active Loans</Text>
              <Text style={styles.valText}>
                ₹{(profile?.existing_loans || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Monthly EMI Obligations</Text>
              <Text style={styles.valText}>
                ₹{(profile?.existing_monthly_emi || 0).toLocaleString('en-IN')}/mo
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Monthly Living Expenses</Text>
              <Text style={styles.valText}>
                ₹{(profile?.monthly_expenses || 0).toLocaleString('en-IN')}/mo
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Employment / Farming Category</Text>
              <Text style={styles.valText}>
                {profile?.farming_type || (profile?.farmer_category ? `${profile.farmer_category.toUpperCase()} Farmer` : 'Farmer')}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Credit Score & Repayment History */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <CreditCard size={18} color={Colors.accent[700]} />
              <Text style={styles.cardTitle}>
                {language === 'ta' ? 'கடன் வரலாறு & தகுதி' : 'Credit History & Repayment Track'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionEditAction}
              onPress={() => handleOpenEdit(4)}
              activeOpacity={0.7}
            >
              <Pencil size={14} color={Colors.accent[700]} />
              <Text style={[styles.sectionEditText, { color: Colors.accent[700] }]}>{t('edit') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Credit Score</Text>
              <Text style={[styles.valText, { fontWeight: '800', color: Colors.neutral[900] }]}>
                {profile?.credit_score ? String(profile.credit_score) : (profile?.credit_score_unknown ? 'Unrated / First-time Borrower' : 'Not Provided')}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Repayment Track Record</Text>
              <Text style={[styles.valText, { color: Colors.success[700], fontWeight: '700' }]}>
                {profile?.repayment_history === 'always_on_time'
                  ? 'Always on Time (Excellent)'
                  : profile?.repayment_history || 'Standard Standing'}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Government Schemes */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Landmark size={18} color={Colors.primary[700]} />
              <Text style={styles.cardTitle}>
                {language === 'ta' ? 'அரசு திட்டங்கள்' : 'Government Scheme Beneficiary Status'}
              </Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <View style={[styles.gridItem, { width: '100%' }]}>
              <Text style={styles.label}>Active Direct Benefit Schemes</Text>
              <Text style={styles.valText}>
                {profile?.has_kcc
                  ? 'PM-KISAN Samman Nidhi, Interest Subvention Scheme (ISS)'
                  : 'PM-KISAN Samman Nidhi'}
              </Text>
            </View>
            <View style={[styles.gridItem, { width: '100%', marginTop: 8 }]}>
              <Text style={styles.label}>Subsidized Credit Status</Text>
              <Text style={[styles.valText, { color: Colors.success[700] }]}>
                {profile?.has_kcc
                  ? 'Eligible for 3% Prompt Repayment Incentive under Interest Subvention Scheme (ISS)'
                  : 'Eligible for KCC Concessional Agricultural Credit'}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Profile Full Width CTA */}
        <TouchableOpacity
          style={styles.mainEditProfileBtn}
          onPress={() => handleOpenEdit(1)}
          activeOpacity={0.85}
        >
          <Pencil size={18} color="#fff" />
          <Text style={styles.mainEditProfileBtnText}>
            {language === 'ta' ? 'சுயவிவரத்தைத் திருத்தி புதுப்பிக்கவும்' : 'Edit & Update Complete Profile'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Sign Out Button */}
        <TouchableOpacity
          style={styles.bottomLogoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.bottomLogoutText}>
            {language === 'ta' ? 'கணக்கிலிருந்து வெளியேறு' : 'Sign Out of MonitorX'}
          </Text>
        </TouchableOpacity>

        <DisclaimerBanner />
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <ProfileWizard
            initialStep={editStep}
            onCancel={() => setIsEditModalOpen(false)}
            onSuccess={async () => {
              setIsEditModalOpen(false);
              if (refreshProfile) {
                await refreshProfile();
              }
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfoBadge: {
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
  userRoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  editProfileTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  editProfileTopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary[50],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral[900],
    flex: 1,
  },
  heroEditPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroEditPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  heroId: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginTop: 2,
    fontWeight: '500',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  heroPill: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  sectionCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  sectionEditAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sectionEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
    paddingRight: 8,
  },
  label: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontWeight: '500',
    marginBottom: 2,
  },
  valText: {
    fontSize: 13,
    color: Colors.neutral[800],
    fontWeight: '600',
  },
  mainEditProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 10,
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  mainEditProfileBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  bottomLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  bottomLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

