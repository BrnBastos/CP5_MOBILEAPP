import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, insetShadow, softShadow } from '@/theme/theme';
export { colors } from '@/theme/theme';

export function Brand() {
  return (
    <View style={s.brand} accessibilityLabel="Nivo">
      <View style={s.brandMark}>
        <Text style={s.brandLetter}>n</Text>
        <View style={s.brandDot} />
      </View>
      <View>
        <Text style={s.brandName}>nivo</Text>
        <Text style={s.brandCaption}>mais perto, em cada conversa</Text>
      </View>
    </View>
  );
}
export function Screen({
  title,
  subtitle,
  eyebrow,
  hasNavigationHeader = false,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  hasNavigationHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <SafeAreaView
      style={s.screen}
      edges={hasNavigationHeader ? ['left', 'right', 'bottom'] : undefined}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={hasNavigationHeader ? 96 : 0}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
          <Brand />
          <View style={s.heading}>
            {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
            <Text accessibilityRole="header" style={s.title}>
              {title}
            </Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={s.sectionHeading}>
      <Text accessibilityRole="header" style={s.sectionTitle}>
        {title}
      </Text>
      {detail ? <Text style={s.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}
export function Label({
  children,
  muted = false,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[s.text, muted && s.muted, style]}>{children}</Text>;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card style={s.empty}>
      <View style={s.emptyMark}>
        <Text style={s.emptySymbol}>···</Text>
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyDescription}>{description}</Text>
    </Card>
  );
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <View style={s.errorBox}>
      <Text accessibilityRole="alert" style={s.error}>
        {message}
      </Text>
    </View>
  ) : null;
}
export function Loading() {
  return (
    <ActivityIndicator
      style={{ padding: 16 }}
      color={colors.accent}
      accessibilityLabel="Carregando"
    />
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === 'primary' ? s.primary : variant === 'secondary' ? s.secondary : s.ghost,
        pressed && s.pressed,
        disabled && s.disabled,
        style,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          variant === 'primary'
            ? s.primaryText
            : variant === 'danger'
              ? s.dangerText
              : s.secondaryText,
          disabled && s.disabledText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7C928B"
        style={[s.input, focused && s.inputFocused, style]}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
      />
    </View>
  );
}
export function Avatar({ url, name, size = 52 }: { url?: string; name: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState('');
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {url && failedUrl !== url ? (
        <Image
          accessibilityLabel={`Foto de ${name}`}
          source={{ uri: url }}
          onError={() => setFailedUrl(url)}
          style={{ width: size - 8, height: size - 8, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={{ color: colors.accent, fontSize: size / 3, fontWeight: '600' }}>
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}
export function Row({
  title,
  subtitle,
  photoUrl,
  onPress,
  selected,
}: {
  title: string;
  subtitle?: string;
  photoUrl?: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => [s.row, selected && s.selectedRow, pressed && s.pressed]}
    >
      <Avatar name={title} url={photoUrl} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={[s.rowArrow, selected && { color: colors.accent }]}>
        {selected ? '✓' : selected === false ? '+' : '›'}
      </Text>
    </Pressable>
  );
}
export function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.profileDetail}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text selectable style={s.text}>
        {value}
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 24,
    gap: 22,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.card,
    boxShadow: softShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { fontSize: 35, lineHeight: 39, fontWeight: '800', color: colors.accent },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
    position: 'absolute',
    right: 9,
    top: 10,
  },
  brandName: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -1 },
  brandCaption: { color: colors.muted, fontSize: 11, marginTop: 1 },
  heading: { gap: 10, paddingTop: 10, paddingBottom: 2 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -1, color: colors.text },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  card: {
    padding: 22,
    gap: 18,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    boxShadow: softShadow,
  },
  text: { color: colors.text, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  sectionDetail: { color: colors.muted, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyMark: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptySymbol: { fontSize: 35, fontWeight: '800', color: colors.blue, lineHeight: 40 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorBox: {
    backgroundColor: colors.errorSoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F5DADD',
  },
  error: { color: colors.error, fontSize: 14, lineHeight: 21 },
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: colors.accent,
    boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 12, color: '#167B6226' }],
  },
  secondary: { backgroundColor: colors.card, borderColor: '#FFFFFF', boxShadow: softShadow },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  disabled: { backgroundColor: '#E5ECE9', boxShadow: [] },
  buttonText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: colors.blue },
  dangerText: { color: colors.error },
  disabledText: { color: '#657C77' },
  field: { gap: 9 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  input: {
    color: colors.text,
    backgroundColor: '#F1F6F4',
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    boxShadow: insetShadow,
  },
  inputFocused: { borderColor: colors.accent, backgroundColor: '#F8FCFA' },
  avatar: {
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    boxShadow: softShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 16,
    borderRadius: 23,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    boxShadow: softShadow,
    minHeight: 86,
  },
  selectedRow: { borderColor: '#A5D4BE', backgroundColor: colors.greenSoft },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  rowSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  rowArrow: { color: colors.blue, fontSize: 24, paddingHorizontal: 3 },
  profileDetail: { gap: 6, paddingVertical: 8 },
});
