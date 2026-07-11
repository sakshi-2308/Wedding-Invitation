# 💍 Luxury Wedding Invitation Website

A cinematic, mobile-first wedding invitation built with **pure HTML, CSS and Vanilla JS** — no frameworks, no backend, no build step. Host it free on GitHub Pages, Netlify, Cloudflare Pages, or Vercel.

## ✨ Features
- Envelope opening with melting wax seal + gold particle burst
- Full-screen hero & couple video slots (autoplay, loop, lazy-loaded)
- Three ceremony cards (Haldi & Mandapachhadan · Ghritdhari · Sangeet with floating notes)
- **Scratch-to-reveal** wedding venue card (works on touch & mouse) with petal celebration
- Vertical animated timeline with glowing progress dots
- Live countdown · Gallery carousel with lightbox, zoom & swipe
- Family, Travel & Directions cards · Luxury footer
- Ambient falling petals + cursor sparkles (auto-disabled for reduced-motion users)
- Background music toggle (muted by default)

## 📁 Structure
```
index.html      → all content & placeholders
style.css       → design system, animations, responsive rules
script.js       → all interactivity (modular, commented)
assets/
  videos/       → hero.mp4, couple.mp4, wedding.mp4 …
  images/       → ceremony photos, gallery, posters
  audio/        → song.mp3 (background music)
  fonts/ icons/ → optional local assets
```

## 🛠 Customization checklist
1. **Names & dates** — search `Bride Name`, `Groom Name`, and every `[ … Placeholder ]` in `index.html`.
2. **Countdown** — set the real date in `<section id="countdown" data-date="2026-12-12T10:00:00">`.
3. **Videos** — each video slot has an HTML comment showing the exact `<video>` snippet to paste in. Add `data-lazy data-src="assets/videos/x.mp4"` instead of `src` to lazy-load.
4. **Gallery** — duplicate a `.g-item` and drop in `<img class="media-img" loading="lazy" src="assets/images/1.jpg" alt="">` or a `<video>`.
5. **Maps** — replace every `href="#"` on `data-map` buttons with your Google Maps share links.
6. **QR codes** — generate free QR images (e.g. from your Maps links) and replace the `.qr-placeholder` divs with `<img>`.
7. **Music** — track lives at `assets/audio/song.mp3`; it starts automatically when a guest taps the wax seal, and the bottom-right button lets them pause/resume it.

## 🎞 Media optimization (for that 95+ Lighthouse score)
- Videos: 720p, H.264 MP4, 2–6 MB each. Free tool: [HandBrake](https://handbrake.fr).
- Images: export as **WebP**, max width ~1600px. Free tool: [Squoosh](https://squoosh.app).
- Always add a `poster` image to videos so the page paints instantly.

## 🚀 Deploy free
**GitHub Pages:** push the folder to a repo → Settings → Pages → deploy from `main`.
**Netlify / Vercel / Cloudflare Pages:** drag-and-drop the folder into their dashboard. Done.

## ♿ Accessibility
- Respects `prefers-reduced-motion` (particles off, animations minimal)
- Keyboard-navigable gallery & lightbox (Esc / arrow keys)
- Focus-visible outlines, ARIA labels, semantic landmarks
