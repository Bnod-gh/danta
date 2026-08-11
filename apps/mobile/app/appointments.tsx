import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

const API_BASE = 'http://localhost:3000/api/v1';

type Appointment = {
  id: string;
  startTime: string;
  status: string;
  appointmentType: { name: string };
  provider: { firstName: string; lastName: string };
};

export default function AppointmentsScreen() {
  const { data } = useQuery({
    queryKey: ['mobile-appointments'],
    queryFn: async () => {
      const token = ''; // In production, retrieve from secure storage
      const res = await fetch(`${API_BASE}/patient-portal/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<Appointment[]>;
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>
      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.appointmentType.name}</Text>
            <Text style={styles.cardSubtitle}>
              {new Date(item.startTime).toLocaleDateString()} - {item.provider.firstName} {item.provider.lastName}
            </Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No appointments found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: 'gray', marginTop: 4 },
  status: { marginTop: 8, color: '#4f46e5', fontWeight: '500' },
  empty: { textAlign: 'center', color: 'gray', marginTop: 32 },
});
