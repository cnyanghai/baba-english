"""转录视频英文字幕，输出 JSON 段落数据。"""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

from faster_whisper import WhisperModel

VIDEO = sys.argv[1] if len(sys.argv) > 1 else "/mnt/d/BaiduNetdiskDownload/S01E01.mp4"
OUT = sys.argv[2] if len(sys.argv) > 2 else "data/friends_s01e01.transcribe.json"
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base.en")

print(f"[transcribe] video={VIDEO}", flush=True)
print(f"[transcribe] model={MODEL_SIZE} (auto-downloads from {os.environ['HF_ENDPOINT']})", flush=True)

model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

print("[transcribe] running…", flush=True)
segments_iter, info = model.transcribe(
    VIDEO,
    beam_size=5,
    vad_filter=True,
    vad_parameters=dict(min_silence_duration_ms=500),
    word_timestamps=False,
)

print(f"[transcribe] detected language={info.language}, duration={info.duration:.1f}s", flush=True)

segments = []
for i, seg in enumerate(segments_iter):
    text = seg.text.strip()
    if not text:
        continue
    segments.append({
        "index": len(segments),
        "start_ms": int(seg.start * 1000),
        "end_ms": int(seg.end * 1000),
        "en_text": text,
    })
    if (len(segments)) % 25 == 0:
        print(f"  …{len(segments)} segments, t={seg.end:.1f}s", flush=True)

Path(OUT).parent.mkdir(parents=True, exist_ok=True)
Path(OUT).write_text(json.dumps(segments, indent=2, ensure_ascii=False))
print(f"[transcribe] wrote {len(segments)} segments → {OUT}", flush=True)
