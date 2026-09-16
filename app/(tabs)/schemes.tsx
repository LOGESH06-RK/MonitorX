import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useProfile } from '@/lib/profile-context';
import { Colors } from '@/lib/theme';
import { Header } from '@/components/Header';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { SchemeCard } from '@/components/SchemeCard';
import { SchemeDetailModal } from '@/components/SchemeDetailModal';
import { governmentSchemes, schemeCategories, GovernmentScheme, SchemeCategory } from '@/lib/schemes';
import { matchSchemes, SchemeMatch } from '@/lib/eligibility';
import { Search, SlidersHorizontal, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type FilterType = 'all' | 'central' | 'state' | 'recommended';

export default function SchemesScreen() {
  const { t, language } = useLanguage();
  const { profile } = useProfile();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const matches = useMemo<SchemeMatch[]>(() => {
    if (!profile) return [];
    return matchSchemes(profile, governmentSchemes);
  }, [profile]);

  const filteredSchemes = useMemo(() => {
    let result: GovernmentScheme[] = [...governmentSchemes];

    if (filter === 'central') {
      result = result.filter((s) => s.type === 'central');
    } else if (filter === 'state') {
      result = result.filter((s) => s.type === 'state');
    } else if (filter === 'recommended' && profile) {
      const matchedIds = matches.map((m) => m.scheme.id);
      result = result.filter((s) => matchedIds.includes(s.id));
    }

    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameTamil.includes(search) ||
          s.department.toLowerCase().includes(q) ||
          s.purpose.toLowerCase().includes(q)
      );
    }

    return result;
  }, [filter, selectedCategory, search, matches, profile]);

  const getMatchForScheme = useCallback(
    (scheme: GovernmentScheme): SchemeMatch | undefined => {
      return matches.find((m) => m.scheme.id === scheme.id);
    },
    [matches]
  );

  const handleSchemePress = (scheme: GovernmentScheme) => {
    setSelectedScheme(scheme);
    setModalVisible(true);
  };

  const handleApply = async (scheme: GovernmentScheme) => {
    if (!profile?.id) return;
    try {
      await supabase.from('scheme_applications').insert({
        farmer_id: profile.id,
        scheme_id: scheme.id,
        scheme_name: scheme.name,
        scheme_type: scheme.type,
        status: 'interested',
      });
    } catch {
      // ignore
    }
    setModalVisible(false);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('allSchemes') },
    { key: 'central', label: t('central') },
    { key: 'state', label: t('stateGovt') },
    { key: 'recommended', label: t('recommendedForYou') },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('governmentSchemes')} subtitle={t('appTagline')} />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchSchemes')}
            placeholderTextColor={Colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={18} color={showFilters ? Colors.primary[600] : Colors.neutral[500]} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            {f.key === 'recommended' && filter === f.key && (
              <Star size={11} color={Colors.neutral[0]} fill={Colors.neutral[0]} />
            )}
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]} numberOfLines={1}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showFilters && (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{t('schemeCategories')}</Text>
          <View style={styles.categoryGrid}>
            {schemeCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() =>
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {t(cat.key)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {filter === 'recommended' && !profile && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('profileRequired')}</Text>
        </View>
      )}

      {filteredSchemes.length === 0 && profile ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('noSchemesFound')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSchemes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const match = getMatchForScheme(item);
            return (
              <SchemeCard
                scheme={item}
                matchScore={match?.matchScore}
                matchReasons={match?.matchReasons}
                matchReasonsTamil={match?.matchReasonsTamil}
                onPress={() => handleSchemePress(item)}
              />
            );
          }}
          ListFooterComponent={
            <>
              <DisclaimerBanner />
              <View style={{ height: 40 }} />
            </>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <SchemeDetailModal
        scheme={selectedScheme}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onApply={profile ? handleApply : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral[800],
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterButtonActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filterChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  filterTextActive: {
    color: Colors.neutral[0],
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  backgroundColor: Colors.neutral[0],
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[600],
    marginTop: 10,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  categoryChipActive: {
    backgroundColor: Colors.accent[600],
    borderColor: Colors.accent[600],
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral[600],
  },
  categoryTextActive: {
    color: Colors.neutral[0],
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
});
