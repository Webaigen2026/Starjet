# Cera Pro (licensed)

Add these files here (exact names) to enable the real typeface:

- `CeraPro-Regular.woff2` (400)
- `CeraPro-Medium.woff2` (500)
- `CeraPro-Bold.woff2` (700)

Until then, the app uses Geist (via `--font-cera`) and does **not** register
`@font-face` rules, so the browser will not request missing `/fonts/*.woff2` files.

After adding the files, restore the three `@font-face` blocks in `app/globals.css`
(see the comment at the top of that file) and optionally switch `app/layout.tsx`
to `next/font/local`.
