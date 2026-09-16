import { Tabs } from 'expo-router';
import { Home, Landmark, Wallet, Calculator, User, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/lib/theme';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[700],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: Colors.neutral[0],
          borderTopColor: Colors.neutral[200],
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
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
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: t('schemes'),
          tabBarIcon: ({ color }) => <Landmark size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: t('loans'),
          tabBarIcon: ({ color }) => <Wallet size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: t('calculator'),
          tabBarIcon: ({ color }) => <Calculator size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('admin'),
          tabBarIcon: ({ color }) => <ShieldCheck size={20} color={isAdmin ? Colors.primary[700] : color} />,
          // Hide admin tab from navigation bar if user is not an authorized bank admin
          href: isAdmin ? '/admin' : null,
        }}
      />
    </Tabs>
  );
}
