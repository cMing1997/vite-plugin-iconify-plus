import { dirname, join, resolve } from 'node:path';
import { loadEnv, PluginOption, UserConfig } from 'vite';
import fs from 'fs-extra';
import { parse as htmlParser } from 'node-html-parser';
import { loadCollection } from '@iconify/json';
import { getIcons } from '@iconify/utils';
import { PLUGIN_NAME } from './constants';
import { urlConcat } from './utils';

const PKG_NAME = '@iconify/json';
const DEFAULT_API = 'https://api.iconify.design';
const localOutPath = 'npm/@iconify/json@{version}';

const root = process.cwd();
const mode = process.env.NODE_ENV;
const { VITE_PUBLIC_PATH } = loadEnv(mode!, root);
const prefixPath = VITE_PUBLIC_PATH;

/**
 * Get @iconify/json version
 */
function getIconifyInfo() {
  const pwd = process.cwd();
  const modulePath = join(pwd, 'node_modules', PKG_NAME);
  const pkgFile = join(modulePath, 'package.json');

  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  const json = fs.readdirSync(join(modulePath, 'json')) || [];
  const sets: string[] = json.map(s => s.substring(0, s.lastIndexOf('.json')));

  if (!fs.existsSync(pkgFile)) {
    return;
  }

  return {
    version: pkg.version,
    sets,
  };
}

function getUrlPath(url, version?: string): string {
  const dest = url || '';
  if (version) {
    return dest.replace('{version}', version);
  } else {
    return dest.replace(/[/@]{version}/g, '');
  }
}

/**
 * Iconify icon sets plugin
 */
export function useIconifyPlugin(): PluginOption {
  /** 禁止匹配文件类型 */

  const blockedExt = [
    '.html',
    '.less',
    '.scss',
    '.css',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.webp',
    '.ico',
  ];
  /** 只匹配当前项目根目录下的src目录下的 */
  const mathDir = resolve(process.cwd(), 'src/').replaceAll('\\', '/');
  const icons: string[] = [];
  icons;

  let userConfig: UserConfig = {};

  const iconifyPkgInfo = getIconifyInfo();
  const iconNameSpaceMap: Record<string, Record<string, string>[]> = {};

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    enforce: 'post',

    config(config) {
      userConfig = config;
    },
    transformIndexHtml(html) {
      const root = htmlParser(html);
      const title = root.querySelector('title');
      if (!title) {
        const head = root.querySelector('head');
        if (!head) {
          root?.insertAdjacentHTML('beforeend', '<head></head>');
        }
        head?.insertAdjacentHTML('beforeend', '<title></title>');
      }

      let urls: string[] = [urlConcat(prefixPath, localOutPath)];
      urls = [
        ...new Set(urls.map(s => getUrlPath(s, iconifyPkgInfo?.version)).concat([DEFAULT_API])),
      ].map(s => `'${s}'`);

      title?.insertAdjacentHTML(
        'afterend',
        `<script>
                IconifyProviders = {
                    '': {
                        resources: [${urls.join(',')}],
                        rotate: 1000,
                    },
                };
            </script>`,
      );

      return root.toString();
    },
    async transform(code: string, id: string): Promise<string> {
      const isBlockedExt = blockedExt.some(ext => id.split('?')[0].endsWith(ext));
      const isBlockedDir = !id.startsWith(mathDir);
      if (isBlockedExt || isBlockedDir) return code;
      const dir = resolve(process.cwd(), `node_modules/${PKG_NAME}`);

      const raw = await fs.readJSON(join(dir, 'collections.json'));
      if (!raw) return code;

      const prefixIds = Object.keys(raw);
      const regex = /[a-zA-Z0-9][a-zA-Z0-9-_]*:[_a-zA-Z0-9-]+/g;
      const iconRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]*:[_a-zA-Z0-9-]+$/gm;

      const matches = [...code.matchAll(regex)];
      const matchIcons = matches
        .map(m => m[0])
        .filter(m => m.match(iconRegex) && prefixIds.includes(m.split(':')[0]));
      for (const it of matchIcons) {
        if (!icons.includes(it)) icons.push(it);
      }
      return code;
    },

    closeBundle() {
      const outDir = userConfig.build?.outDir || 'dist';
      const outPath = join(process.cwd(), outDir);
      if (!fs.existsSync(outPath)) fs.mkdirpSync(outPath);
      const srcFolder = join(process.cwd(), 'node_modules', PKG_NAME, 'json');
      const destFolder = join(outPath, getUrlPath(localOutPath, iconifyPkgInfo?.version));

      const iconSplitRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]*:[_a-zA-Z0-9-]+$/;
      for (const it of icons) {
        if (iconSplitRegex.test(it)) {
          const [prefix, name] = it.split(':');
          if (!iconNameSpaceMap[prefix]) {
            iconNameSpaceMap[prefix] = [];
          }
          iconNameSpaceMap[prefix].push({ name, icon: it });
        }
      }

      Object.keys(iconNameSpaceMap).forEach(async s => {
        const usedIcons = iconNameSpaceMap[s].map(t => t.name);
        const name = `${s}.json`;
        const inputFolder = join(srcFolder, name);
        const outFolder = join(destFolder, name);

        const iconJson = await loadCollection(inputFolder);
        const iconData = getIcons(iconJson, usedIcons);

        // 确保目标目录存在
        const distDir = dirname(outFolder);
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        // 将读取的内容写入到目标文件
        fs.writeFileSync(outFolder, JSON.stringify(iconData), 'utf8');
      });
    },
  } as PluginOption;
}

export default useIconifyPlugin;
