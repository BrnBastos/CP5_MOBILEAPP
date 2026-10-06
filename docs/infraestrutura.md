# Infraestrutura gratuita: avaliação inicial

Restrição: nenhuma cobrança, cartão ou ativação de billing. O projeto Firebase `cp5-mobileapp`, Cloudinary e a API Render já foram conectados e testados em 5 de outubro de 2026.

## Decisões e pendências

- Firebase Storage não será usado nas condições atuais: o requisito de Blaze conflita com a proibição de billing. Cloudinary Image and Video APIs Free foi escolhido: o plano oficial oferece $0, sem cartão. Upload assinado e leitura HTTPS foram comprovados; a imagem de teste foi removida.
- A API precisa funcionar pela internet. Render Free é candidato, mas suspende após 15 minutos sem tráfego e pode levar aproximadamente um minuto para voltar. Não considerar disponibilidade validada até testar o fluxo real após inatividade e avaliar sua compatibilidade com a correção.
- FCM no iOS exige credencial APNs. A equipe informou não ter acesso a Apple Developer/APNs. Push iOS continua pendente; buscar acesso institucional já existente sem contratação.
- Authentication, Firestore e Realtime Database foram testados no projeto real. Entrega FCM ainda exige aparelhos/builds e credenciais nativas.
- API publicada: https://cp5-chat-api-mhx2.onrender.com. FCM Android real foi recebido no emulador Google Play. Permanecem pendentes retomada após inatividade, cold start standalone e execução/push iOS.

## API preparada localmente

A API Node.js possui autenticação Firebase, perfis, grupos, mensagens, assinatura de fotos, FCM e configuração Render explicitamente `plan: free`. A integração foi testada em emuladores e no projeto real. `/health` confirma o processo HTTP; `/ready` confirma acesso ao Firestore. Nenhum desses endpoints comprova recebimento FCM.

## Fontes oficiais

- [Cloudinary Free sem cartão](https://cloudinary.com/pricing).
- [Requisitos de billing do Firebase Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).
- [Limites e suspensão do Render Free](https://render.com/docs/free).
- [Configuração FCM para iOS e credencial APNs](https://firebase.google.com/docs/cloud-messaging/ios/get-started).
- [Capacidades Apple conforme associação](https://developer.apple.com/help/account/reference/supported-capabilities-ios).

## Limite de uso do agente

O usuário revogou o limite percentual e pediu continuidade sem pausas de cota. A restrição de infraestrutura gratuita e sem cartão permanece.
