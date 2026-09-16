import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { X, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '@/lib/i18n';
import { Colors } from '@/lib/theme';
import type { GovernmentScheme } from '@/lib/schemes';

type SchemeDetailModalProps = {
  scheme: GovernmentScheme | null;
  visible: boolean;
  onClose: () => void;
  onApply?: (scheme: GovernmentScheme) => void;
};

export function SchemeDetailModal({ scheme, visible, onClose, onApply }: SchemeDetailModalProps) {
  const { language, t } = useLanguage();

  if (!scheme) return null;

  const name = language === 'ta' ? scheme.nameTamil : scheme.name;
  const department = language === 'ta' ? scheme.departmentTamil : scheme.department;
  const purpose = language === 'ta' ? scheme.purposeTamil : scheme.purpose;
  const benefits = language === 'ta' ? scheme.benefitsTamil : scheme.benefits;
  const eligibility = language === 'ta' ? scheme.eligibilityTamil : scheme.eligibility;
  const documents = language === 'ta' ? scheme.documentsTamil : scheme.documents;
  const applicationProcess =
    language === 'ta' ? scheme.applicationProcessTamil : scheme.applicationProcess;

  const isState = scheme.type === 'state';
  const typeColor = isState ? Colors.accent[600] : Colors.primary[600];
  const typeBg = isState ? Colors.accent[50] : Colors.primary[50];
  const typeLabel = isState ? t('stateGovt') : t('central');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={22} color={Colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.department}>{department}</Text>

          <Section title={t('purpose')} >
            <Text style={styles.sectionText}>{purpose}</Text>
          </Section>

          <Section title={t('benefits')}>
            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsText}>{benefits}</Text>
            </View>
          </Section>

          <Section title={t('eligibility')}>
            {eligibility.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </Section>

          <Section title={t('requiredDocuments')}>
            {documents.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </Section>

          <Section title={t('applicationProcess')}>
            <Text style={styles.sectionText}>{applicationProcess}</Text>
          </Section>

          <Section title={t('applicationPortal')}>
            <TouchableOpacity
              style={styles.portalButton}
              onPress={() => Linking.openURL(scheme.portal)}
            >
              <Text style={styles.portalText}>{scheme.portal}</Text>
              <ExternalLink size={14} color={Colors.accent[600]} />
            </TouchableOpacity>
          </Section>

          <Section title={t('contactInfo')}>
            <Text style={styles.sectionText}>{scheme.contact}</Text>
          </Section>

          <Section title={t('importantDates')}>
            <Text style={styles.sectionText}>{scheme.importantDates}</Text>
          </Section>

          <Section title={t('source')}>
            <Text style={styles.sectionText}>{scheme.source}</Text>
            <Text style={styles.verifiedText}>{t('lastVerified')}: {scheme.lastVerified}</Text>
          </Section>

          <View style={{ height: 80 }} />
        </ScrollView>

        {onApply && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => onApply(scheme)}
            >
              <Text style={styles.applyText}>{t('applyNow')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  borderRadius: 20,
    backgroundColor: Colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  padding: 16,
  paddingBottom: 100,
  marginBottom: 40,
  minHeight: '50%',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral[900],
    lineHeight: 26,
    marginBottom: 4,
  },
  department: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[800],
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 20,
  },
  benefitsBox: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  benefitsText: {
    fontSize: 13,
    color: Colors.neutral[700],
    lineHeight: 20,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[500],
    marginTop: 7,
  },
  listText: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 19,
    flex: 1,
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  portalText: {
    fontSize: 13,
    color: Colors.accent[600],
    fontWeight: '600',
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.neutral[400],
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  applyButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: Colors.neutral[0],
    fontSize: 15,
    fontWeight: '700',
  },
});
