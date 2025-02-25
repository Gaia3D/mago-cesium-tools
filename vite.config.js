import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
import glsl from 'vite-plugin-glsl';
import * as path from "node:path";

export default defineConfig({
    plugins: [
        cesium({
            rebuildCesium: true
        }, glsl()
    )],
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
        rollupOptions: {
            external: ['cesium'],
            output: {
                globals: {
                    cesium: 'Cesium',
                },
            },
        }
    },
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.jpg', '**/*.png', '**/*.svg', '**/*.json', '**/*.vert', '**/*.frag', '**/*.glsl'],
});