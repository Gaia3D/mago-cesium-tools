import { defineConfig } from 'vite';
//import cesium from 'vite-plugin-cesium';
//import glsl from 'vite-plugin-glsl';
import * as path from "node:path";

export default defineConfig({
    publicDir: false,
    plugins: [],
    server: {
        host: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/entry.js'),
            name: 'mago-cesium-tools',
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs']
        },
        minify: false,
        rollupOptions: {
            external: ["http", "https", "url", "zlib"],
            output: {
                globals: {
                    cesium: 'Cesium',
                },
            },
        }
    },
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.jpg', '**/*.png', '**/*.svg', '**/*.json', '**/*.vert', '**/*.frag', '**/*.glsl'],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});