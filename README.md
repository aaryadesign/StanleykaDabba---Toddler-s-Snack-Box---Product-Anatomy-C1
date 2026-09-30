# 3D Box - temp

> ⚠️ **NOT FINAL. Temporary prototype. This will not ship in the final app.**
> This branch lives on its own and must never be merged into `main`.

An interactive three.js concept of the Toddlers' Snack Box: a returnable lunch box that toddlers (ages 1–3) play and learn with.

- Snack Buddies lid buttons that teach colours and shapes, in English and Hindi
- Five-part bento with a named meal for each day
- A different bead-counting game every day
- Nutrition card in a clear back pocket
- "Meet today's food" card inside the lid, with Yum / Hmm taps
- Weekly sticker chart (return the box, earn a sticker)
- Picture wheel and a name sticker (Aarav)

## Run locally

```bash
python3 serve.py 5191 .
```

Then open http://localhost:5191. Three.js loads from the jsdelivr CDN, so there is no build step.

To regenerate `logo.svg` from `src/brand.js`, run `node tools/make-logo-svg.mjs`.

Nutrition numbers are placeholders (only Tuesday's matches the app). Have them checked before any real use.
