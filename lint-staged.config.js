export default {
  '*.{ts,tsx}': ['eslint --fix --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{json,css,md,html,yml,yaml}': ['prettier --write'],
}
