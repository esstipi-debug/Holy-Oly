"""
Script para ejecutar migraciones SQL en PostgreSQL / AlloyDB.

Uso:
    python execute_migration.py                  # Ejecuta todas las migraciones pendientes
    python execute_migration.py 005              # Ejecuta solo 005_*.sql
    python execute_migration.py 005_github_oauth # Match parcial
    python execute_migration.py --list           # Lista migraciones disponibles
"""
import os
import sys
import glob
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "migrations")


def list_migrations() -> list[str]:
    """Lista migraciones ordenadas por número."""
    files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql")))
    return [os.path.basename(f) for f in files]


def find_migration(query: str) -> list[str]:
    """Encuentra migraciones que matchean el query (prefijo o nombre parcial)."""
    all_migs = list_migrations()
    return [m for m in all_migs if query in m or m.startswith(query)]


def execute_file(engine, path: str) -> bool:
    """Ejecuta un archivo SQL completo. Retorna True si OK."""
    name = os.path.basename(path)
    print(f"\n📄 {name}")
    print("-" * 50)

    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(";") if s.strip()]
    ok_count, skip_count, err_count = 0, 0, 0

    with engine.connect() as conn:
        for i, stmt in enumerate(statements, 1):
            try:
                conn.execute(text(stmt))
                ok_count += 1
            except Exception as e:
                msg = str(e).lower()
                if any(k in msg for k in ("already exists", "duplicate", "does not exist")):
                    skip_count += 1
                else:
                    print(f"  ✗ Sentencia {i}: {e}")
                    err_count += 1
        conn.commit()

    print(f"  ✓ {ok_count} ejecutadas · {skip_count} idempotentes · {err_count} errores")
    return err_count == 0


def main():
    args = sys.argv[1:]

    if "--list" in args or "-l" in args:
        print("📋 Migraciones disponibles:")
        for m in list_migrations():
            print(f"  · {m}")
        return 0

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ERROR: DATABASE_URL no está configurada")
        return 1

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"🔄 Conectando a {db_url.split('@')[-1].split('/')[0]}...")
    try:
        engine = create_engine(db_url)
    except Exception as e:
        print(f"❌ ERROR conectando: {e}")
        return 1

    if args:
        query = args[0]
        matches = find_migration(query)
        if not matches:
            print(f"❌ No se encontró migración para: {query}")
            return 1
        targets = matches
    else:
        targets = list_migrations()

    print(f"🚀 Aplicando {len(targets)} migración(es): {', '.join(targets)}")

    all_ok = True
    for name in targets:
        path = os.path.join(MIGRATIONS_DIR, name)
        if not execute_file(engine, path):
            all_ok = False

    print("\n" + "=" * 50)
    if all_ok:
        print("✅ Todas las migraciones aplicadas")
        return 0
    print("⚠️  Algunas migraciones tuvieron errores (revisar arriba)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
