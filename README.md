<br />

<p align="center">
  <img width="3200" height="804" alt="image" src="https://github.com/user-attachments/assets/08149933-609a-4556-8ab4-4ef2622a9c8f" />

</p>
<p align="center">A friendly AI powered open-source alternative to Capcut, Canva.<br><samp>
<a href="https://discord.gg/24Mt5DGcbx"> Discord</a> &nbsp; <a href="https://x.com/trykimu"> Twitter</a> &nbsp; <a href="https://trykimu.com"> Website</a></p>
</samp>

## ✨Features

<table>
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/c504e379-110d-4286-b2b7-7676aa186112" />
      <h2 align="center">Advanced Multi‑Track Editing</h2>
      <p align="center">Edit across unlimited tracks with precise control, snapping, and effortless layer management.</p>
      <br>
    </td>
    <td>
      <img width="1600" height="1000" alt="image" src="https://github.com/user-attachments/assets/94f05873-2f52-46ad-831a-55936f7999da" />
      <h2 align="center">Real‑Time Preview</h2>
      <p align="center">See every change instantly with low‑latency playback—no waiting, no rendering.</p>
      <br>
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/3f464355-d290-4586-aead-f9a1a3c58d63" />
      <h2 align="center">Fast Export</h2>
      <p align="center">Render high‑quality videos quickly and export exactly where you need them.</p>
      <br>
    </td>
    </tr>
    <tr>
      <td>
        <img src="https://github.com/user-attachments/assets/32920f51-4faf-442f-92fc-50d4809cd290" /><h2 align="center">Vibe AI Assistant</h2>
        <p align="center">Describe your idea and let Kimu generate edits, timing, and layouts automatically.</p>
        <br>
      </td>
    <td>
      <img src="https://github.com/user-attachments/assets/0527e006-8438-466e-83ef-b05d7f98604b" />
      <h2 align="center">Smart Media Library</h2>
      <p align="center">Organize by type, tags, and sentiment—search and filter your assets in seconds.</p>
      <br>
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/dae66fb2-3e53-46ce-8fe0-10e62ac3cf70" />
      <h2 align="center">Cloud‑Synced Projects</h2>
      <p align="center">Keep timelines and assets in sync across devices so you can pick up right where you left off.</p>
      <br>
    </td>
  </tr>
</table>
<p align="center">transitions, offline datastore, OAuth based security, change control
<br> and much more...</p>
</samp>

## 💻 Development

<strong> 🐳 <ins>Docker</ins> <code>Recommended</code> </strong>

**Quick Start:**

```bash
docker compose -f docker-compose.yml \
  -f docker-compose.dev.yml up -d
```

**Ports:**

<samp>
  
- Frontend: `5173`
- Backend : `8000`
- FastAPI : `3000`

</samp>
<br>

<strong> 🛠️ <ins>Local Development</ins></strong>

<samp>For local development without Docker:</samp>

```bash
# Install dependencies
pnpm install

# Start services
pnpm run dev                                    # Frontend (port 5173)
pnpm dlx tsx app/videorender/videorender.ts     # Backend (port 8000)
uv run backend/main.py                          # FastAPI (port 3000)

# Note: You'll need GEMINI_API_KEY for AI features
```

`Requirements`

<samp>
  
- Node.js 20+
- Python 3.9+
- PostgreSQL
- pnpm

</samp>
</details>

## 🚀 Production

**Quick Start:**

```bash
docker compose up -d
```

**With Custom Domain:**

```bash
PROD_DOMAIN=yourdomain.com docker compose up -d
```

or alternatively edit `docker-compose.yml`

**Ports:**

- HTTP: `80`
- HTTPS: `443`

## ⚙️ Environment Configuration

Create a `.env` file for custom settings:

```env
# Domain Configuration
PROD_DOMAIN=yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/videoeditor

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Features (Optional -> /backend)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (Optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

**Environment Variables Explained:**

- `PROD_DOMAIN`: Your production domain (host only, e.g., `yourdomain.com`)
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID/SECRET`: Google OAuth credentials for authentication
- `GEMINI_API_KEY`: Required for AI-powered video editing features
- `VITE_SUPABASE_*`: Optional Supabase integration for additional features

<br>

## ❤️Contribution

<samp> We would love your contributions! ❤️ Check the [contribution guide](CONTRIBUTING.md). </samp>

## 📜License

<samp> This project is licensed under a dual-license. Refer to [LICENSE](LICENSE.md) for details. The [Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) also applies to the relevant parts of the project. </samp>
