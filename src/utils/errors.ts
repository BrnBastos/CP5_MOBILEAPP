import { FirebaseError } from 'firebase/app';
export function errorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
      'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.',
      'auth/invalid-email': 'Informe um e-mail válido.',
      'auth/network-request-failed': 'Confira sua conexão e tente novamente.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde antes de tentar novamente.',
      'permission-denied': 'Você não tem acesso a esses dados.',
      PERMISSION_DENIED: 'Seu acesso à conversa foi removido.',
    };
    return messages[error.code] ?? 'Não foi possível acessar o Firebase. Tente novamente.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
