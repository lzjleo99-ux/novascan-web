# NOVASCAN 3D — 测试站点

塞尔维亚 3D 扫描服务网站（纯静态，无构建依赖）。架构与设计决策见上级目录 `ARCHITECTURE.md`。

## 本地预览

任选其一：
```bash
npx http-server site -p 8080     # 推荐
# 或
cd site && python -m http.server # 有 Python 的话
```
浏览器打开 http://localhost:8080

## 部署到 GitHub Pages（已配置凭据时）

```bash
cd site
git init && git add -A && git commit -m "novascan test site"
git branch -M main
git remote add origin https://github.com/<user>/novascan-3d.git
git push -u origin main
# 然后仓库 Settings → Pages → Source: main / root
```

## 你以后要改的东西（都在这 3 个文件里）

| 要改什么 | 在哪 |
|---|---|
| 联系方式（邮箱/电话/WhatsApp/地址）、品牌名 | `assets/js/main.js` 顶部 `SITE` 对象（有中文注释） |
| 塞尔维亚语翻译 | `assets/js/i18n.js`（SR 词典，键=英文版文案） |
| 英文文案 | 直接改各 HTML 文件 |
| 首页滚动动画帧 | `assets/img/frames/f000.webp … f159.webp`（整目录替换即可，`hero.js` 自动适配） |
| 案例图 / 海报 / OG 图 | `assets/img/cases/`、`poster.jpg`、`og.jpg` |

## 待补清单（当前为占位）

品牌名 NOVASCAN、邮箱、电话、WhatsApp、详细地址、PIB/MB、真实案例照片、价格口径、社交链接。

## 已知测试性说明

- 案例缩略图为程序生成的点云示意图（页面已标注 PLACEHOLDER），拿到真实扫描件后替换。
- 首页滚动动画为 160 帧 WebP 序列（Apple 式擦洗），另有 `assets/video/scan-hero.mp4` 完整版预告片可单独发给客户。
