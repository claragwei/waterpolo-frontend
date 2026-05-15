import os
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv
from peewee import PostgresqlDatabase

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

raw_url = os.getenv("DATABASE_URL", "").strip()
if not raw_url:
    raise ValueError("DATABASE_URL is not set in backend/.env")

url = urlparse(raw_url)
db_name = url.path[1:] if url.path else "postgres"
host = (url.hostname or "localhost").lower()
qs = parse_qs(url.query)
ssl_from_url = (qs.get("sslmode") or [None])[0]

# Local Postgres often has no TLS; Supabase requires SSL. Override with DATABASE_SSLMODE.
if os.getenv("DATABASE_SSLMODE"):
    sslmode = os.getenv("DATABASE_SSLMODE", "require")
elif ssl_from_url:
    sslmode = ssl_from_url
elif host in ("localhost", "127.0.0.1"):
    sslmode = "prefer"
else:
    sslmode = "require"

connect_timeout = int(os.getenv("DATABASE_CONNECT_TIMEOUT", "10"))

db = PostgresqlDatabase(
    db_name,
    user=url.username,
    password=url.password or None,
    host=url.hostname,
    port=url.port or 5432,
    autorollback=True,
    sslmode=sslmode,
    connect_timeout=connect_timeout,
)
