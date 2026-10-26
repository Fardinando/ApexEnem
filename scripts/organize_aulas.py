#!/usr/bin/env python3
"""
Organiza aulas em vídeo: transcreve com faster-whisper, classifica por área/tópico
do ENEM, detecta "ENEM 20XX - Questão N" quando é resolução de prova, e sugere
pasta + nome descritivo.

Fluxo:
  1) Lista vídeos em --folder
  2) Transcreve só os primeiros TRANSCRIBE_SECONDS (padrão 180s) de cada
  3) Classifica via dicionário de palavras-chave + heurística de "resolução de questão"
  4) Grava plan.json com {origem → destino}
  5) Com --apply, move e renomeia

Uso:
  python organize_aulas.py --folder "E:\\ApexEnem"
  python organize_aulas.py --folder "E:\\ApexEnem" --model small
  python organize_aulas.py --folder "E:\\ApexEnem" --apply --plan plan.json

Dependências:
  pip install faster-whisper
  ffmpeg no PATH (https://ffmpeg.org/download.html)

Modelos (faster-whisper): tiny / base / small / medium / large-v3
  tiny:   mais rápido, menos preciso    (~1GB RAM)
  base:   bom equilíbrio para PT        (~1-2GB RAM)
  small:  recomendado                   (~2-3GB RAM)
  medium: mais lento, melhor precisão   (~5GB RAM)
"""

from __future__ import annotations
import argparse
import io
import json
import os
import re
import shutil
import sys
import unicodedata
from pathlib import Path
from typing import Any, Optional, Tuple, List, Dict

# Força stdout/stderr UTF-8 no Windows (console cp1252 explode em "→" e acentos)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

VIDEO_EXTS = {".mp4", ".mkv", ".mov", ".avi", ".webm", ".m4v", ".ts", ".flv"}
TRANSCRIBE_SECONDS = 180  # só os primeiros 3min — rapidíssimo e já identifica

