import os
from peewee import PostgresqlDatabase
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = urlparse(os.getenv("DATABASE_URL"))

db = PostgresqlDatabase(
    url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port or 5432,
    autorollback=True,
    sslmode='require',
)
