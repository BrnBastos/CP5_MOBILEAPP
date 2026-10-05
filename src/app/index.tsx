import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>CP5 · MOBILE DEVELOPMENT</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Conecte suas conversas.
        </Text>
        <Text style={styles.description}>
          A base do aplicativo está pronta. Cadastro, conversas e grupos serão implementados nas
          próximas etapas.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    padding: 28,
    gap: 20,
  },
  label: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#f8fafc',
    fontSize: 40,
    fontWeight: '700',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 17,
    lineHeight: 26,
  },
});
