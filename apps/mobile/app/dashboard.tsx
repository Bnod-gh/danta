import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function DashboardScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Dashboard</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: 'gray', fontSize: 12 }}>Appointments</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>0</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: 'gray', fontSize: 12 }}>Balance</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>$0</Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Quick Actions</Text>
          <Text onPress={() => router.push('/appointments')} style={{ padding: 12, backgroundColor: '#eef2ff', borderRadius: 8, color: '#4f46e5', fontWeight: '500' }}>View Appointments</Text>
          <Text onPress={() => router.push('/forms')} style={{ padding: 12, backgroundColor: '#eef2ff', borderRadius: 8, color: '#4f46e5', fontWeight: '500', marginTop: 8 }}>My Forms</Text>
        </View>
      </View>
    </ScrollView>
  );
}
