import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, FarmerProfile } from './supabase';
import { useAuth } from './auth-context';

type ProfileContextType = {
  profile: FarmerProfile | null;
  profileId: string | null;
  loading: boolean;
  hasProfile: boolean;
  saveProfile: (profile: FarmerProfile) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  profileId: null,
  loading: true,
  hasProfile: false,
  saveProfile: async () => ({ success: false }),
  refreshProfile: async () => {},
});

/**
 * Valid DB columns whitelist to prevent saving virtual/computed frontend properties into Supabase
 */
const VALID_DB_COLUMNS = new Set([
  'id',
  'full_name',
  'phone',
  'age',
  'state',
  'district',
  'farmer_category',
  'farming_type',
  'crop_type',
  'land_size_acres',
  'land_ownership',
  'irrigation_available',
  'irrigation_type',
  'annual_agricultural_income',
  'other_income',
  'existing_loans',
  'monthly_expenses',
  'credit_score',
  'repayment_history',
  'livestock_type',
  'equipment_needed',
  'has_kcc',
  'has_pmfby',
  'created_at',
  'updated_at',
]);

/**
 * Prepares and sanitizes a FarmerProfile object into valid Supabase columns
 */
export function serializeForSupabase(profile: Partial<FarmerProfile>): Record<string, any> {
  const result: Record<string, any> = {};

  // Crops -> crop_type
  if (Array.isArray(profile.crops)) {
    result.crop_type = profile.crops.filter(Boolean).join(', ');
  } else if (profile.crop_type !== undefined) {
    result.crop_type = profile.crop_type;
  }

  // Farming Types -> farming_type
  if (Array.isArray(profile.farming_types)) {
    result.farming_type = profile.farming_types.filter(Boolean).join(', ');
  } else if (profile.farming_type !== undefined) {
    result.farming_type = profile.farming_type;
  }

  // Irrigation -> irrigation_type
  if (Array.isArray(profile.irrigation_sources)) {
    result.irrigation_type = profile.irrigation_sources.filter(Boolean).join(', ');
  } else if (profile.irrigation_type !== undefined) {
    result.irrigation_type = profile.irrigation_type;
  }

  // Livestock -> livestock_type
  if (Array.isArray(profile.livestock_list)) {
    result.livestock_type = profile.livestock_list.filter(Boolean).join(', ');
  } else if (profile.livestock_type !== undefined) {
    result.livestock_type = profile.livestock_type;
  }

  // Equipment -> equipment_needed
  if (Array.isArray(profile.equipment_list)) {
    result.equipment_needed = profile.equipment_list.filter(Boolean).join(', ');
  } else if (profile.equipment_needed !== undefined) {
    result.equipment_needed = profile.equipment_needed;
  }

  // Boolean flags derived from status
  if (profile.kcc_status !== undefined) {
    result.has_kcc = profile.kcc_status === 'active';
  } else if (profile.has_kcc !== undefined) {
    result.has_kcc = !!profile.has_kcc;
  }

  if (profile.pmfby_status !== undefined) {
    result.has_pmfby = profile.pmfby_status === 'covered';
  } else if (profile.has_pmfby !== undefined) {
    result.has_pmfby = !!profile.has_pmfby;
  }

  // Copy standard fields if they are in the whitelist
  for (const [key, value] of Object.entries(profile)) {
    if (VALID_DB_COLUMNS.has(key) && !(key in result)) {
      result[key] = value;
    }
  }

  result.updated_at = new Date().toISOString();
  return result;
}

/**
 * Hydrates database record into rich client FarmerProfile with array helpers
 */
