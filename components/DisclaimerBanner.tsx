import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { Colors } from '@/lib/theme';

export function DisclaimerBanner() {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[200],
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning[500],
  },
  text: {
    fontSize: 12,
    color: Colors.neutral[600],
    lineHeight: 17,
  },
});
