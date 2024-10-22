# vite-plugin-iconify-plus

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-iconify)](https://www.npmjs.com/package/@tomjs/vite-plugin-iconify) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-iconify) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-iconify) [![Docs](https://img.shields.io/badge/API-unpkg-orange)](https://www.unpkg.com/browse/@tomjs/vite-plugin-iconify/dist/index.d.ts)

> vite 插件，用于处理 iconify 图标集，在无法访问公网的环境下使用，可以识别到项目中使用到的图标，进行按需下载到项目中

## 安装

```bash
# pnpm
pnpm add @iconify/json @iconify/utils vite-plugin-iconify-plus -D

# yarn
yarn add @iconify/json @iconify/utils vite-plugin-iconify-plus -D

# npm
npm i @iconify/json @iconify/utils vite-plugin-iconify-plus --save-dev
```

## 使用说明

以 vite 项目为例

### 使用插件

#### 示例

```js
import { defineConfig } from 'vite';
import iconify from 'vite-plugin-iconify-plus';

export default defineConfig({
  plugins: [
    iconify(),
  ],
});
```

##### IconifySet

iconify 图标集，参考 [icon sets](https://icon-sets.iconify.design/) 或 [Icônes](https://icones.js.org/)

## 开发

- 开发环境

  - git
  - node>=16
  - pnpm>=8

- 首次使用，需要安装依赖，执行如下命令

```bash
# 安装依赖
pnpm i
# 编译库
pnpm build
```