# ─── Dicionário de áreas/tópicos ──────────────────────────────────────────────
# Cada entrada: (area_curta, assunto_descritivo, [palavras-chave em minusculas
# sem acento])
TOPICS: List[Tuple[str, str, List[str]]] = [
    # Matemática
    ("Matematica", "Funcao de Primeiro Grau", ["funcao do primeiro grau", "funcao afim", "funcao linear"]),
    ("Matematica", "Funcao de Segundo Grau", ["funcao do segundo grau", "funcao quadratica", "funcao de segundo grau", "parabola", "vertice da parabola", "bhaskara", "delta positivo", "concavidade"]),
    ("Matematica", "Funcao Exponencial", ["funcao exponencial", "crescimento exponencial", "decrescimento exponencial"]),
    ("Matematica", "Logaritmo", ["logaritmo", "log na base", "propriedade do logaritmo", "logaritmando"]),
    ("Matematica", "Trigonometria", ["seno", "cosseno", "tangente", "radiano", "ciclo trigonometrico", "lei dos senos", "lei dos cossenos", "razoes trigonometricas"]),
    ("Matematica", "Conjuntos", ["conjunto", "conjuntos", "uniao de conjuntos", "interseccao", "diferenca de conjuntos", "bota e tira", "diagrama de venn", "elemento pertence", "subconjunto"]),
    ("Matematica", "Radiciacao e Potenciacao", ["raiz quadrada", "raiz cubica", "radiciacao", "potenciacao", "expoente", "aproximacao de raiz"]),
    ("Matematica", "Logica e Proposicoes", ["proposicao logica", "tabela verdade", "negacao logica", "conjuncao", "disjuncao"]),
    ("Matematica", "Geometria Plana", ["area do triangulo", "area do circulo", "poligono", "pitagoras", "teorema de pitagoras", "perimetro", "angulo interno", "quadrilatero"]),
    ("Matematica", "Geometria Espacial", ["volume do cubo", "volume do cilindro", "volume da piramide", "volume da esfera", "poliedro", "prisma reto", "tronco de cone"]),
    ("Matematica", "Geometria Analitica", ["geometria analitica", "distancia entre pontos", "equacao da reta", "coeficiente angular", "plano cartesiano", "equacao da circunferencia"]),
    ("Matematica", "Progressao Aritmetica", ["progressao aritmetica", "razao da pa", "termo geral da pa"]),
    ("Matematica", "Progressao Geometrica", ["progressao geometrica", "razao da pg", "termo geral da pg", "soma dos termos da pg"]),
    ("Matematica", "Probabilidade", ["probabilidade", "espaco amostral", "evento provavel", "eventos independentes"]),
    ("Matematica", "Analise Combinatoria", ["analise combinatoria", "permutacao", "arranjo simples", "combinacao simples", "fatorial", "principio fundamental da contagem"]),
    ("Matematica", "Estatistica", ["estatistica", "media aritmetica", "mediana", "moda estatistica", "desvio padrao", "variancia", "quartil"]),
    ("Matematica", "Matrizes e Determinantes", ["matriz", "determinante", "regra de sarrus", "matriz inversa"]),
    ("Matematica", "Matematica Financeira", ["matematica financeira", "juros simples", "juros compostos", "montante", "capital inicial", "desconto comercial"]),
    ("Matematica", "Porcentagem", ["porcentagem", "aumento percentual", "desconto percentual"]),
    ("Matematica", "Razao e Proporcao", ["razao e proporcao", "regra de tres", "grandezas proporcionais", "escala cartografica"]),
    ("Matematica", "MMC e MDC", ["minimo multiplo comum", "mmc", "maximo divisor comum", "mdc"]),
    ("Matematica", "Equacoes e Sistemas", ["equacao do primeiro grau", "equacao do segundo grau", "sistema de equacoes", "metodo da substituicao"]),
    # Física
    ("Natureza-Fisica", "Cinematica", ["cinematica", "movimento uniforme", "mru", "mruv", "velocidade media", "aceleracao"]),
    ("Natureza-Fisica", "Dinamica (Leis de Newton)", ["leis de newton", "forca resultante", "segunda lei de newton", "dinamica"]),
    ("Natureza-Fisica", "Energia e Trabalho", ["energia cinetica", "energia potencial", "trabalho da forca", "conservacao de energia"]),
    ("Natureza-Fisica", "Hidrostatica", ["hidrostatica", "pressao hidrostatica", "principio de pascal", "arquimedes", "empuxo"]),
    ("Natureza-Fisica", "Termologia e Termodinamica", ["termologia", "termodinamica", "primeira lei da termodinamica", "calor especifico", "dilatacao"]),
    ("Natureza-Fisica", "Eletricidade", ["corrente eletrica", "tensao eletrica", "resistor", "lei de ohm", "circuito eletrico", "potencia eletrica"]),
    ("Natureza-Fisica", "Ondulatoria e Som", ["onda", "frequencia", "comprimento de onda", "ressonancia", "efeito doppler"]),
    ("Natureza-Fisica", "Optica", ["optica", "lente", "espelho concavo", "espelho convexo", "refracao", "reflexao"]),
    # Química
    ("Natureza-Quimica", "Atomistica e Tabela Periodica", ["modelo atomico", "tabela periodica", "numero atomico", "configuracao eletronica", "distribuicao eletronica"]),
    ("Natureza-Quimica", "Ligacoes Quimicas", ["ligacao ionica", "ligacao covalente", "ligacao metalica"]),
    ("Natureza-Quimica", "Estequiometria", ["estequiometria", "mol", "massa molar", "reacao quimica balanceada", "balanceamento"]),
    ("Natureza-Quimica", "Solucoes", ["solucao aquosa", "concentracao em mol", "molaridade", "solubilidade", "diluicao"]),
    ("Natureza-Quimica", "Acidos Bases e pH", ["acido e base", "ph", "neutralizacao", "indicador acido"]),
    ("Natureza-Quimica", "Termoquimica", ["termoquimica", "entalpia", "reacao exotermica", "reacao endotermica"]),
    ("Natureza-Quimica", "Eletroquimica", ["eletroquimica", "pilha", "eletrolise", "oxidacao e reducao"]),
    ("Natureza-Quimica", "Quimica Organica", ["quimica organica", "hidrocarboneto", "alcano", "alceno", "alcool", "cetona", "ester", "polimero"]),
    # Biologia
    ("Natureza-Biologia", "Citologia", ["celula", "membrana plasmatica", "mitocondria", "ribossomo", "nucleo celular"]),
    ("Natureza-Biologia", "Genetica", ["genetica", "mendel", "primeira lei de mendel", "segunda lei de mendel", "heredograma", "dna", "rna", "cromossomo"]),
    ("Natureza-Biologia", "Ecologia", ["ecologia", "ecossistema", "cadeia alimentar", "bioma", "ciclo da agua", "ciclo do carbono"]),
    ("Natureza-Biologia", "Evolucao", ["evolucao", "darwin", "selecao natural", "lamarck"]),
    ("Natureza-Biologia", "Fisiologia Humana", ["sistema digestorio", "sistema nervoso", "sistema circulatorio", "sistema respiratorio", "sistema imunologico", "hormonio"]),
    ("Natureza-Biologia", "Botanica e Zoologia", ["fotossintese", "respiracao celular", "angiosperma", "vertebrado", "invertebrado"]),
    # Linguagens
    ("Linguagens-Literatura", "Literatura Brasileira", ["literatura brasileira", "romantismo", "realismo brasileiro", "modernismo brasileiro", "machado de assis", "jose de alencar", "guimaraes rosa", "clarice lispector"]),
    ("Linguagens-Literatura", "Barroco e Arcadismo", ["barroco", "arcadismo", "gregorio de matos", "tomas antonio gonzaga"]),
    ("Linguagens-Literatura", "Modernismo", ["semana de arte moderna", "modernismo", "oswald de andrade", "mario de andrade", "manuel bandeira"]),
    ("Linguagens-Gramatica", "Figuras de Linguagem", ["figura de linguagem", "metafora", "metonimia", "ironia", "antitese", "hiperbole"]),
    ("Linguagens-Gramatica", "Sintaxe e Analise de Periodo", ["oracao subordinada", "oracao coordenada", "sujeito e predicado", "analise sintatica"]),
    ("Linguagens-Gramatica", "Concordancia e Regencia", ["concordancia verbal", "concordancia nominal", "regencia verbal", "regencia nominal"]),
    ("Linguagens-Gramatica", "Semantica e Interpretacao", ["interpretacao de texto", "coerencia textual", "ambiguidade"]),
    ("Linguagens-Ingles", "Ingles", ["english", "simple past", "present perfect", "modal verbs", "passive voice", "reading comprehension"]),
    ("Linguagens-Espanhol", "Espanhol", ["espanol", "preterito indefinido", "subjuntivo", "ser y estar"]),
    # Redação
    ("Redacao", "Estrutura da Dissertacao", ["dissertacao argumentativa", "tese", "argumento de autoridade", "projeto de texto"]),
    ("Redacao", "Proposta de Intervencao", ["proposta de intervencao", "agente da proposta", "detalhamento da proposta"]),
    ("Redacao", "Repertorios Socioculturais", ["repertorio sociocultural", "repertorio produtivo", "citacao de autor"]),
    ("Redacao", "Competencias ENEM", ["competencia 1", "competencia 2", "competencia 3", "competencia 4", "competencia 5", "cinco competencias"]),
    ("Redacao", "Coesao e Conectivos", ["conectivos", "coesao textual", "operador argumentativo"]),
    # Humanas
    ("Humanas-Historia", "Historia do Brasil Colonia", ["brasil colonia", "capitanias hereditarias", "pau brasil", "sociedade acucareira", "mineracao colonial"]),
    ("Humanas-Historia", "Independencia e Imperio", ["independencia do brasil", "primeiro reinado", "segundo reinado", "guerra do paraguai"]),
    ("Humanas-Historia", "Republica Brasileira", ["proclamacao da republica", "republica velha", "era vargas", "estado novo", "ditadura militar"]),
    ("Humanas-Historia", "Idade Media e Moderna", ["idade media", "feudalismo", "cruzadas", "renascimento", "reforma protestante", "absolutismo"]),
    ("Humanas-Historia", "Revolucoes e Idade Contemporanea", ["revolucao francesa", "revolucao industrial", "primeira guerra mundial", "segunda guerra mundial", "guerra fria", "nazismo"]),
    ("Humanas-Geografia", "Geografia Fisica", ["relevo", "clima", "hidrografia", "vegetacao", "biomas do brasil"]),
    ("Humanas-Geografia", "Geopolitica", ["geopolitica", "globalizacao", "guerra fria", "blocos economicos", "oriente medio"]),
    ("Humanas-Geografia", "Demografia e Urbanizacao", ["demografia", "piramide etaria", "urbanizacao", "migracao", "transicao demografica"]),
    ("Humanas-Geografia", "Economia e Agricultura", ["agricultura familiar", "agronegocio", "industria brasileira", "setores da economia"]),
    ("Humanas-Filosofia", "Filosofia Antiga", ["socrates", "platao", "aristoteles", "pre socraticos", "mito da caverna"]),
    ("Humanas-Filosofia", "Filosofia Moderna e Contemporanea", ["descartes", "kant", "nietzsche", "sartre", "foucault", "iluminismo"]),
    ("Humanas-Sociologia", "Sociologia Classica", ["marx", "weber", "durkheim", "fato social", "mais valia", "classe social"]),
    ("Humanas-Sociologia", "Cidadania Direitos e Movimentos", ["cidadania", "direitos humanos", "movimentos sociais", "feminismo", "diversidade cultural"]),
]

