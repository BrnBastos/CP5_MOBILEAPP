# Revisão de dependências — 5 de outubro de 2026

O `npm audit` identifica dependências transitivas vulneráveis. O projeto ainda não tem uma auditoria sem avisos. A atualização automática com `--force` propõe inclusive downgrades incompatíveis de Expo e Firebase e não foi utilizada.

Foi aplicado um override específico para `@firebase/firestore` utilizar `@grpc/grpc-js@1.13.6`, substituindo 1.9.16 em suas árvores. A [publicação do mantenedor](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j) identifica 1.13.6 como versão corrigida. O servidor possui instalação separada e já utiliza gRPC 1.14.5. Tipagem, lint, testes locais, Expo Doctor e exportação Android/iOS/web passaram após a atualização do aplicativo. Isso não comprova operação com Firebase real ou recebimento de push.

## Limitações restantes

| Dependência                  | Onde foi encontrada                  | Decisão                                                                                                                                                              |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decode-uri-component@0.2.2` | `expo-router` → `query-string@7.1.3` | A correção 0.5.0 utiliza ESM, enquanto esse consumidor utiliza `require()` de uma função CommonJS. Não substituir diretamente sem adaptar e validar essa integração. |
| `node-forge@1.4.0`           | CLI e certificados do Expo           | Sem versão corrigida publicada no aviso consultado. Aguardar correção do mantenedor; não declarar resolvido.                                                         |
| `braces@3.0.3`               | Metro → micromatch                   | Sem versão corrigida publicada no aviso consultado. Aguardar correção do mantenedor; não declarar resolvido.                                                         |
| `uuid@7.0.3`                 | Plugins Expo → xcode                 | A correção exige mudança de versão principal. Não alterar automaticamente a árvore de geração nativa sem validar compatibilidade.                                    |

Os avisos correspondentes são [decode-uri-component](https://github.com/SamVerschueren/decode-uri-component/security/advisories/GHSA-vcc3-ghjq-m6fr), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) e [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq). A existência de um aviso não foi interpretada como prova de exploração no app; a existência de testes aprovados também não foi interpretada como eliminação desses riscos.

Reavaliar versões e avisos antes da entrega. Manter separados os resultados de auditoria da raiz e de `server/`, pois são instalações e ambientes distintos:

```sh
npm audit --omit=dev
npm audit --omit=dev --prefix server
```
