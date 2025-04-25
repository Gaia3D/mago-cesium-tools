import {defineConfig} from "vite";
import * as path from "node:path";
import eslintPlugin from "vite-plugin-eslint";

export default defineConfig(({command}) => {
    const isBuild = command === "build";
    //const publicEnabled = process.env.PUBLIC_ENABLED !== 'false'; // 기본 true
    return {
        publicDir: isBuild ? false : "public",
        plugins: [eslintPlugin()],
        server: {
            host: true,
        },
        test: {
            globals: true, environment: "jsdom",
        },
        build: {
            lib: {
                entry: path.resolve(__dirname, "src/entry.js"),
                name: "MagoCesiumTools",
                fileName: (format) => `index.${format}.js`,
                formats: ["es", "cjs", "iife"],
            }, minify: false, rollupOptions: {
                external: ["http", "https", "url", "zlib"], output: {
                    globals: {
                        cesium: "Cesium",
                    },
                },
            },
        },
        assetsInclude: [
            "**/*.gltf",
            "**/*.glb",
            "**/*.jpg",
            "**/*.png",
            "**/*.svg",
            "**/*.json",
            "**/*.vert",
            "**/*.frag",
            "**/*.glsl"],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
    };
});