# Wildlife Tracker — Plano de Implementação

## Objetivo
Evoluir o MVP para cobrir lacunas funcionais e técnicas essenciais para uso real.

## Backlog priorizado

### Fase 1 (concluída)
- [x] Adicionar fluxo de recuperação de senha por e-mail (request + reset por token).
- [x] Melhorar endpoint de mapa com filtro por bounding box (`min_lat`, `max_lat`, `min_lng`, `max_lng`).
- [x] Validar upload de imagens (content-type permitido e tamanho máximo por arquivo).
- [x] Melhorar listagem de ocorrências com paginação (`limit`, `offset`).
- [x] Cobrir novos fluxos com testes automatizados.
- [x] Atualizar README com instruções e exemplos de uso.

### Fase 2 (em andamento)
- [x] Trocar token customizado por JWT (HS256) com expiração de 7 dias (`python-jose`).
- [x] Rate limiting nos endpoints de autenticação para mitigar força bruta (`slowapi`).
- [x] Endpoint `DELETE /occurrences/{id}` — somente o autor pode remover sua ocorrência.
- [x] Endpoint `POST /auth/change-password` — troca de senha autenticada.
- [x] Parsear `images` no servidor antes de retornar a resposta (eliminar vazamento de serialização para o frontend).
- [x] Adicionar coluna `status` (`approved` / `pending` / `rejected`) à tabela `occurrences` com migração idempotente.
- [x] Aviso de startup quando `WILDLIFE_SECRET_KEY` usa o valor padrão inseguro.
- [x] Favicon `paw.svg` criado no frontend.
- [ ] Implementar envio real de e-mail (SMTP / provider transacional) — tokens de verificação e reset hoje são retornados na resposta JSON.
- [ ] Adicionar moderação de ocorrências com papéis (`admin` pode mover `pending → approved/rejected`).
- [ ] Migrar de SQLite para PostgreSQL + PostGIS.
- [ ] Refresh token (renovação silenciosa do JWT antes de expirar).

### Fase 3
- [ ] Clusterização de marcadores no front-end (ex.: `leaflet.markercluster`).
- [ ] Dashboard analítico (sazonalidade por espécie/região).
- [ ] Política de anonimização de coordenadas para espécies sensíveis.
- [ ] Página de perfil do usuário (editar dados da conta).
- [ ] Frontend: testes com Vitest + Testing Library.
- [ ] CI/CD pipeline (lint, build, testes) via GitHub Actions.
- [ ] Containerização com Docker + docker-compose (nginx, uvicorn, postgres).

## Lacunas conhecidas atuais

| # | Descrição | Prioridade |
|---|-----------|------------|
| 1 | E-mail real não é enviado — link retornado na API (dev only) | Alta |
| 2 | Sem refresh token — após 7 dias o usuário é deslogado | Média |
| 3 | SQLite não suporta múltiplos escritores concorrentes | Média |
| 4 | Sem validação de tamanho máximo em campos de texto | Baixa |
| 5 | Coordenadas de espécies sensíveis retornadas com precisão total | Baixa |
