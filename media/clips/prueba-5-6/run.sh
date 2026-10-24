#!/bin/bash
# Prueba de modelos en la transición más difícil: camino a la playa (5) → vista aérea (6).
cd "$(dirname "$0")"
K=../../keyframes/07-final
P="$(cat prompt.txt)"
gen() { name=$1; model=$2; shift 2
  higgsfield generate create $model --prompt "$P" --start-image $K/5-camino-playa.jpg --end-image $K/6-aereo.jpg \
    --aspect_ratio 16:9 --duration 8 "$@" --wait --wait-timeout 40m --json > $name.json 2> $name.err
  url=$(jq -r '.[0].result_url // empty' $name.json 2>/dev/null)
  if [ -n "$url" ]; then curl -fsSL "$url" -o $name.mp4 && echo "$name ok $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -of csv=p=0 $name.mp4)"
  else echo "$name FAIL $(tail -1 $name.err) $(jq -r '.[0].status // empty' $name.json 2>/dev/null)"; fi
}
gen kling4 kling4_0 --mode image-to-video --resolution 1080p &
gen minimax-h3 minimax_h3 --resolution 2K &
gen kling3-pro kling3_0 --mode pro --sound off &
gen seedance25-draft seedance_2_5 --mode omni_reference --resolution 480p --draft true --generate_audio false &
wait
higgsfield workspace list | tail -1
