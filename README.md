# Toddlers’ Snack Box

A React and Vite JavaScript prototype built from Figma, with Tailwind CSS 4, shadcn/ui (Base UI), and locally bundled fonts and artwork.

## Run locally

Use a Node.js version supported by Vite 8.

```sh
npm ci
npm run dev
```

To use the established preview address:

```sh
npm run dev -- --host 127.0.0.1 --port 5180
```

## Checks

```sh
npm run lint
npm run build
npm run preview
```

## Prototype flow

Phone signup → demo verification → child profiles → delivery PIN → food preferences → meal preview → plan selection → dashboard.

The dashboard includes Home, My Box, My Kids, and Profile. Shared components provide child selection, per-child preferences, add-on quantities, box returns, and box management actions. My Kids includes an inline animated Add child form.

The app renders inside a 402 × 874 phone display. Longer screens scroll inside the phone. Setup progress and saved details persist in session storage for the current browser tab.

## Demo limitations

Any six digits complete demo verification. No SMS, payment, subscription, delivery, or support services are connected. Meals, delivery details, prices, nutrition, and return history are sample content. Some actions display explanatory dialogs. Sample boxes are not checked against saved dietary preferences.

## Structure

- `src/App.jsx`: signup flow and shared session state.
- `src/components/`: screens and reusable UI components.
- `src/hooks/useSessionState.js`: tab-session persistence.
- `src/components/ui/`: shadcn components.
- `public/assets/`: local design assets.
- `src/App.css` and component stylesheets: phone frame and screen styling.

The `@/` import alias points to `src/`.
