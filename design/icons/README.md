# MYX category icons

65 two-tone icons shown inside a coloured rounded tile (24×24 grid).

- 60 glyphs come from [Phosphor Icons](https://github.com/phosphor-icons/core) v2.1.1, duotone weight, MIT license (see `LICENSE-phosphor`).
- 5 glyphs are drawn for MYX: `milktea`, `soda`, `badminton`, `cosmetic`, `wedding`.

## Files

- `icons.py`: source of truth (groups, colours, VI/EN names, Phosphor mapping).
- `icons.json`: generated data used by the prototype and, later, the app.
- `gallery.html`: browsable gallery.

## Regenerate

```bash
npm install @phosphor-icons/core@2.1.1
python design/icons/icons.py node_modules/@phosphor-icons/core/assets/duotone
```
