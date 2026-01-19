# Windchasers Documentation

This directory contains documentation specific to the Windchasers brand application.

## Available Documentation

- `README.md` - This file

## Application Location

The Windchasers Next.js application is located in `../build/`

## ⚠️ Important: Working Directory

**You must be in the `build/` directory to run npm commands!**

The `package.json` is located in `brand/windchasers/build/`, not in `brand/windchasers/`.

## Quick Start

```bash
# Navigate to the build directory (IMPORTANT!)
cd ../build

# Verify you're in the right place
ls package.json  # Should show package.json exists

# Install dependencies
npm install

# Run development server
npm run dev
```

## Troubleshooting

If you get an error like:
```
npm ERR! enoent ENOENT: no such file or directory, open 'package.json'
```

**Solution**: Make sure you're in the `build/` subdirectory:
```bash
cd brand/windchasers/build
```

## Database

Database schemas and migrations are located in `../supabase/`
