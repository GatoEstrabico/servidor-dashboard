# Monitoramento de Laboratorio

- API: Fastify + TypeScript em `apps/api`; validacao de entrada com Zod.
- Persistencia: PostgreSQL via Prisma. Altere `apps/api/prisma/schema.prisma` e atualize o banco conscientemente.
- Painel: Vue 3 + Vite + TypeScript em `apps/dashboard`.
- Segredos ficam no `.env`; nunca exponha chaves de sessao ou ingestao no frontend.
- Execute `npm run build` e `npm test` antes de concluir mudancas relevantes.
