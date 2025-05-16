import globals from "globals";
import {defineConfig} from "eslint/config";

export default defineConfig([
    {
        files: ["src/**/*.{js,ts,mjs,cjs}"],
        languageOptions: {globals: {...globals.browser, ...globals.node}},
    }, {
        rules: {
            "no-console": "off",
            "no-alert": "warn",
            "no-unused-vars": ["warn", {argsIgnorePattern: "^_"}],
            "no-unused-expressions": "off",
            "no-var": "warn",
            "no-undef": "warn",
            "prefer-const": "warn",
            "curly": "error",
            "no-multiple-empty-lines": "warn",
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
            "indent": ["error", 4],
            "spaced-comment": ["warn", "always"],
            "no-warning-comments": ["warn", {terms: ["todo", "fixme"], location: "anywhere"}],
            "no-inline-comments": "warn",
            "arrow-spacing": ["error", {before: true, after: true}],
        },
    }]);