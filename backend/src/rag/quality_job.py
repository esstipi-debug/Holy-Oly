# rag/quality_job.py
# Peak Qual — Job nocturno de calidad del RAG
#
# Corre cada noche a las 3am vía Cloud Scheduler.
# Procesa feedback negativo acumulado y flaggea chunks problemáticos.
#
# Uso:
#   python -m rag.quality_job
#   python -m rag.quality_job --dry-run

import argparse
import sys
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from sqlalchemy import text
from infrastructure.vector_store import VectorStore

LOW_SCORE_THRESHOLD = 3    # feedbacks negativos para flaggear un chunk
QUALITY_DECAY       = 0.15  # cuánto baja quality_score por feedback negativo


def run(dry_run: bool = False, verbose: bool = True):
    vs      = VectorStore()
    session = vs.Session()

    if verbose:
        print(f"\n{'='*50}")
        print(f"  Quality Job — Peak Qual RAG")
        print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
        print(f"  Modo: {'DRY RUN' if dry_run else 'EJECUTANDO'}")
        print(f"{'='*50}\n")

    try:
        # 1. Obtener feedback negativo no procesado
        feedbacks = session.execute(text("""
            SELECT chunk_id, COUNT(*) as count
            FROM rag_feedback
            WHERE feedback_type IN ('wrong', 'incomplete', 'outdated')
              AND processed = FALSE
              AND chunk_id IS NOT NULL
            GROUP BY chunk_id
        """)).fetchall()

        if not feedbacks:
            if verbose:
                print("  Sin feedback negativo nuevo. Todo limpio.\n")
            return

        if verbose:
            print(f"  Chunks con feedback negativo: {len(feedbacks)}\n")

        flagged_count  = 0
        updated_count  = 0

        for row in feedbacks:
            chunk_id   = row.chunk_id
            new_count  = row.count

            # Obtener estado actual del chunk
            chunk = session.execute(text("""
                SELECT id, source, low_score_count, quality_score, flagged
                FROM knowledge_base WHERE id = :id
            """), {"id": chunk_id}).fetchone()

            if not chunk:
                if verbose:
                    print(f"  [WARN] Chunk no encontrado: {chunk_id}")
                continue

            total_low  = (chunk.low_score_count or 0) + new_count
            new_quality = max(0.0, float(chunk.quality_score or 1.0) - QUALITY_DECAY * new_count)
            should_flag = total_low >= LOW_SCORE_THRESHOLD

            if verbose:
                status = "→ FLAG" if should_flag else "→ degradar"
                print(f"  [{status}] {chunk.source} | low_count: {total_low} | quality: {new_quality:.2f}")

            if not dry_run:
                session.execute(text("""
                    UPDATE knowledge_base
                    SET low_score_count = :lsc,
                        quality_score   = :qs,
                        flagged         = :fl,
                        updated_at      = NOW()
                    WHERE id = :id
                """), {
                    "lsc": total_low,
                    "qs":  str(round(new_quality, 3)),
                    "fl":  "true" if should_flag else chunk.flagged,
                    "id":  chunk_id,
                })

            if should_flag:
                flagged_count += 1
            updated_count += 1

        # 2. Marcar feedback como procesado
        if not dry_run:
            session.execute(text("""
                UPDATE rag_feedback
                SET processed = TRUE
                WHERE feedback_type IN ('wrong', 'incomplete', 'outdated')
                  AND processed = FALSE
                  AND chunk_id IS NOT NULL
            """))
            session.commit()

        if verbose:
            print(f"\n{'─'*50}")
            print(f"  Chunks actualizados: {updated_count}")
            print(f"  Chunks flaggeados:   {flagged_count}")
            print(f"{'─'*50}\n")

        return {"updated": updated_count, "flagged": flagged_count}

    except Exception as e:
        print(f"ERROR en quality_job: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quality Job — Peak Qual RAG")
    parser.add_argument("--dry-run", action="store_true", help="Sin ejecutar cambios en DB")
    parser.add_argument("--quiet",   action="store_true", help="Sin output")
    args = parser.parse_args()

    run(dry_run=args.dry_run, verbose=not args.quiet)
