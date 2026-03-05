import pytest


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset the in-memory rate limiter state before each test so that
    limits set on auth endpoints do not leak across test functions."""
    from app.main import limiter
    limiter._storage.reset()
    yield
