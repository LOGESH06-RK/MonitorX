import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { Colors } from '@/lib/theme';
import type { GovernmentScheme } from '@/lib/schemes';

type SchemeCardProps = {
  scheme: GovernmentScheme;
  matchScore?: number;
  matchReasons?: string[];
  matchReasonsTamil?: string[];
  onPress: () => void;
};

export function SchemeCard({
  scheme,
  matchScore,
  matchReasons,
  matchReasonsTamil,
  onPress,
}: SchemeCardProps) {
  const { language, t } = useLanguage();

  const name = language === 'ta' ? scheme.nameTamil : scheme.name;
  const department = language === 'ta' ? scheme.departmentTamil : scheme.department;
  const purpose = language === 'ta' ? scheme.purposeTamil : scheme.purpose;
  const benefits = language === 'ta' ? scheme.benefitsTamil : scheme.benefits;

  const isState = scheme.type === 'state';
  const typeColor = isState ? Colors.accent[600] : Colors.primary[600];
  const typeBg = isState ? Colors.accent[50] : Colors.primary[50];
  const typeLabel = isState ? t('stateGovt') : t('central');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>
        {matchScore !== undefined && matchScore >= 50 && (
          <View style={[styles.matchBadge, matchScore >= 75 ? styles.matchBadgeHigh : styles.matchBadgeMed]}>
            <Text style={[styles.matchText, matchScore >= 75 ? styles.matchTextHigh : styles.matchTextMed]}>
              {matchScore >= 75
                ? (language === 'ta' ? 'தகுதி பெற அதிக வாய்ப்பு' : 'Likely Eligible')
                : (language === 'ta' ? 'சாத்தியமான தகுதி' : 'Potentially Eligible')} • {matchScore}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.department}>{department}</Text>
      <Text style={styles.purpose}>{purpose}</Text>
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsLabel}>{t('benefits')}: </Text>
        <Text style={styles.benefits}>{benefits}</Text>
      </View>
      {matchReasons && matchReasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          {matchReasons.slice(0, 1).map((reason, idx) => (
            <Text key={idx} style={styles.reasonText}>
              {language === 'ta' ? matchReasonsTamil?.[idx] || reason : reason}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.sourceText}>{t('source')}: {scheme.source.split(' — ')[0]}</Text>
        <Text style={styles.verifiedText}>{t('lastVerified')}: {scheme.lastVerified}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
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
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchBadgeHigh: {
    backgroundColor: Colors.success[100],
  },
  matchBadgeMed: {
    backgroundColor: Colors.accent[100],
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchTextHigh: {
    color: Colors.success[700],
  },
  matchTextMed: {
    color: Colors.accent[700],
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: 2,
    lineHeight: 22,
    flexShrink: 1,
  },
  department: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginBottom: 6,
    flexShrink: 1,
  },
  purpose: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 19,
    marginBottom: 8,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  benefitsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  benefits: {
    fontSize: 13,
    color: Colors.neutral[700],
    flex: 1,
    flexShrink: 1,
  },
  reasonsContainer: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.secondary[400],
  },
  reasonText: {
    fontSize: 13,
    color: Colors.neutral[600],
    fontStyle: 'italic',
    lineHeight: 18,
    paddingVertical: 2,
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
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
});
