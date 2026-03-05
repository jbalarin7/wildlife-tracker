# Wildlife Tracker (MVP)

Implementação inicial de uma API para rastreamento colaborativo de fauna e flora com:

- autenticação por e-mail (cadastro, verificação, login);
- submissão de ocorrências com latitude/longitude;
- upload e armazenamento local de imagens;
- endpoint GeoJSON para mapa de ocorrências.

## Estrutura

- `backend/app/main.py`: API FastAPI.
- `backend/app/database.py`: schema SQLite.
- `backend/app/security.py`: hash de senha e token de autenticação.
- `backend/tests/test_api.py`: teste do fluxo principal.

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
