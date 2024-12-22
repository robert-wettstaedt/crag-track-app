<p align="center">
  <img src="./static/android-chrome-512x512.png" width="128" alt="Crag Track Logo" />
</p>

# Crag Track

Secure boulder topo and session tracker.

[Demo](https://crag-track.vercel.app/)

## Features

- ➕ Create new bouldering areas, crags, and boulders - with support for [FB and V grades](https://www.mountainproject.com/international-climbing-grades).
- ✅ Log your climbing ascents and take notes about your session.
- 📸 Link photos, videos, and PDF files from a file-hosting instance (currently only supports [Nextcloud](https://github.com/nextcloud)).
- 📈 Display your climbing history and statistics about your ascents.
- 🕮 Create detailed topos of your bouldering areas.
- 🔐 Keep your data private, only authorized users can view and manage data.
- 🚀 Easy self-hosting with Docker and docker-compose.

## Installation

1. Ensure you have a Supabase instance running, either in the cloud or locally.
2. Copy [`.env.example`](./.env.example) to `.env` and fill in the necessary information about your Supabase instance and Nextcloud.
3. If no PostgreSQL database exists, it will be created upon starting the app. Then run:

   ```bash
   npm run generate
   npm run migrate
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
