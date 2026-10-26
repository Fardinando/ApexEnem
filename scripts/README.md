# scripts/organize_aulas.py

Script local para transcrever e organizar aulas em vídeo nas pastas corretas
por área/tópico ENEM, com nome descritivo.

## 1. Instalar dependências (uma vez)

```powershell
# Python 3.10+ já instalado?  python --version
pip install faster-whisper
```

E instale o **ffmpeg** no PATH (faster-whisper precisa pra ler MP4/MKV):

- Baixe em https://www.gyan.dev/ffmpeg/builds/ (versão “release essentials”).
- Extraia em `C:\ffmpeg\` e adicione `C:\ffmpeg\bin` ao PATH.
- Teste: `ffmpeg -version` em novo PowerShell.

## 2. Gerar o plano (dry-run)

Transcreve os **primeiros 3 minutos** de cada vídeo e grava `plan.json`
na pasta — nada é movido ainda.

```powershell
cd C:\ApexEnem-work\ApexEnem\scripts
python organize_aulas.py --folder "E:\ApexEnem"
```

Flags úteis:

- `--model base` → mais rápido, menos preciso. Default é `small`.
- `--model medium` → precisão melhor em áudio ruim (mais lento).
- `--max-files 5` → testa só 5 arquivos antes de rodar o lote todo.

Cada entrada do `plan.json` tem:

```json
{
  "origem": "E:\\ApexEnem\\aula_01.mp4",
  "preview_transcricao": "Nessa questão do ENEM 2018 vamos analisar a função...",
  "area": "Matematica",
  "assunto": "Funcao de Segundo Grau",
  "enem_ano": "2018",
  "enem_questao": "25",
  "resolucao": true,
  "confianca": 7,
  "destino_pasta": "Matematica",
  "destino_nome": "Resolução de Questão ENEM 2018 - Questão 25 - Funcao de Segundo Grau.mp4"
}
```

## 3. Revisar e corrigir

Abra `E:\ApexEnem\plan.json` e **edite à mão** o que estiver errado:

- `destino_pasta` → se o script classificou mal, troque (ex.: `Natureza-Fisica`).
- `destino_nome` → ajuste pra algo mais claro se quiser.
- `confianca: 0` significa que o script não reconheceu nenhuma palavra-chave;
  é o caso mais provável de precisar edição manual.

## 4. Aplicar

```powershell
python organize_aulas.py --folder "E:\ApexEnem" --apply
```

Isso **move** os arquivos pra `E:\ApexEnem\<area>\<novo_nome>`.

Se quiser **copiar** em vez de mover (preserva originais pra segurança):

```powershell
python organize_aulas.py --folder "E:\ApexEnem" --apply --copy
```

## Modelos faster-whisper

| modelo    | RAM aprox | tempo relativo | qualidade PT-BR |
| --------- | --------- | -------------- | --------------- |
| tiny      | ~1 GB     | 1×             | ruim            |
| base      | ~1-2 GB   | 2×             | aceitável       |
| **small** | ~2-3 GB   | 4×             | bom (padrão)    |
| medium    | ~5 GB     | 8×             | ótimo           |
| large-v3  | ~10 GB    | 16×            | melhor possível |

Para aulas gravadas com áudio limpo (não barulhento), `small` já é suficiente.
Se o script errar muito, suba pra `medium`.

## Dicionário de tópicos

Edite o array `TOPICS` no topo de `organize_aulas.py` pra adicionar mais
palavras-chave ou tópicos. Formato:

```python
("Nome-da-pasta", "Nome descritivo do assunto", ["palavra chave 1", "palavra chave 2"])
```

As palavras-chave são comparadas em minúsculas e **sem acento** contra o texto
transcrito + o nome original do arquivo.
