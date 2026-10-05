# CP5 Mobile App

Aplicativo acadêmico de chat individual e em grupo para a disciplina Mobile Development da FIAP.

[Enunciado do trabalho](https://github.com/anderltda/doc-react-native/blob/main/CPS/3ESPX/Segundo%20Semestre/README_TRABALHO_REACT_NATIVE_CHAT_FIREBASE_GRUPOS_PUSH.md)

## Estado atual

Primeira etapa: projeto Expo criado, navegação inicial, TypeScript estrito, lint, formatação e integração com GitHub. A tela inicial apresenta a base do projeto; autenticação, chats, bancos Firebase e push ainda não estão implementados.

## Restrição de infraestrutura

Todo o projeto deverá usar soluções gratuitas, sem cartão de crédito ou custos adicionais. Não serão ativados planos pagos nem trials que exijam cartão. A seleção de armazenamento de imagens, hospedagem da API e a viabilidade das credenciais de push iOS serão revisadas sob essa restrição antes da integração. Um requisito só será marcado como concluído depois de validado funcionalmente.

## Tecnologias da base

- React Native 0.83 e React 19.2.
- Expo SDK 55.
- Expo Router, com rotas tipadas.
- TypeScript em modo estrito.
- ESLint e Prettier.
- npm, com lockfile versionado.

## Instalação e execução

Utilize Node.js 24 LTS e npm. Se usar nvm:

```sh
nvm install
nvm use
npm ci
npm ci --prefix server
npm start
```

Com o servidor em execução, é possível abrir a base atual no Expo Go, em um emulador Android ou no simulador iOS. As futuras integrações nativas de push exigirão outra estratégia de build, a ser validada sem custos.

```sh
npm run android
npm run ios
npm run web
```

Android local exige emulador configurado; iOS local exige macOS e Xcode. A visualização web serve de apoio ao desenvolvimento e não substitui a validação mobile.

## Verificação

```sh
npm run check
npx expo-doctor
```

`check` executa TypeScript, lint e verificação de formatação. O GitHub Actions executa o mesmo comando em pushes para `main` e pull requests.

Validação da base: `npm run check` passou, Expo Doctor passou em 20/20 verificações e `npx expo export --platform all` gerou os bundles Android, iOS e web. A exportação verifica a compilação JavaScript; ainda não houve build nativo nem teste em aparelho físico.

```sh
npm run format
```

## Estrutura inicial

```text
src/app/               Rotas e layout do aplicativo
.github/workflows/     Verificação automática
AGENTS.md              Regras de desenvolvimento e restrição de custo zero
.env.example           Nomes das variáveis públicas previstas
app.json               Configuração Expo
```

Componentes, hooks, serviços, contextos, tipos e a API serão adicionados conforme sua implementação.

## Configuração e segurança

- Nenhuma credencial real é necessária para executar esta primeira etapa.
- `.env.example` documenta a URL pública prevista da API.
- `firebaseConfig.json` será adicionado com a configuração cliente real na etapa Firebase.
- Credenciais administrativas, chaves privadas e tokens não podem entrar no repositório nem no aplicativo.

## Próximas etapas

- [x] Criar a base Expo e conectar ao GitHub.
- [ ] Confirmar infraestrutura gratuita e sem cartão.
- [ ] Integrar Firebase e implementar regras de segurança.
- [ ] Implementar cadastro, login, sessão e fotos.
- [ ] Implementar usuários, perfis e conversas individuais.
- [ ] Implementar grupos com proteção de capacidade sob concorrência.
- [ ] Implementar mensagens no Realtime Database.
- [ ] Implementar API online e políticas de push.
- [ ] Validar Android e iOS, documentar resultados e incluir evidências reais.
- [ ] Completar dados dos integrantes e preparar a entrega.

## Integrantes

Nomes completos e RMs ainda precisam ser informados e incluídos antes da entrega. Este README não é a documentação final do trabalho.

## API: base da etapa 2

Servidor Node.js com TypeScript, sem dependências de runtime. Para executar localmente:

```sh
npm ci --prefix server
npm run server:dev
```

`GET http://localhost:3000/health` confirma que o processo responde. A API ainda não está publicada e não envia notificações. O arquivo `render.yaml` prepara um serviço explicitamente gratuito; o deploy dependerá da conta Render e da verificação de que o cadastro não exige cartão. As fotos usarão Cloudinary Free, cuja configuração ainda está pendente. Veja [a avaliação de infraestrutura](docs/infraestrutura.md).