QUESTAO_RE = re.compile(r"(?:quest(?:a|ã)o|q)\s*(?:n[uú]mero\s*)?(\d{1,3})", re.IGNORECASE)
ENEM_RE    = re.compile(r"enem\s*(?:de\s*)?(20\d{2}|19\d{2})", re.IGNORECASE)


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize(s: str) -> str:
    return strip_accents(s).lower()


def classify(text: str, fname: str) -> Tuple[str, str, int]:
    """Devolve (area, assunto, score). Score alto = mais confiança.
    Casa cada keyword como palavra inteira (word-boundary) pra evitar que
    substrings genéricas (ex.: 'cone' dentro de 'conectivos') contem."""
    hay = normalize(text + " \n " + fname)
    best_score = 0
    best = ("Outros", "Nao classificado")
    for area, assunto, keywords in TOPICS:
        score = 0
        for kw in keywords:
            kw_n = normalize(kw)
            tokens = kw_n.split()
            if len(tokens) >= 2:
                # frase: substring é suficiente (frases longas raramente dão falso-positivo)
                if kw_n in hay:
                    score += len(tokens) * 2  # bônus pra frases
            else:
                # palavra única: exige word-boundary
                if re.search(rf"\b{re.escape(kw_n)}\b", hay):
                    score += 1
        if score > best_score:
            best_score = score
            best = (area, assunto)
    return best[0], best[1], best_score


