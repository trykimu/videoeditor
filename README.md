
<div align="right">
  <details>
    <summary >🌐 Language</summary>
    <div>
      <div align="right">
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=en">English</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=zh-CN">简体中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=zh-TW">繁體中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=ja">日本語</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=ko">한국어</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=hi">हिन्दी</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=th">ไทย</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=fr">Français</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=de">Deutsch</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=es">Español</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=it">Itapano</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=ru">Русский</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=pt">Português</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=nl">Nederlands</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=pl">Polski</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=ar">العربية</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=fa">فارسی</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=tr">Türkçe</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=vi">Tiếng Việt</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=robinroy03&project=videoeditor&lang=id">Bahasa Indonesia</a></p>
      </div>
    </div>
  </details>
</div>

<samp>
  
<h1>Open-Source Video Editor</h1>
<p>Not your ordinary Video Editor Application using React, Remotion & TypeScript.</p>
<br />

> [!NOTE]  
> The application is under active development. This is an early MVP. Please join the [Discord server](https://discord.gg/GSknuxubZK) if you're going to run it.

<br />

<p align="center">
  <img src="public/screenshot-app.png" alt="React Video Editor Screenshot">
</p>
<p align="center">An open-source alternative to Capcut, Canva, and RVE.</p>
</samp>

## ✨Features

- 🎬Non Linear Video Editing
- 🔀Multi-track Support
- 👀Live Preview
- 📤Export Video
- 📜Licensed under MIT

## 🐋Deployment

```
git clone https://github.com/robinroy03/videoeditor.git
cd videoeditor
docker compose up
```

## 🧑‍💻Development

```
pnpm i
pnpm run dev (frontend)
pnpm dlx tsx app/videorender/videorender.ts (backend)
uv run backend/main.py
flip `isProduction` to `false` in `/app/utils/api.ts`

You will also require a GEMINI_API_KEY if you want to use AI.
```

## 📃TODO

We have a lot of work! For starters, we plan to integrate all Remotion APIs. I'll add a proper roadmap soon. Join the [Discord Server](https://discord.com/invite/GSknuxubZK) for updates and support.

## ❤️Contribution

We would love your contributions! ❤️ Check the [contribution guide](CONTRIBUTING.md).

## 📜License

This project is licensed under the MIT License. The [Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) also applies to the relevant parts of the project.
