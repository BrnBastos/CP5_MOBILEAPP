# CP5 Chat — FIAP Mobile Development

Aplicativo React Native de conversas individuais e em grupo com API própria e integração Firebase.

[Enunciado](https://github.com/anderltda/doc-react-native/blob/main/CPS/3ESPX/Segundo%20Semestre/README_TRABALHO_REACT_NATIVE_CHAT_FIREBASE_GRUPOS_PUSH.md) · [Repositório](https://github.com/BrnBastos/CP5_MOBILEAPP)

## Estado da entrega

O código das telas, serviços, API e regras está implementado. TypeScript, lint, testes unitários, testes integrados nos emuladores e exportação Android/iOS/web foram verificados localmente. **A entrega completa ainda depende do Firebase real, Cloudinary, publicação da API e comprovação de push em aparelhos.** Os emuladores não comprovam entrega FCM.

A API pública ainda não foi provisionada. `firebaseConfig.json` e os arquivos nativos Firebase serão incluídos somente após obter a configuração real. Nomes/RMs e evidências visuais também estão pendentes. Nenhuma integração pendente é simulada como funcional no aplicativo.

## Custo zero

Não ativar billing, planos pagos, trials que exijam cartão ou compras de créditos. Utilizar Firebase Spark e Cloudinary Image and Video APIs Free. A proposta Render Free precisa ser confirmada no cadastro; caso exija cartão, não prosseguir. Seu serviço gratuito suspende após inatividade e precisa ter o fluxo de retomada validado antes da entrega.

Push iOS via FCM depende de credencial APNs e de uma conta Apple com essa capacidade. Verificar acesso já existente da instituição/equipe, sem contratação adicional. [Avaliação de infraestrutura](docs/infraestrutura.md).

## Tecnologias

- Expo SDK 55, React Native 0.83, React 19.2 e TypeScript estrito.
- Expo Router, rotas protegidas, Hooks e componentes reutilizáveis.
- Firebase JS SDK: Authentication, Firestore e Realtime Database.
- React Native Firebase Messaging: FCM nativo. Expo Notifications: permissões e apresentação em primeiro plano.
- Cloudinary: fotos por upload assinado pela API; somente URL persistida no Firestore.
- API Node.js 24/TypeScript, Firebase Admin SDK e validação Zod.
- Testes Node.js e Firebase Emulator Suite; CI no GitHub Actions.

## Instalação e execução

```sh
nvm install
nvm use
npm ci
npm ci --prefix server
npm start
```

Após conectar os serviços, criar um `.env` local a partir de `.env.example` com a URL pública da API. Esse arquivo não deve ser versionado.

```sh
npm run android
npm run ios
npm run web
```

Android local exige um emulador/SDK Android; iOS exige macOS/Xcode. Expo Go pode apoiar as telas e o Firebase JS SDK; FCM exige development build nativo. Web é apoio ao desenvolvimento e não substitui validação nas plataformas exigidas.

## Firebase

1. Autenticar a conta Firebase e criar/selecionar um projeto no plano Spark.
2. Habilitar somente login por e-mail/senha.
3. Criar Firestore e Realtime Database.
4. Registrar apps web, Android (`com.brnbastos.cp5mobileapp`) e iOS (`com.brnbastos.cp5mobileapp`).
5. Salvar a configuração pública web completa como `firebaseConfig.json`, com `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId` e `appId` reais.
6. Salvar `google-services.json` e `GoogleService-Info.plist` de configuração cliente na raiz. Eles devem corresponder ao mesmo projeto.
7. Publicar `firebase/firestore.rules`, `firebase/database.rules.json` e os índices pelo CLI.
8. Configurar uma conta de serviço com permissões mínimas para as operações da API. Inserir seus valores exclusivamente nos segredos da hospedagem; nunca no app ou GitHub.

O script `scripts/configure-firebase.mjs` valida a configuração cliente e gera um módulo local antes dos comandos Expo e da tipagem. Sem configuração real, o aplicativo informa a pendência em vez de usar usuários ou bancos fictícios. `app.config.ts` aplica a configuração nativa quando os arquivos cliente existem.

Para automatizar o registro dos três apps e obter seus arquivos públicos, após autenticar o CLI e criar o Realtime Database:

```sh
npm run firebase:client -- ID_REAL_DO_PROJETO
```

O comando reutiliza apps do mesmo pacote, valida projeto e identificadores e grava os três arquivos de configuração. Não cria conta de serviço, não ativa Storage nem billing. A execução contra um projeto real ainda depende da autenticação da conta e não foi comprovada. Criação dos bancos, habilitação de e-mail/senha e publicação das regras continuam necessárias.

## API e publicação

```sh
npm ci --prefix server
npm --prefix server run build
npm --prefix server start
```

A API ouve `PORT` (padrão 3000). Seus segredos e nomes de variáveis estão documentados em `server/.env.example`. O serviço de produção deve receber esses valores como variáveis secretas da hospedagem.

`server/Dockerfile` produz uma imagem Node.js. `render.yaml` declara explicitamente `plan: free` e health check `/health`. Após conectar o repositório ao Render e configurar segredos, registrar a URL HTTPS real aqui e em `EXPO_PUBLIC_API_URL`. Ainda não há URL pública validada.

| Endpoint                                   | Função                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `GET /health`                              | Processo HTTP ativo; não comprova Firebase ou FCM                     |
| `GET /ready`                               | Confirma acesso ao Firestore                                          |
| `PUT /profile`                             | Salvar perfil do próprio usuário                                      |
| `GET /profiles/:uid`                       | Perfil completo, somente para o próprio usuário ou conversas em comum |
| `POST /direct`                             | Criar/localizar conversa de um par de UIDs                            |
| `POST /groups`                             | Criar grupo                                                           |
| `PUT /groups/:id`                          | Alterar grupo, somente proprietário                                   |
| `POST /groups/:id/members`                 | Adicionar/remover integrante de forma transacional                    |
| `POST /conversations/:id/messages`         | Persistir mensagem e validar acesso atomicamente                      |
| `POST /notifications/messages`             | Calcular destinatários e solicitar FCM após persistência              |
| `PUT /devices/:id` / `DELETE /devices/:id` | Registrar/remover dispositivo do usuário                              |
| `POST /media/signature`                    | Autorizar upload de foto sem expor segredo Cloudinary                 |

Rotas protegidas exigem `Authorization: Bearer <Firebase ID Token>` de autenticação por senha. O servidor valida revogação, schemas, participação e proprietário. O aplicativo nunca fornece uma lista de destinatários confiável ao servidor.

## Dados e segurança

Firestore guarda `users`, diretório mínimo `directory`, `groups`, `directConversations`, dispositivos privados e `notificationJobs`. Diretório contém apenas UID, nome e URL da foto; e-mail, celular e nascimento permanecem protegidos.

Realtime Database guarda `conversations/{id}/messages/{messageId}` e `conversations/{id}/access`. Os clientes têm leitura de mensagens somente quando o acesso está ativo e seu UID está autorizado. Escritas são realizadas pela API com validação de remetente e associação, inclusive dentro da transação que grava a mensagem.

O limite de grupo é verificado em transação Firestore. Uma alteração reserva a operação, bloqueia temporariamente a ACL, aplica integrantes e só então libera o acesso. Revisões monotônicas impedem que uma recuperação antiga restaure integrantes removidos. Operações incompletas permanecem recuperáveis pela API após reinício. Nenhuma Cloud Function é utilizada.

## Fotos

Utilizar Cloudinary Image and Video APIs Free. Configurar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` somente no servidor. O aplicativo seleciona imagens da galeria, pede permissão e solicita uma assinatura autenticada. Tipos aceitos: JPEG, PNG e WebP. A interface limita arquivos informados a 5 MB e apresenta fallback se a imagem falhar. URLs finais vão ao Firestore; Base64 não é armazenado nos bancos.

## Push

- `all_group_messages`: todos os integrantes ativos, exceto remetente.
- `mentioned_members`: somente integrantes explicitamente selecionados/mencionados.
- `direct_messages_only`: grupos não produzem push; conversas individuais notificam.
- `disabled`: nenhum push da conversa.

Mensagens direcionadas permanecem no histórico coletivo. O payload inclui `conversationId`, `conversationType` e `messageId`; o texto é genérico. Ao tocar, a rota protegida abre a conversa e os bancos revalidam acesso.

Android: configurar FCM e a permissão de notificações; canal `messages`. iOS: fornecer configuração Firebase, credencial APNs, capability de push e assinatura válida. Gerar build nativo com `npx expo run:android` ou `npx expo run:ios` somente após essas configurações. Builds locais não dependem de contratação EAS.

A API mantém uma reserva transacional por mensagem para evitar envios repetidos em chamadas concorrentes. Tokens inválidos são desativados. Falhas ambíguas do FCM não são repetidas automaticamente: isso evita duplicação, mas pode deixar um push sem entrega confirmada. Não há promessa de entrega externa exatamente uma vez.

## Verificação

```sh
npm run check
npx expo-doctor
npx expo export --platform all
```

Para teste integrado, instalar Java 21 ou superior e liberar as portas 9099, 8080 e 9000:

```sh
npm run test:integration
```

Esse comando inicia emuladores em um projeto `demo-cp5`, cria contas autenticadas temporárias e verifica capacidade concorrente, conversa individual sem duplicação, persistência, deduplicação de chamadas de push, privacidade e revogação. Sem emuladores, `npm run check` omite o teste integrado explicitamente; ele não equivale ao comando acima. A política desativada permite testar deduplicação sem simular entrega FCM.

Resultado local registrado: 4 testes passaram, incluindo a integração. Nenhum teste em aparelho físico, upload real ou recebimento FCM foi comprovado até o momento.

A revisão de dependências atualizou o gRPC utilizado pelo SDK Firebase para a versão corrigida 1.13.6. Permanecem avisos transitivos do ecossistema Expo, incluindo dependências sem correção publicada. Não foi aplicado `audit fix --force`, pois suas propostas incluem mudanças incompatíveis. [Revisão e limitações](docs/seguranca-dependencias.md).

## Estrutura

```text
src/app/             Rotas e telas
src/components/      Componentes de interface
src/contexts/        Sessão e perfil
src/hooks/           Listeners e notificações
src/services/        Firebase, API, fotos e FCM
src/types/           Schemas e modelos
server/src/          API, domínio, autenticação e serviços
server/tests/        Testes HTTP, domínio e integração
firebase/            Regras e índices versionados
scripts/             Configuração e execução de testes
```

## Evidências e entrega

Pendentes: prints das telas com dados reais, notificação recebida em Android/iOS, URL pública da API testada após inatividade, configuração Firebase real e nomes/RMs de todos os integrantes. A entrega pelo Teams será composta pelo link do repositório e URL da API. O trabalho ainda não está pronto para entrega.

## Integrantes

Nomes completos e RMs ainda precisam ser informados. Não foram inventados dados pessoais ou acadêmicos.
