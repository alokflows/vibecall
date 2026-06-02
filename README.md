# Vibe Call 📱✨

Point your camera at a phone number — Vibe Call reads it instantly and opens
your dialer, WhatsApp or SMS. No typing, no saving contacts. **100% offline.**

### How it works 🪄
1. **Point** the camera at any phone number (on paper, a screen, a poster…).
2. Vibe Call draws a smooth box around **every** number it sees and shows the
   country it belongs to.
3. **One number in view?** It blasts straight into your default action (e.g.
   opens the WhatsApp chat) so you just hit send/call.
4. **A whole list of numbers?** Tap the one you want and pick: 📞 Call ·
   💬 WhatsApp · 💬 SMS · 🔖 Save.

### Make it yours ⚙️
Tap the gear at the top right to open the control panel:
- **Settings** — choose the default action, turn instant auto-open on/off, and
  pick which buttons appear in the tap menu.
- **History** — every number you acted on; tap to repeat.
- **Saved** — your own offline contact list (separate from your phone contacts).

### Privacy 🔒
Everything happens on your device. Text recognition runs locally and nothing is
ever sent over the internet.

### Install on Android 📱
1. **[Download VibeCall-v1.0.apk](https://github.com/alokflows/vibecall/releases/latest/download/VibeCall-v1.0.apk)**
   to your phone.
2. Tap the file to install (you may need to allow "Install unknown apps").
3. Open it, grant camera permission, and start scanning! 🎉

---

### For developers
React + Vite + Capacitor (Android). On-device OCR via Google ML Kit.

```bash
npm install
npm run dev      # web dev server
npm run build    # type-check + production build
npm run lint
npx cap sync android   # requires Node >= 22
```

The APK is built automatically by the **Update Release APK** GitHub Action on
every push to `master`.
