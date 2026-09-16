import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { Colors } from '@/lib/theme';
import { Header } from '@/components/Header';
import { calculateEMI } from '@/lib/loans';
import { Calculator as CalculatorIcon, TrendingUp } from 'lucide-react-native';

export default function CalculatorScreen() {
  const { t, language } = useLanguage();
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('7');
  const [tenure, setTenure] = useState('60');

  const result = useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const annualRate = parseFloat(rate) || 0;
    const months = parseInt(tenure) || 0;
    return calculateEMI(principal, annualRate, months);
  }, [amount, rate, tenure]);

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const presets = [
    { label: language === 'ta' ? '₹50,000' : '₹50K', value: '50000' },
    { label: language === 'ta' ? '₹1,00,000' : '₹1L', value: '100000' },
    { label: language === 'ta' ? '₹3,00,000' : '₹3L', value: '300000' },
    { label: language === 'ta' ? '₹5,00,000' : '₹5L', value: '500000' },
    { label: language === 'ta' ? '₹10,00,000' : '₹10L', value: '1000000' },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('emiCalculator')} subtitle={t('agriculturalLoans')} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('loanAmountLabel')}</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="100000"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets}>
              {presets.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.presetChip,
                    amount === p.value && styles.presetChipActive,
                  ]}
                  onPress={() => setAmount(p.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      amount === p.value && styles.presetTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('interestRateLabel')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={rate}
                onChangeText={setRate}
                placeholder="7"
                placeholderTextColor={Colors.neutral[400]}
              />
              <Text style={styles.suffix}>%</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('tenureLabel')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={tenure}
                onChangeText={setTenure}
                placeholder="60"
                placeholderTextColor={Colors.neutral[400]}
              />
              <Text style={styles.suffix}>{language === 'ta' ? 'மாதம்' : 'mo'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <CalculatorIcon size={20} color={Colors.primary[600]} />
            <Text style={styles.resultTitle}>{t('monthlyEMI')}</Text>
          </View>
          <Text style={styles.emiValue}>{formatCurrency(result.emi)}</Text>
          <Text style={styles.emiSub}>
            {language === 'ta' ? 'மாதாந்திரம்' : 'per month'}
          </Text>

          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownDot} />
              <Text style={styles.breakdownLabel}>{t('loanAmount')}</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.secondary[500] }]} />
              <Text style={styles.breakdownLabel}>{t('totalInterest')}</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(result.totalInterest)}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.neutral[800] }]} />
              <Text style={styles.breakdownTotalLabel}>{t('totalPayable')}</Text>
              <Text style={styles.breakdownTotalValue}>{formatCurrency(result.totalPayable)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <TrendingUp size={18} color={Colors.accent[600]} />
          <Text style={styles.infoText}>
            {language === 'ta'
              ? 'EMI = [P x R x (1+R)^N] / [(1+R)^N-1], இங்கு P = அசல், R = மாதாந்திர வட்டி விகிதம், N = மாதங்களின் எண்ணிக்கை.'
              : 'EMI = [P x R x (1+R)^N] / [(1+R)^N-1], where P = Principal, R = Monthly interest rate, N = Number of months.'}
          </Text>
        </View>

        <View style={{ height: 24 }} />
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
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral[500],
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  suffix: {
    fontSize: 14,
    color: Colors.neutral[400],
    fontWeight: '600',
  },
  presets: {
    flexDirection: 'row',
    marginTop: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  presetChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  presetTextActive: {
    color: Colors.neutral[0],
  },
  resultCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  emiValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary[700],
    lineHeight: 44,
  },
  emiSub: {
    fontSize: 13,
    color: Colors.neutral[400],
    marginBottom: 16,
  },
  breakdownContainer: {
    width: '100%',
    backgroundColor: Colors.neutral[50],
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.neutral[600],
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    marginTop: 4,
    paddingTop: 10,
  },
  breakdownTotalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral[800],
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.accent[50],
    borderRadius: 10,
    padding: 14,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.neutral[600],
    lineHeight: 18,
  },
});
