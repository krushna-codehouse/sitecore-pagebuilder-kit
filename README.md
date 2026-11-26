# Sitecore Page Builder Kit

Tools that make Sitecore Content SDK components Page Builder-safe by default.

| Package | What it does |
| --- | --- |
| [`sitecore-pagebuilder-kit`](packages/kit) | Runtime helpers: `FieldGuard`, field-type empty checks, editor-only hints, and editing-aware hooks for accordions, tabs and carousels |
| [`eslint-plugin-sitecore-pagebuilder`](packages/eslint-plugin) | Lint rules that find code hiding empty fields and components from authors |

The lint rules find the problem; the kit provides the fix.

```tsx
// eslint: 'fields.heading' is hidden when empty, so authors can't fill it in Page Builder.
{fields.heading.value && <div className="hero__heading"><Text field={fields.heading} tag="h1" /></div>}

// Fixed
<FieldGuard field={fields.heading}>
  <div className="hero__heading"><Text field={fields.heading} tag="h1" /></div>
</FieldGuard>
```

> Community project. Not affiliated with or endorsed by Sitecore.

## Development

```sh
npm install
npm test          # unit tests for both packages, including tests against the real Content SDK Text component
npm run typecheck
npm run build
```

## Publishing

1. Create the GitHub repo `Krushna285/sitecore-pagebuilder-kit` (or update the `repository` URLs in both `package.json` files).
2. Log in to npm: `npm login`.
3. Check the package contents: `npm pack --dry-run --workspaces`.
4. Publish: `npm publish --workspaces --access public` (each package builds itself first via `prepublishOnly`).

To publish from CI with npm provenance instead, add an `NPM_TOKEN` secret to the repo and create a GitHub release. The `Publish` workflow runs tests, builds and publishes both packages.

## License

MIT © Krushna Patel
