# Offline voice pack (optional)

If all clips exist for a language, ZenBreath uses them **without** any API key (see `VITE_VOICE_PRIORITY`, default tries `static` first).

## Layout

Place files under:

```text
public/voice/en/inhale.mp3
public/voice/en/hold.mp3
public/voice/en/exhale.mp3
public/voice/cs/inhale.mp3
… (same keys for cs)
```

Supported extensions (tried in order): **`.mp3`**, **`.webm`**, **`.ogg`**.

Scripts should match the in-app copy (see `src/voice/types.ts`, `phaseTexts`).
