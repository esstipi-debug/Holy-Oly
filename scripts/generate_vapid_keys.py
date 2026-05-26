"""
Genera VAPID keys para push notifications de Holy Oly + Volta.

Genera un par de claves nuevas (public + private) en formato URL-safe base64
listas para pegar en env vars de Render.

Uso:
    pip install py-vapid
    python scripts/generate_vapid_keys.py

Output:
    VAPID_PUBLIC_KEY=BNcRdr...
    VAPID_PRIVATE_KEY=k1234...
    VITE_VAPID_PUBLIC_KEY=BNcRdr...  (igual a la pública, va al frontend env)

⚠ La PRIVATE KEY es secreta · NUNCA la pongas en el código del frontend
ni en chats / git. Solo en env var del backend en Render.
"""

from __future__ import annotations

import sys


def main() -> int:
    try:
        from py_vapid import Vapid  # type: ignore
    except ImportError:
        print("ERROR: py-vapid no instalado.")
        print("Instalá con: pip install py-vapid")
        return 1

    v = Vapid()
    v.generate_keys()

    # py-vapid expone keys en formato uncompressed (65 bytes EC P-256)
    # Para Web Push hay que serializarlas a URL-safe base64 sin padding
    import base64

    pub_raw = v.public_key.public_bytes_uncompressed()  # type: ignore
    priv_raw = v.private_key.private_numbers().private_value.to_bytes(32, "big")  # type: ignore

    def b64url(b: bytes) -> str:
        return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

    pub = b64url(pub_raw)
    priv = b64url(priv_raw)

    print("=" * 60)
    print("VAPID keys generadas · pegá en Render env vars")
    print("=" * 60)
    print()
    print("BACKEND (servicio holy-oly-3 · backend):")
    print(f"VAPID_PUBLIC_KEY={pub}")
    print(f"VAPID_PRIVATE_KEY={priv}   ⚠ SECRETO")
    print(f"VAPID_SUBJECT=mailto:admin@holyoly.app  (opcional · default OK)")
    print()
    print("FRONTEND (servicio holy-oly · frontend, build-time):")
    print(f"VITE_VAPID_PUBLIC_KEY={pub}")
    print()
    print("=" * 60)
    print("NO commitees estas keys. Solo Render env vars.")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
