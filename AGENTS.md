# Instruções do projeto

- O usuário limitou esta tarefa a 15% de sua cota semanal, com reinício em 9 de outubro. Não há acesso ao saldo semanal nem conversão conhecida para tokens. Solicitar um teto numérico antes de iniciar trabalho prolongado; não inventar um orçamento nem alegar controlar a cota da conta. Evitar delegação, leituras extensas e verificações repetidas.
- Todo o projeto deve funcionar com soluções gratuitas, sem cartão de crédito, contratação ou custos adicionais. Não habilitar planos pagos, billing, trials que exijam cartão ou serviços que possam gerar cobranças.
- Antes de escolher infraestrutura, verificar se o plano gratuito atende ao requisito sem cartão. Quando um requisito não puder ser atendido nessas condições, documentar a limitação e informar o usuário; não declarar integração simulada como funcional.
- Usar React Native, Expo SDK 55 ou superior e TypeScript estrito. Não usar `any` no código do projeto.
- Manter componentes, hooks, serviços, contextos e tipos separados quando implementados. As rotas ficam em `src/app`.
- Nunca versionar credenciais administrativas, chaves privadas, tokens de acesso ou arquivos de ambiente reais.
- A configuração pública do SDK Firebase deverá ser versionada como `firebaseConfig.json` somente após obter os valores reais do projeto. Não confundir essa configuração com uma conta de serviço.
- Não implementar Cloud Functions for Firebase. A API de notificações será separada do aplicativo.
- Validar alterações com `npm run check` e, quando houver alterações nas dependências ou configuração Expo, `npx expo-doctor`.
- Atualizar o README conforme funcionalidades reais forem concluídas. Não inventar RMs, integrantes, resultados de testes ou evidências de push.