def detect_enem_questao(text: str, fname: str) -> Tuple[Optional[str], Optional[str]]:
    """Procura ano do ENEM e número da questão no texto + no nome do arquivo."""
    corpus = text + "\n" + fname
    ano_match = ENEM_RE.search(corpus)
    q_match = QUESTAO_RE.search(corpus)
    ano = ano_match.group(1) if ano_match else None
    q = q_match.group(1) if q_match else None
    return ano, q


def is_resolucao(text: str, fname: str) -> bool:
    hay = normalize(text + " " + fname)
    return any(k in hay for k in ["resolucao", "resolvendo questao", "resolver a questao", "gabarito", "comentario da prova"])


def transcribe(video: Path, model) -> str:
    """Transcreve os primeiros TRANSCRIBE_SECONDS. faster-whisper lê MP4/MKV
    direto via ffmpeg se o binário estiver no PATH."""
    try:
        segments, info = model.transcribe(
            str(video),
            language="pt",
            vad_filter=True,
            without_timestamps=True,
            beam_size=1,
            temperature=0.0,
            condition_on_previous_text=False,
            # trabalha apenas no clipe inicial
            clip_timestamps=f"0,{TRANSCRIBE_SECONDS}",
        )
        parts = [s.text for s in segments]
        return " ".join(parts).strip()
    except Exception as e:
        print(f"  !! erro transcrevendo {video.name}: {e}", file=sys.stderr)
        return ""


