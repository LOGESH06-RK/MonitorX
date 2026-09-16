import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { Colors } from '@/lib/theme';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, language === 'en' && styles.activeButton]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, language === 'en' && styles.activeText]}>EN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, language === 'ta' && styles.activeButton]}
        onPress={() => setLanguage('ta')}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, language === 'ta' && styles.activeText]}>தமிழ்</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: 10,
    padding: 3,
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  button: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: Colors.primary[600],
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[500],
  },
  activeText: {
    color: Colors.neutral[0],
  },
});
