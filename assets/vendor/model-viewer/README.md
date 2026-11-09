# model-viewer (vendored)

`model-viewer.min.js` is `dist/model-viewer.min.js` from the npm package
`@google/model-viewer@4.4.0` (Apache-2.0, see `LICENSE`; it bundles three.js 0.183).
Self-hosted so visitors make no third-party requests. Loaded only on pages that use the
`model` shortcode, by `layouts/partials/extend-head-uncached.html`.

To update:

```bash
npm pack @google/model-viewer@<version>
tar -xzf google-model-viewer-<version>.tgz
cp package/dist/model-viewer.min.js assets/vendor/model-viewer/
```

then change the version in this file and in the partial's comment.
