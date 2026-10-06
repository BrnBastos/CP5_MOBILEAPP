# Auditoria dos requisitos — 5 de outubro de 2026

API auditada: https://cp5-chat-api-mhx2.onrender.com. Projeto Firebase: `cp5-mobileapp`. Os testes foram executados por chamadas HTTPS reais, com contas temporárias autenticadas por e-mail e senha. Não utilizaram os emuladores nem credenciais Admin embutidas no aplicativo.

## Resultados comprovados

- `/health` e `/ready`: HTTP 200; perfis e notificações sem login: HTTP 401; token inválido: HTTP 401; preflight CORS: HTTP 204.
- 49 verificações autenticadas passaram na produção. Incluem criação de contas e perfis, recusa de senha incorreta, conversa individual sem duplicação, proteção de capacidade sob concorrência, privacidade e mensagens reais persistidas.
- A API ignorou um `senderId` falsificado e persistiu o UID autenticado. Reenvio da mesma mensagem foi aceito sem duplicação; reutilização do ID com outro conteúdo retornou 409.
- Mensagem direcionada continuou visível no histórico coletivo. Não participantes não puderam ler ou enviar mensagens. Depois da remoção, o integrante perdeu acesso ao Firestore e ao RTDB e não pôde enviar mensagens ou solicitar push.
- As quatro políticas puderam ser configuradas pelo proprietário. Chamadas concorrentes de notificação produziram um único job. O teste utilizou `disabled` e confirmou zero envios; não comprova entrega FCM.
- Assinatura Cloudinary autenticada, upload de PNG e leitura da imagem por HTTPS funcionaram. A imagem foi excluída após o teste. Seleção da galeria e permissões do dispositivo não foram verificadas por esse teste HTTP.
- Build Android nativo aprovado (`assembleDebug`, 490 tarefas, 5min19s), APK instalado e tela de login aberta no emulador Google Play Android 16. Login, restauração da sessão, mensagens do RTDB, token FCM real, recebimento Android em foreground e abertura do grupo ao tocar foram comprovados.
- 20 operações de limpeza de contas/dados do teste principal concluíram sem falhas. A conta do teste de fotos e a imagem também foram excluídas.
- Configurações cliente reais foram obtidas e as regras/indexes foram publicados. `npm run check`, Expo Doctor (20/20) e exportação Android/iOS/web passaram após conectar o app.

- Com token real registrado pelo app, as quatro políticas retornaram as quantidades esperadas: all_group_messages enviou ao outro integrante, menção direcionada enviou uma vez, menção ausente/grupo em direct_messages_only/disabled enviaram zero. Conversa individual enviou uma vez. Remetente e integrante removido com token real foram excluídos.
- Notificações Android em background foram vistas no sistema. No teste com processo encerrado, o development client falhou com `Unable to load script`; cold start deve ser refeito com APK que embuta o bundle. Não foi declarado aprovado.
- Prints reais e relatório sanitizado Android estão em `docs/evidencias/` e `verificacao-android.json`. As identidades de auditoria são contas reais temporárias, não integrantes inventados.

## Correções encontradas na execução Android

- A restauração identificava a conta, mas o listener do perfil não respondia de forma confiável. O Firestore passou a usar `experimentalForceLongPolling` nos clientes nativos, mantendo o transporte padrão no web. Referência: [FirestoreSettings](https://firebase.google.com/docs/reference/js/firestore.firestoresettings).
- As chamadas à API usavam `AbortSignal.timeout`, ausente no polyfill do React Native instalado. Foi substituído por `AbortController` com timer de 90 segundos e limpeza em `finally`.

## Comparação com o enunciado

| Requisito                                    | Evidência atual                                                                                   | Trabalho restante                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Expo 55+, TypeScript, hooks e módulos        | Manifestos, tipagem/lint aprovados, hooks com estado/listeners; sem `any` no código próprio       | Validar comportamento visual dos hooks e estados no app                         |
| Cadastro/login por senha e perfis            | Senha incorreta recusada; perfis protegidos; login, restauração e logout Android aprovados        | Cadastro com foto e demais campos pela interface                                |
| Conversa individual única para dois usuários | Criação simultânea retornou o mesmo ID; conversa consigo mesmo recusada                           | Fluxo visual e navegação ao perfil                                              |
| Grupos, proprietário, capacidade e políticas | Concorrência respeitou última vaga; não proprietário e redução abaixo da ocupação recusados       | Criação/edição e indicadores pela interface                                     |
| Mensagens no RTDB e direcionamento           | Persistência protegida; histórico coletivo; listener Android mostrou mensagens reais              | Dois clientes simultâneos, rolagem e todos os estados visuais                   |
| Revogação de integrantes                     | Removido sem leitura/envio/push; grupo desapareceu da lista Android                               | Confirmar limpeza da interface ao remover usuário com chat aberto               |
| Fotos em armazenamento e URLs no Firestore   | Upload Cloudinary real; implementação grava URLs; nenhuma imagem Base64 nos bancos                | Galeria, permissões e alteração das fotos pela interface                        |
| API própria pública HTTPS                    | Health, Firestore e rotas autenticadas testados                                                   | Retomada do serviço Free após inatividade                                       |
| Destinatários e deduplicação de push         | FCM real Android; quantidades das quatro políticas, deduplicação, remetente e removido conferidos | Ampliar evidências de recebimento por política e diferentes clientes            |
| Android e iOS                                | Android compilado/instalado; sessão, histórico e FCM reais; iOS apenas exportado                  | Cold start standalone e fluxos completos Android; build, execução e APNs no iOS |
| Toque na notificação abre conversa           | Toque em foreground Android abriu o grupo e mostrou histórico real                                | Navegação em background e APK com processo encerrado                            |
| Segurança dos bancos e segredos              | Regras publicadas e acessos negados em produção; configurações cliente públicas versionadas       | Manter segredos somente na hospedagem; revisar avisos transitivos documentados  |
| README, URL, prints e evidência de push      | URL e configuração reais, instruções, prints e recebimento Android documentados                   | Demais prints dos fluxos e evidência iOS                                        |
| Integrantes e entrega                        | Repositório público e cinco nomes/RMs registrados no README                                       | Realizar entrega pelo Teams após concluir pendências                            |

Os cinco integrantes e seus RMs foram informados pelo usuário e incluídos no README. A equipe informou não ter acesso a Apple Developer/APNs. Por isso, o recebimento de push iOS continua pendente; não contratar associação para contornar a restrição de custo zero.

## Limites desta auditoria

Os 49 testes HTTPS não substituem execução das telas nem recebimento FCM. A validação nativa Android adicional comprovou recebimento real, mas não cobre todos os fluxos ou iOS. Exportação JavaScript não é compilação nativa. Uma política `disabled` confirma processamento/deduplicação sem produzir notificações, portanto não foi apresentada como prova de push.

Fontes: [enunciado](https://github.com/anderltda/doc-react-native/blob/main/CPS/3ESPX/Segundo%20Semestre/README_TRABALHO_REACT_NATIVE_CHAT_FIREBASE_GRUPOS_PUSH.md), [resultados da API](verificacao-api.json), [resultados Android](verificacao-android.json), [revisão de dependências](seguranca-dependencias.md).
