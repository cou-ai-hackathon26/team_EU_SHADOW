#!/usr/bin/env python3
"""
Generate offline Bangla voice clips using edge-tts.
Voice: bn-BD-NabanitaNeural
Reads: web/src/features/voice/voice-manifest.json
Writes: web/public/audio/<file> and web/src/features/voice/voice-generated.json
"""

import asyncio
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

VOICE = "bn-BD-NabanitaNeural"

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / "web" / "src" / "features" / "voice" / "voice-manifest.json"
GENERATED_PATH = REPO_ROOT / "web" / "src" / "features" / "voice" / "voice-generated.json"
AUDIO_DIR = REPO_ROOT / "web" / "public" / "audio"


async def generate_clip(communicate_cls, text: str, dest_path: Path, max_retries: int = 3):
    temp_path = dest_path.with_suffix(".tmp.mp3")
    for attempt in range(1, max_retries + 1):
        try:
            communicate = communicate_cls(text, voice=VOICE)
            await communicate.save(str(temp_path))

            ffmpeg = shutil.which("ffmpeg")
            if not ffmpeg:
                # Check common local installations if not on system PATH
                for p in [
                    Path(r"C:\Users\DREAMER\.vscode\extensions\kilocode.kilo-code-7.8.32-win32-x64\bin\ffmpeg.exe"),
                    Path(r"C:\Users\DREAMER\.vscode\extensions\.f8f48ce1-7578-42b3-a3b5-62eacb114ae8\bin\ffmpeg.exe"),
                ]:
                    if p.exists():
                        ffmpeg = str(p)
                        break

            if ffmpeg:
                # Re-encode to mono 24 kHz 32 kbps to save storage space
                cmd = [
                    ffmpeg,
                    "-y",
                    "-i",
                    str(temp_path),
                    "-ac",
                    "1",
                    "-ar",
                    "24000",
                    "-b:a",
                    "32k",
                    str(dest_path),
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                temp_path.unlink(missing_ok=True)
            else:
                temp_path.replace(dest_path)
            return
        except Exception as e:
            temp_path.unlink(missing_ok=True)
            if attempt == max_retries:
                raise RuntimeError(f"Failed to generate clip after {max_retries} attempts: {e}")
            await asyncio.sleep(1.0 * attempt)


async def main():
    try:
        import edge_tts
    except ImportError:
        print("ERROR: edge-tts is not installed. Please run: pip install edge-tts", file=sys.stderr)
        sys.exit(1)

    if not MANIFEST_PATH.exists():
        print(f"ERROR: Manifest not found at {MANIFEST_PATH}", file=sys.stderr)
        sys.exit(1)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    generated_map = {}
    total_bytes = 0

    print(f"Generating {len(manifest)} voice clips using voice '{VOICE}'...")

    for entry in manifest:
        key = entry["key"]
        file_name = entry["file"]
        text = entry["text"]

        dest = AUDIO_DIR / file_name
        print(f"  Generating {file_name} ({key})...", end="", flush=True)

        await generate_clip(edge_tts.Communicate, text, dest)
        size = dest.stat().st_size
        total_bytes += size
        print(f" done ({size / 1024:.1f} KB)")

        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        generated_map[file_name] = text_hash

    with open(GENERATED_PATH, "w", encoding="utf-8") as f:
        json.dump(generated_map, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("\nSummary:")
    print(f"  Total clips: {len(manifest)}")
    print(f"  Total audio size: {total_bytes / 1024:.1f} KB ({total_bytes / (1024 * 1024):.2f} MB)")
    print(f"  Wrote sha256 registry to: {GENERATED_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
