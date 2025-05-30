# 🛠️ mago-cesium-tools

## Overview

mago-cesium-tools is a collection of tools based on `CesiumJS`.  
It encapsulates some of the features of `CesiumJS` to make it easier to use,  
It includes various rendering features such as `WaterSimulation`, `SSAO`, `Edge`, and more.

### Description

`vite` project
language : `vanilla js`

### Dependencies

- vite
- vite-plugin-cesium
- cesium
- jsdom

## Getting Started

### Installation

add `mago-cesium-tools` to your project

```bash
npm i mago-cesium-tools
```

or with `yarn`

```bash
yarn add mago-cesium-tools
```

### Usage

```javascript
import {Viewer} from 'cesium';
import {MagoViewer} from 'mago-cesium-tools'

const viewer = new Viewer('cesiumContainer');
const magoViewer = new MagoViewer(viewer);
magoViewer.test();
```

## Development

### Install

install dependencies for development

```bash
npm install
```

### Start

start dev server at `localhost:5173`

```bash
npm run start
```

### Build

build project, output to `dist` directory

```bash
npm run build
```

### Documentation

https://gaia3d.github.io/mago-cesium-tools/

## License

Mozilla Public License Version 2.0
