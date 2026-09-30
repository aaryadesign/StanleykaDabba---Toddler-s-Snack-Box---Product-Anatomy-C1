# Motion study (prototype)

> ⚠️ **Prototype for review. This is not app code.**
> This branch lives on its own and must never be merged into `main`.

A live motion study of two screens from the app.

**Onboarding characters.** These are built from the existing character parts (body, eyes, cheeks, mouth), and at rest each looks exactly like the original art. They:
- breathe, blink, and follow your cursor or the caret with their eyes;
- change expressions: a curious "o", a smile and blush, a grin with happy ^ ^ eyes, a sad frown with droopy lids, a "yum" tongue on the meal screen, and falling asleep when left alone;
- react with a squish, hop, head shake or nod.

**Tomorrow's box.** This is the app's "Box for tomorrow" screen with the hero photo swapped for a live 3D box.
- **Unboxing:** it drops in and bounces, then shakes while closed with a "Tap to open!" bubble. On tap, the lid flies up with confetti and each compartment pops to life.
- **What's inside:** count tags sit on the food. Tap one to glide in; a card shows the amount and what it's made from, using the app's ingredient icons.
- **Ingredients list:** tapping an ingredient on the screen shows where it is in the box.
- **Camera:** drag to turn, pinch or scroll to zoom. If the box leaves the frame, it glides back.

## Run locally

```bash
python3 serve.py 5193 .
```

Then open http://localhost:5193. Three.js loads from the jsdelivr CDN, so there is no build step.

- `app.css` is the app's compiled CSS.
- `src/` is the 3D box from the `3d-box-temp` branch, with portion, reveal and rattle support added.
- `motion/` holds the character and box-stage code.

Portion amounts and nutrition numbers are placeholders.
