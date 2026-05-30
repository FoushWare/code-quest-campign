import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Mobile</Text>
        <Text style={styles.title}>Expo mobile scaffold</Text>
        <Text style={styles.body}>
          This placeholder app reserves the mobile micro-frontend slot for the
          future learner experience.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    backgroundColor: '#111827',
    padding: 28,
  },
  eyebrow: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#e5eefb',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    color: '#93a4bf',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
});