def safe_component(s: str) -> str:
    s = re.sub(r"[\\/:*?\"<>|]", "", s).strip()
    s = re.sub(r"\s+", " ", s)
    return s[:120] or "Aula"


def propor_destino(video: Path, area: str, assunto: str, ano: Optional[str], q: Optional[str], resolucao: bool) -> Tuple[str, str]:
    if resolucao and ano and q:
        novo_nome = f"Resolução de Questão ENEM {ano} - Questão {int(q)} - {assunto}{video.suffix.lower()}"
    elif resolucao and ano:
        novo_nome = f"Resolução ENEM {ano} - {assunto}{video.suffix.lower()}"
    else:
        novo_nome = f"Aula - {assunto}{video.suffix.lower()}"
    pasta = area if area != "Outros" else "Outros"
    return pasta, safe_component(novo_nome)


def main() -> int:
    ap = argparse.ArgumentParser(description="Organiza aulas ENEM por transcrição.")
    ap.add_argument("--folder", required=True, help="Pasta com os vídeos")
    ap.add_argument("--model", default="small", choices=["tiny", "base", "small", "medium", "large-v3"], help="Modelo faster-whisper")
    ap.add_argument("--plan", default="plan.json", help="Arquivo de plano gerado/consumido")
    ap.add_argument("--apply", action="store_true", help="Executa o plano (move/renomeia). Sem isso é dry-run.")
    ap.add_argument("--copy", action="store_true", help="Com --apply, copia em vez de mover (preserva originais).")
    ap.add_argument("--max-files", type=int, default=0, help="Limite de arquivos (0 = todos). Útil pra testar.")
    ap.add_argument("--recursive", action="store_true", default=True, help="Varre subpastas (padrão: ligado).")
    ap.add_argument("--no-recursive", dest="recursive", action="store_false", help="Só a raiz, não desce em subpastas.")
    ap.add_argument("--skip-transcribe", action="store_true", help="Pula transcrição e classifica só pelo nome do arquivo + pasta pai (rápido, menos preciso).")
    ap.add_argument("--reclassify", action="store_true", help="Lê plan.json existente, re-classifica usando o dicionário atual (sem transcrever de novo) e sobrescreve.")
    args = ap.parse_args()

    folder = Path(args.folder)
    if not folder.exists():
        print(f"Pasta não encontrada: {folder}", file=sys.stderr)
        return 1

    plan_path = folder / args.plan

    # Modo reclassify: lê plan existente e refaz só a classificação
    if args.reclassify:
        if not plan_path.exists():
            print(f"Plano não encontrado em {plan_path}.", file=sys.stderr)
            return 2
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        for it in plan["items"]:
            text = it.get("transcricao") or it.get("preview_transcricao", "")
            v = Path(it["origem"])
            try:
                fname_ctx = f"{v.name} {' '.join(v.relative_to(folder).parts[:-1])}"
            except ValueError:
                fname_ctx = v.name
            area, assunto, score = classify(text, fname_ctx)
            ano, q = detect_enem_questao(text, fname_ctx)
            resolucao = is_resolucao(text, fname_ctx) or bool(ano and q) or "quest" in normalize(fname_ctx)
            pasta, novo = propor_destino(v, area, assunto, ano, q, resolucao)
            it.update({
                "area": area, "assunto": assunto,
                "enem_ano": ano, "enem_questao": q,
                "resolucao": resolucao, "confianca": score,
                "destino_pasta": pasta, "destino_nome": novo,
            })
        plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
        counts: Dict[str, int] = {}
        for it in plan["items"]:
            counts[it["destino_pasta"]] = counts.get(it["destino_pasta"], 0) + 1
        print("Reclassificado. Distribuição por pasta:")
        for k, v in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"  {k}: {v}")
        return 0

    # Modo apply: carrega plano existente
    if args.apply:
        if not plan_path.exists():
            print(f"Plano não encontrado em {plan_path}. Rode primeiro sem --apply.", file=sys.stderr)
            return 2
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        print(f"\n== Aplicando plano com {len(plan['items'])} itens ==")
        done = 0
        for it in plan["items"]:
            src = Path(it["origem"])
            dst_dir = folder / it["destino_pasta"]
            dst_dir.mkdir(parents=True, exist_ok=True)
            base_name = it["destino_nome"]
            dst = dst_dir / base_name
            # Resolve colisão adicionando sufixo numérico
            if dst.exists() and dst.resolve() != src.resolve():
                stem = Path(base_name).stem
                ext = Path(base_name).suffix
                k = 2
                while (dst_dir / f"{stem} ({k}){ext}").exists():
                    k += 1
                dst = dst_dir / f"{stem} ({k}){ext}"
            if not src.exists():
                print(f"  SKIP (arquivo sumiu): {src.name}")
                continue
            if dst.resolve() == src.resolve():
                print(f"  SKIP (ja no destino): {src.name}")
                continue
            if args.copy:
                shutil.copy2(src, dst)
            else:
                shutil.move(str(src), str(dst))
            done += 1
            print(f"  OK: {src.name}\n     → {dst.relative_to(folder)}")
        print(f"\n== {done}/{len(plan['items'])} processados ==")
        return 0

    # Modo dry-run: carrega modelo e analisa
    model = None
    if not args.skip_transcribe:
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            print("ERRO: faster-whisper não instalado. Rode:  pip install faster-whisper", file=sys.stderr)
            print("Ou passe --skip-transcribe pra classificar só pelo nome do arquivo.", file=sys.stderr)
            return 3
        print(f"Carregando modelo faster-whisper '{args.model}' (CPU)…")
        model = WhisperModel(args.model, device="cpu", compute_type="int8")

    def iter_videos(base: Path):
        for p in sorted(base.rglob("*") if args.recursive else base.iterdir()):
            if p.is_file() and p.suffix.lower() in VIDEO_EXTS:
                # Não mexer em arquivos que já estão sob uma pasta de destino nossa
                # (ex.: usuário rodou --apply antes e quer refazer)
                yield p

    videos = list(iter_videos(folder))
    if args.max_files:
        videos = videos[: args.max_files]
    if not videos:
        print(f"Nenhum vídeo encontrado em {folder}")
        return 0
    print(f"Vídeos encontrados: {len(videos)}\n")

    items: List[Dict[str, Any]] = []
    for i, v in enumerate(videos, 1):
        rel = v.relative_to(folder)
        print(f"[{i}/{len(videos)}] {rel}")
        # Combina nome do arquivo com nome da(s) pasta(s) pai pra dar contexto
        fname_ctx = f"{v.name} {' '.join(part for part in v.relative_to(folder).parts[:-1])}"
        text = ""
        if model is not None:
            text = transcribe(v, model)
            preview = re.sub(r"\s+", " ", text)[:160]
            print(f"  Prévia: {preview}{'…' if len(text) > 160 else ''}")
        area, assunto, score = classify(text, fname_ctx)
        ano, q = detect_enem_questao(text, fname_ctx)
        resolucao = is_resolucao(text, fname_ctx) or bool(ano and q) or "quest" in normalize(fname_ctx)
        pasta, novo = propor_destino(v, area, assunto, ano, q, resolucao)
        print(f"  → {pasta}/{novo}  (confiança={score}{', resolução' if resolucao else ''})\n")
        items.append({
            "origem": str(v),
            "origem_rel": str(rel),
            "transcricao": re.sub(r"\s+", " ", text),
            "preview_transcricao": re.sub(r"\s+", " ", text)[:160],
            "area": area,
            "assunto": assunto,
            "enem_ano": ano,
            "enem_questao": q,
            "resolucao": resolucao,
            "confianca": score,
            "destino_pasta": pasta,
            "destino_nome": novo,
        })

    plan = {"folder": str(folder), "model": args.model, "items": items}
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nPlano salvo em: {plan_path}")
    print("Revise o plan.json e, depois, rode:")
    print(f"  python {Path(sys.argv[0]).name} --folder \"{folder}\" --apply")
    return 0


if __name__ == "__main__":
    sys.exit(main())
