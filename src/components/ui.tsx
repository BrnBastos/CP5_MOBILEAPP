import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export const colors = {
  bg: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  muted: '#cbd5e1',
  accent: '#67e8f9',
  error: '#fda4af',
};
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.text}>{children}</Text>;
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={s.error}>
      {message}
    </Text>
  ) : null;
}
export function Loading() {
  return <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando" />;
}
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && { opacity: 0.45 }]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#94a3b8"
        style={s.input}
        {...props}
      />
    </View>
  );
}
export function Avatar({ url, name, size = 52 }: { url?: string; name: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState('');
  if (url && failedUrl !== url)
    return (
      <Image
        accessibilityLabel={`Foto de ${name}`}
        source={{ uri: url }}
        onError={() => setFailedUrl(url)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.accent, fontSize: size / 3 }}>
        {name.slice(0, 2).toUpperCase() || '?'}
      </Text>
    </View>
  );
}
export function Row({
  title,
  subtitle,
  photoUrl,
  onPress,
}: {
  title: string;
  subtitle?: string;
  photoUrl?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
      <Avatar name={title} url={photoUrl} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.text}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.muted }}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 22,
    gap: 18,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  text: { color: colors.text, fontSize: 16 },
  error: { color: colors.error, fontSize: 15, lineHeight: 22 },
  button: { padding: 15, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.bg },
  input: {
    color: colors.text,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
});
