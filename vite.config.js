import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
import * as path from "node:path";
export default defineConfig({
    plugins: [
        cesium({
            rebuildCesium: true
        }
    )],
    test: {
        globals: true, // Jest 스타일의 전역 메서드 (`describe`, `it`, `expect` 등) 사용 가능
        environment: 'jsdom', // DOM 테스트를 위해 jsdom 환경 사용
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
    }
});