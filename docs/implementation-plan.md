# Wildlife Tracker — Plano de Implementação

## Objetivo
Evoluir o MVP para cobrir lacunas funcionais e técnicas essenciais para uso real.

## Backlog priorizado

### Fase 1 (neste commit)
- [x] Adicionar fluxo de recuperação de senha por e-mail (request + reset por token).
- [x] Melhorar endpoint de mapa com filtro por bounding box (`min_lat`, `max_lat`, `min_lng`, `max_lng`).
- [x] Validar upload de imagens (content-type permitido e tamanho máximo por arquivo).
- [x] Melhorar listagem de ocorrências com paginação (`limit`, `offset`).
- [x] Cobrir novos fluxos com testes automatizados.
- [x] Atualizar README com instruções e exemplos de uso.

### Fase 2
- [ ] Trocar token customizado por JWT com expiração e refresh token.
- [ ] Implementar envio real de e-mail (SMTP/provider).
- [ ] Adicionar moderação (`pending`, `approved`, `rejected`) com papéis.
- [ ] Migrar de SQLite para PostgreSQL + PostGIS.

### Fase 3
- [ ] Clusterização de marcadores no front-end.
- [ ] Dashboard analítico (sazonalidade por espécie/região).
- [ ] Política de anonimização de coordenadas para espécies sensíveis.
