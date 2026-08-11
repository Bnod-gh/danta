import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';

const API_BASE = 'http://localhost:3000/api/v1';

type PatientForm = {
  id: string;
  type: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
};

export default function FormsScreen() {
  const { data } = useQuery({
    queryKey: ['mobile-forms'],
    queryFn: async () => {
      const token = ''; // In production, retrieve from secure storage
      const res = await fetch(`${API_BASE}/patient-portal/forms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<PatientForm[]>;
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Forms</Text>
      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.type.replace('_', ' ')}</Text>
            <Text style={styles.cardSubtitle}>Status: {item.status}</Text>
            <Text style={styles.cardSubtitle}>
              Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Pending'}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No forms found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  cardSubtitle: { color: 'gray', marginTop: 4 },
  empty: { textAlign: 'center', color: 'gray', marginTop: 32 },
});
