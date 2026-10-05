# Infraestrutura gratuita: avaliação inicial

Restrição: nenhuma cobrança, cartão ou ativação de billing. Nenhum serviço externo foi provisionado nesta avaliação.

## Decisões e pendências

- Firebase Storage não será usado nas condições atuais: o requisito de Blaze conflita com a proibição de billing. Cloudinary Image and Video APIs Free foi escolhido: o plano oficial oferece $0, sem cartão. Provisionamento e integração ainda pendentes.
- A API precisa funcionar pela internet. Render Free é candidato, mas suspende após 15 minutos sem tráfego e pode levar aproximadamente um minuto para voltar. Não considerar disponibilidade validada até testar o fluxo real após inatividade e avaliar sua compatibilidade com a correção.
- FCM no iOS exige credencial APNs. Confirmar se existe acesso institucional ou de equipe a uma conta com capacidade de push, sem custo adicional ao usuário. Ainda não é possível afirmar que todos os requisitos iOS podem ser atendidos sem cartão ou contratação.
- Authentication, Firestore, Realtime Database e FCM serão avaliados dentro das cotas gratuitas antes do provisionamento.
- A seleção definitiva da hospedagem e do armazenamento continua pendente; esta avaliação não conclui a etapa de infraestrutura.

## API preparada localmente

A API Node.js possui health check HTTP e configuração Render explicitamente `plan: free`. Ainda não foi publicada e não possui integração Firebase nesta etapa. O health check comprova apenas que o processo responde.

## Fontes oficiais

- [Cloudinary Free sem cartão](https://cloudinary.com/pricing).
- [Requisitos de billing do Firebase Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).
- [Limites e suspensão do Render Free](https://render.com/docs/free).
- [Configuração FCM para iOS e credencial APNs](https://firebase.google.com/docs/cloud-messaging/ios/get-started).
- [Capacidades Apple conforme associação](https://developer.apple.com/help/account/reference/supported-capabilities-ios).

## Limite de uso do agente

O usuário confirmou preservar ao menos 71% da cota semanal, partindo dos 86% informados, até 9 de outubro. O agente não consulta o painel; solicitar leitura do percentual entre etapas curtas. Não existe conversão confiável entre tokens registrados e percentual de cota. A meta permanece implementar e verificar o trabalho completo, mantendo explícitos os requisitos ainda não comprovados.
