# Wildlife Tracker (MVP+)

Implementação inicial da API para rastreamento colaborativo de fauna e flora com:

- autenticação por e-mail (cadastro, verificação, login);
- recuperação de senha por token;
- submissão de ocorrências com latitude/longitude;
- upload e armazenamento local de imagens (validação de tipo e tamanho);
- endpoint GeoJSON para mapa de ocorrências (com filtro por bounding box);
- listagem de ocorrências com paginação.

## Estrutura

- `backend/app/main.py`: API FastAPI.
- `backend/app/database.py`: schema SQLite.
- `backend/app/security.py`: hash de senha e token de autenticação.
- `backend/tests/test_api.py`: testes do fluxo principal.
- `docs/implementation-plan.md`: plano de implementação incremental.

## Executar

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Testes

```bash
cd backend
source .venv/bin/activate
pytest -q
```

## Exemplos rápidos

### Registro

```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Esqueci senha

```bash
curl -X POST http://127.0.0.1:8000/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com"}'
```

### Listar ocorrências paginadas

```bash
curl 'http://127.0.0.1:8000/occurrences?limit=20&offset=0'
```

### Mapa com bounding box

```bash
curl 'http://127.0.0.1:8000/map/geojson?min_lat=-16&max_lat=-15&min_lng=-48&max_lng=-47'
```
