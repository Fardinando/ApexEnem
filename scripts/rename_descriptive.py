#!/usr/bin/env python3
"""Segunda passada: usa plan.json pra renomear os arquivos já movidos com
nomes mais descritivos, extraindo "Questão NN" / ano ENEM da origem_rel ou
transcrição."""

from __future__ import annotations
import io, json, re, sys, unicodedata
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

QUESTAO_RE_FNAME = re.compile(r"quest(?:ao|oes|ão|ões)?\s*(\d{1,3})", re.IGNORECASE)
Q_RE_FNAME       = re.compile(r"^q\s*(\d{1,3})\b|/q\s*(\d{1,3})\b|\\q\s*(\d{1,3})\b", re.IGNORECASE)
ENEM_RE          = re.compile(r"enem\s*(?:de\s*)?(20\d{2}|19\d{2})", re.IGNORECASE)

def strip_accents(s): return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def extract_num(origem_rel: str, transcricao: str):
    """Retorna o 'melhor' número de questão a usar. Prioriza origem_rel (nome do
    arquivo/pasta pai), depois a transcrição."""
    source = origem_rel.replace("\\", "/")
    # pasta pai tipo "Questão 136 - Prova Amarela"
    m = QUESTAO_RE_FNAME.search(source)
    if m: return int(m.group(1))
    # pasta "Q01" / "Q12"
    m = Q_RE_FNAME.search(source)
    if m:
        for g in m.groups():
            if g: return int(g)
    # transcrição: "Questão 136" / "Questao 3"
    m = QUESTAO_RE_FNAME.search(transcricao or "")
    if m: return int(m.group(1))
    return None

def is_prova_amarela(origem_rel: str, transcricao: str) -> bool:
    s = (origem_rel + " " + (transcricao or "")).lower()
    return "prova amarela" in s or "amarela" in origem_rel.lower()

def safe(s): return re.sub(r"[\\/:*?\"<>|]", "", s).strip()

def main():
    if len(sys.argv) < 2:
        print("uso: python rename_descriptive.py <folder>")
        return 1
    folder = Path(sys.argv[1])
    plan = json.loads((folder / "plan.json").read_text(encoding="utf-8"))

    # Mapear origem → onde o arquivo foi parar: ler o apply fez destino_pasta/destino_nome.
    # Como o apply resolve colisão com (2), (3), (4), temos que detectar: pros
    # itens cujo destino "base" já estava ocupado por anterior, foi renomeado.
    # Então reconstituímos a mesma ordem que o apply usou.
    taken = {}  # (dst_dir, base_stem) -> contador
    renames = []  # (atual_path, novo_path)

    for it in plan["items"]:
        area = it["destino_pasta"]
        base_nome = it["destino_nome"]
        stem = Path(base_nome).stem
        ext = Path(base_nome).suffix
        key = (area, stem)
        used = taken.get(key, 0)
        if used == 0:
            atual_rel = f"{area}/{stem}{ext}"
        else:
            atual_rel = f"{area}/{stem} ({used + 1}){ext}"
        taken[key] = used + 1
        atual_path = folder / atual_rel.replace("/", "\\")
        if not atual_path.exists():
            continue  # pulou no apply

        # Monta nome descritivo
        num = extract_num(it["origem_rel"], it.get("transcricao", ""))
        assunto = it.get("assunto", "Nao classificado")
        prova_amarela = is_prova_amarela(it["origem_rel"], it.get("transcricao", ""))
        if num and prova_amarela:
            novo = f"Questão {num:03d} - Prova Amarela - {assunto}{ext}"
        elif num:
            novo = f"Questão {num:03d} - {assunto}{ext}"
        else:
            # mantém o nome do arquivo original (sem extensão) pra preservar contexto
            orig_stem = Path(it["origem_rel"]).stem
            novo = f"{orig_stem} - {assunto}{ext}"
        novo = safe(novo)[:160] + ext if not safe(novo).lower().endswith(ext.lower()) else safe(novo)[:200]
        novo_path = atual_path.parent / novo
        # Resolve colisão
        if novo_path.exists() and novo_path.resolve() != atual_path.resolve():
            k = 2
            while True:
                candidato = atual_path.parent / f"{Path(novo).stem} ({k}){ext}"
                if not candidato.exists():
                    novo_path = candidato
                    break
                k += 1
        if novo_path != atual_path:
            renames.append((atual_path, novo_path))

    print(f"Vou renomear {len(renames)} arquivos. Prévia dos 10 primeiros:")
    for a, b in renames[:10]:
        print(f"  {a.relative_to(folder)}")
        print(f"    → {b.relative_to(folder)}")
    if "--apply" not in sys.argv:
        print("\n(dry-run) rode de novo com --apply pra confirmar")
        return 0
    done = 0
    for a, b in renames:
        if not a.exists():
            continue
        # Resolve colisão agora (depois dos renames anteriores)
        if b.exists() and b.resolve() != a.resolve():
            stem, ext = b.stem, b.suffix
            k = 2
            while True:
                candidato = b.parent / f"{stem} ({k}){ext}"
                if not candidato.exists():
                    b = candidato
                    break
                k += 1
        try:
            a.rename(b)
            done += 1
        except Exception as e:
            print(f"erro {a}: {e}")
    print(f"\n{done}/{len(renames)} renomeados")
    return 0

if __name__ == "__main__":
    sys.exit(main())
