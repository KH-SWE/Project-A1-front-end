// Keep this file intentionally minimal to avoid interfering with `react-native` type resolution.
// Instead of augmenting the `react-native` module (which can sometimes cause unexpected conflicts with the package's own types),
// we declare a small global marker that `_layout.tsx` already uses to avoid re-applying defaultProps.

declare global {
  // app-level flag used in `_layout.tsx` to mark that default font application has already run
  var __interFontApplied: boolean | undefined;
}

export {};
