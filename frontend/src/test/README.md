# Frontend tests

Vitest + React Testing Library, running in `happy-dom` (not `jsdom` — see the
comment in `vite.config.js`'s `test` block for why).

## Running

```bash
npm test          # everything, once
npm run test:watch   # watch mode
```

## Layout

Test files live next to the code they cover (`Foo.jsx` → `Foo.test.jsx`), not
in a separate mirror tree — so a rename or delete can't leave an orphaned
test behind unnoticed.

- `src/lib/*.test.js` — pure functions, no DOM.
- `src/app/store/*.test.js` — zustand store logic, exercised directly via
  `store.getState()` — no React rendering needed for state-machine behavior.
- `src/components/ui/*.test.jsx` — component rendering, via
  `@testing-library/react`.

`src/test/setup.js` wires up `@testing-library/jest-dom`'s matchers
(`toBeInTheDocument()`, etc.) globally — `globals: true` in `vite.config.js`
also means `describe`/`it`/`expect` don't need per-file imports, though the
tests here import them explicitly anyway for clarity.
