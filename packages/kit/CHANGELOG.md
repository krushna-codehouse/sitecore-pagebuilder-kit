# Changelog

## 0.1.0

First release.

- `FieldGuard`: keeps wrapper markup visible for empty fields in Page Builder and removes it on the live site.
- Field-type empty checks: `isEmptyText`, `isEmptyRichText`, `isEmptyImage`, `isEmptyLink`, `isEmptyFile`, `isEmptyDate`, `isEmptyList`, `isEmptyField`, plus `hasEditingMetadata`.
- Editor-only hints: `EditorHint`, `TextLengthHint`, `ImageAltHint`, `LinkTextHint`.
- Client entry (`sitecore-pagebuilder-kit/client`): `useIsEditing`, `useEditingExpand`, `useEditingSafeAutoplay`, `EditingOnly`, `LiveOnly`, `EmptyListHint`.