export function deserializeFromSupabase(data: any, fallbackGender?: string | null): FarmerProfile {
  if (!data) return {} as FarmerProfile;
  const crops = Array.isArray(data.crops) && data.crops.length > 0
    ? data.crops
    : (data.crop_type ? data.crop_type.split(', ').map((s: string) => s.trim()).filter(Boolean) : []);

  const farming_types = Array.isArray(data.farming_types) && data.farming_types.length > 0
    ? data.farming_types
    : (data.farming_type ? data.farming_type.split(', ').map((s: string) => s.trim()).filter(Boolean) : []);

  const irrigation_sources = Array.isArray(data.irrigation_sources) && data.irrigation_sources.length > 0
    ? data.irrigation_sources
    : (data.irrigation_type ? data.irrigation_type.split(', ').map((s: string) => s.trim()).filter(Boolean) : []);

  const livestock_list = Array.isArray(data.livestock_list) && data.livestock_list.length > 0
    ? data.livestock_list
    : (data.livestock_type ? data.livestock_type.split(', ').map((s: string) => s.trim()).filter(Boolean) : []);

  const equipment_list = Array.isArray(data.equipment_list) && data.equipment_list.length > 0
    ? data.equipment_list
    : (data.equipment_needed ? data.equipment_needed.split(', ').map((s: string) => s.trim()).filter(Boolean) : []);

  return {
    ...data,
    gender: data.gender || fallbackGender || null,
    crops: crops.length > 0 ? crops : (data.crop_type ? [data.crop_type] : []),
    farming_types: farming_types.length > 0 ? farming_types : (data.farming_type ? [data.farming_type] : []),
    irrigation_sources: irrigation_sources.length > 0 ? irrigation_sources : (data.irrigation_type ? [data.irrigation_type] : []),
    livestock_list: livestock_list.length > 0 ? livestock_list : (data.livestock_type ? [data.livestock_type] : []),
    equipment_list: equipment_list.length > 0 ? equipment_list : (data.equipment_needed ? [data.equipment_needed] : []),
    kcc_status: data.kcc_status || (data.has_kcc ? 'active' : 'inactive'),
    pmfby_status: data.pmfby_status || (data.has_pmfby ? 'covered' : 'not_covered'),
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getStorageKey = (uid: string) => `@monitorx_profile_user_${uid}`;
  const getProfileIdKey = (uid: string) => `@monitorx_profile_id_user_${uid}`;

  const loadProfile = useCallback(async () => {
    if (!user || !user.id) {
      setProfile(null);
      setProfileId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = user.id;

    try {
      // 1. Try user-isolated local cache for instant rendering
      let cachedGender: string | null = null;
      const cached = await AsyncStorage.getItem(getStorageKey(uid));
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as FarmerProfile;
          cachedGender = parsed.gender || null;
          setProfile(parsed);
          setProfileId(parsed.id || null);
        } catch {}
      }

      const effectiveGender = user.gender || cachedGender || null;

      // 2. Check if we have a known mapped profileId for this user
      const mappedProfileId = await AsyncStorage.getItem(getProfileIdKey(uid));
      if (mappedProfileId) {
        const { data: profileById, error: idErr } = await supabase
          .from('farmer_profiles')
          .select('*')
          .eq('id', mappedProfileId)
          .maybeSingle();

        if (!idErr && profileById) {
          const hydrated = deserializeFromSupabase(profileById, effectiveGender);
          setProfile(hydrated);
          setProfileId(profileById.id);
          await AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(hydrated));
          return;
        }
      }

      // 3. Fallback: if user has a phone, query by phone in Supabase
      if (user.phone) {
        const phone = user.phone;
        const phone10 = phone.replace(/\D/g, '').slice(-10);
        const { data, error } = await supabase
          .from('farmer_profiles')
          .select('*')
          .or(`phone.eq.${phone},phone.eq.+91${phone10},phone.eq.${phone10}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const hydrated = deserializeFromSupabase(data, effectiveGender);
          setProfile(hydrated);
          setProfileId(data.id || null);
          await AsyncStorage.setItem(getProfileIdKey(uid), data.id);
          await AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(hydrated));
          return;
        }
      }

      // 4. If nothing found in DB and no cache, reset profile
      if (!cached) {
        setProfile(null);
        setProfileId(null);
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async (newProfile: FarmerProfile) => {
    if (!user || !user.id) {
      return { success: false, error: 'User must be authenticated to save a profile' };
    }

    try {
      const uid = user.id;
      const userPhone = newProfile.phone || user.phone || '';
      const phone10 = userPhone.replace(/\D/g, '').slice(-10);
      const normalizedPhone = phone10 ? `+91${phone10}` : newProfile.phone || null;
      const targetGender = newProfile.gender || profile?.gender || user.gender || null;

      const payloadWithPhone: FarmerProfile = {
        ...newProfile,
        phone: normalizedPhone,
      };

      const dbPayload = serializeForSupabase(payloadWithPhone);

      let savedData: FarmerProfile;
      let activeProfileId = profileId || newProfile.id || (await AsyncStorage.getItem(getProfileIdKey(uid))) || null;

      // 1. If not found, check by phone
      if (!activeProfileId && normalizedPhone) {
        const { data: existingByPhone } = await supabase
          .from('farmer_profiles')
          .select('id')
          .or(`phone.eq.${normalizedPhone},phone.eq.+91${phone10},phone.eq.${phone10}`)
          .limit(1)
          .maybeSingle();

        if (existingByPhone?.id) {
          activeProfileId = existingByPhone.id;
        }
      }

      // 2. Database UPDATE or INSERT
      if (activeProfileId) {
        const { data, error } = await supabase
          .from('farmer_profiles')
          .update(dbPayload)
          .eq('id', activeProfileId)
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Supabase update failed:', error.message);
          return { success: false, error: error.message };
        }
        savedData = {
          ...deserializeFromSupabase(data || { ...dbPayload, id: activeProfileId }, targetGender),
          gender: targetGender,
        };
      } else {
        const { data, error } = await supabase
          .from('farmer_profiles')
          .insert({
            ...dbPayload,
            created_at: new Date().toISOString(),
          })
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Supabase insert failed:', error.message);
          return { success: false, error: error.message };
        }
        savedData = {
          ...deserializeFromSupabase(data || dbPayload, targetGender),
          gender: targetGender,
        };
        activeProfileId = data?.id || `prof_${Date.now()}`;
      }

      setProfileId(activeProfileId);
      setProfile(savedData);

      // Cache locally per user ID for immediate & offline persistence
      if (activeProfileId) {
        await AsyncStorage.setItem(getProfileIdKey(uid), activeProfileId);
      }
      await AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(savedData));

      return { success: true };
    } catch (e: any) {
      console.error('Save profile error:', e);
      return { success: false, error: e?.message || 'Unknown error' };
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const hasProfile = Boolean(profile && profile.full_name && profile.full_name.trim().length > 0);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        profileId,
        loading,
        hasProfile,
        saveProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
