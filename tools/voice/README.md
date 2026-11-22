# AgroLeaf AI — Bangla Voice Fallback Generator

Generates high-quality pre-rendered Bangla MP3 clips for devices without a built-in Bangla text-to-speech voice (Windows Chrome, iOS Safari / iPhone, etc.).

## Prerequisites
- Python 3.10+
- `pip install edge-tts`
- (Optional) `ffmpeg` on PATH to optimize MP3 size to mono 24 kHz 32 kbps.

## Commands to Regenerate

From repository root:

```bash
# 1. Update voice manifest from code
cd web && UPDATE_VOICE_MANIFEST=1 npx vitest run src/features/voice/voiceClips.test.ts && cd ..

# 2. Install edge-tts and synthesize the 15 MP3 clips
python -m pip install edge-tts
python tools/voice/gen_voice_clips.py
```

On Windows PowerShell:
```powershell
cd web; $env:UPDATE_VOICE_MANIFEST='1'; npx vitest run src/features/voice/voiceClips.test.ts; Remove-Item Env:UPDATE_VOICE_MANIFEST; cd ..
python -m pip install edge-tts
python tools/voice/gen_voice_clips.py
```
