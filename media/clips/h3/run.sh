#!/bin/bash
# Genera los clips del recorrido con MiniMax H3 (2K, 8 s, 16:9).
# clip-k va de la parada k-1 a la parada k: primer frame = keyframe k-1, último frame = keyframe k.
# MiniMax H3 no tiene opción para desactivar el audio: el original se guarda en raw/ y
# el master sin audio (video copiado sin recodificar) en master/.
# Uso: bash run.sh 1 2 3 4 5   (o solo los clips que haya que repetir)
cd "$(dirname "$0")"
K=../../keyframes/07-final
FOTOS=(0-piscina-casa 1-kiosko-hamacas 2-sala 3-corredor 4-piscina-mar 5-camino-playa 6-aereo)

gen() { k=$1
  inicio=${FOTOS[$((k-1))]}; fin=${FOTOS[$k]}
  higgsfield generate create minimax_h3 --prompt "$(cat prompts/clip-$k.txt)" \
    --start-image $K/$inicio.jpg --end-image $K/$fin.jpg \
    --aspect_ratio 16:9 --resolution 2K --duration 8 \
    --wait --wait-timeout 40m --json > raw/clip-$k.json 2> raw/clip-$k.err
  url=$(jq -r '.[0].result_url // empty' raw/clip-$k.json 2>/dev/null)
  if [ -n "$url" ] && curl -fsSL "$url" -o raw/clip-$k.mp4; then
    ffmpeg -v error -y -i raw/clip-$k.mp4 -c:v copy -an master/clip-$k.mp4
    echo "clip-$k ok $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=p=0 master/clip-$k.mp4) audio=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 master/clip-$k.mp4)"
  else
    echo "clip-$k FAIL $(tail -1 raw/clip-$k.err) $(jq -r '.[0].status // empty' raw/clip-$k.json 2>/dev/null)"
  fi
}

for k in "$@"; do gen $k & done
wait
higgsfield workspace list | tail -1
