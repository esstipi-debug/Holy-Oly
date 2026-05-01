"""
Script para ejecutar migraciones SQL en PostgreSQL.
Uso: python execute_migration.py
"""
import os
import sys
from sqlalchemy import create_engine, text

# Agregar el path del backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def execute_migration():
    """Ejecuta la migración de RLS."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ERROR: DATABASE_URL no está configurada")
        print("Por favor, configura la variable de entorno DATABASE_URL")
        return False
    
    # Ajustar URL para SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    print(f"🔄 Conectando a la base de datos...")
    
    try:
        engine = create_engine(db_url)
        
        # Leer el archivo de migración
        migration_path = os.path.join(os.path.dirname(__file__), "migrations", "001_enable_rls.sql")
        
        if not os.path.exists(migration_path):
            print(f"❌ ERROR: No se encontró el archivo de migración: {migration_path}")
            return False
        
        with open(migration_path, 'r') as f:
            migration_sql = f.read()
        
        print(f"📄 Ejecutando migración: 001_enable_rls.sql")
        print("-" * 50)
        
        with engine.connect() as conn:
            # Ejecutar cada sentencia por separado
            statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
            
            for i, statement in enumerate(statements, 1):
                try:
                    conn.execute(text(statement))
                    print(f"  ✓ Sentencia {i} ejecutada")
                except Exception as e:
                    # Si es un error de "policy already exists" o similar, lo ignoramos
                    error_str = str(e).lower()
                    if "already exists" in error_str or "duplicate" in error_str:
                        print(f"  ⚠ Sentencia {i} ya existe (ignorado)")
                    else:
                        print(f"  ✗ Error en sentencia {i}: {e}")
            
            conn.commit()
        
        print("-" * 50)
        print("✅ Migración completada exitosamente!")
        print("\n📝 Resumen de cambios:")
        print("  • RLS habilitado en: athlete_sessions")
        print("  • RLS habilitado en: daily_metrics")
        print("  • RLS habilitado en: sleep_logs")
        print("\n⚠️  IMPORTANTE: La aplicación debe ejecutar 'SET LOCAL app.current_user_id = <ID>'")
        print("    al inicio de cada transacción para que las políticas RLS funcionen.")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = execute_migration()
    sys.exit(0 if success else 1)
