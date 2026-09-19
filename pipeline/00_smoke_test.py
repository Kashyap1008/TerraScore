"""
pipeline/00_smoke_test.py
--------------------------
Verifies the PostGIS connection is alive and the extension is loaded.
Exits 0 on success, 1 on any failure.
"""
import sys

from pipeline.utils import get_engine


def main() -> int:
    try:
        engine = get_engine()
        with engine.connect() as conn:
            from sqlalchemy import text
            row = conn.execute(text("SELECT PostGIS_Version();")).scalar()
        print(f"PostGIS version: {row}")
        return 0
    except Exception as exc:
        print(f"ERROR: Could not connect to PostGIS -- {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
