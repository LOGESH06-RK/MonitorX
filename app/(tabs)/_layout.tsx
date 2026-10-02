import { Tabs } from 'expo-router';
import { Home, Landmark, Wallet, Calculator, User, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/lib/theme';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { Platform } from 'react-native';

// Admin portal accent blue — deliberately different from customer green
const ADMIN_BLUE = '#3B82F6';

export default function TabLayout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isAdmin ? ADMIN_BLUE : Colors.primary[700],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: isAdmin ? '#1E293B' : Colors.neutral[0],
          borderTopColor: isAdmin ? 'rgba(255,255,255,0.1)' : Colors.neutral[200],
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          // Admin has its own built-in bottom nav; hide system tab bar for admin
          display: isAdmin ? 'none' : 'flex',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          paddingBottom: 2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      {/* Customer-only tabs — hidden from admin */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
          href: isAdmin ? null : '/',
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: t('schemes'),
          tabBarIcon: ({ color }) => <Landmark size={20} color={color} />,
          href: isAdmin ? null : '/schemes',
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: t('loans'),
          tabBarIcon: ({ color }) => <Wallet size={20} color={color} />,
          href: isAdmin ? null : '/loans',
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: t('calculator'),
          tabBarIcon: ({ color }) => <Calculator size={20} color={color} />,
          href: isAdmin ? null : '/calculator',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
          href: isAdmin ? null : '/profile',
        }}
      />
      {/* Admin-only tab */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin Portal',
          tabBarIcon: ({ color }) => <ShieldCheck size={20} color={isAdmin ? ADMIN_BLUE : color} />,
          href: isAdmin ? '/admin' : null,
        }}
      />
    </Tabs>
  );
}
