# Google Doc Importer for Obsidian

An Obsidian plugin that imports public Google Docs as Markdown notes.

## Features

- Import any public Google Doc by URL
- Automatically converts to Markdown using Google's native export
- Uses the document's title as the note filename
- Handles duplicate filenames automatically

## Installation

### Manual Installation

1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the plugin
4. Copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/google-doc-importer/` folder
5. Enable the plugin in Obsidian's settings under Community Plugins

### Development

1. Clone this repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and set your Obsidian vault plugin path:
   ```
   OBSIDIAN_PLUGIN_FOLDER=/path/to/your/vault/.obsidian/plugins/google-doc-importer
   ```
4. Run `npm run deploy` to build and copy files to your vault
5. Enable the plugin in Obsidian

## Usage

1. Open the command palette (Ctrl/Cmd + P)
2. Search for "Import Google Doc"
3. Paste the URL of a public Google Doc
4. Click "Import" or press Enter

The plugin will create a new note with the document's content in Markdown format.

## Supported URL Formats

- `https://docs.google.com/document/d/DOCUMENT_ID/edit`
- `https://docs.google.com/document/d/DOCUMENT_ID/view`
- `https://docs.google.com/document/d/DOCUMENT_ID`
- Just the document ID itself

## Requirements

- The Google Doc must be publicly accessible (set to "Anyone with the link can view")
- No Google authentication is required

## Scripts

- `npm run dev` - Watch mode for development
- `npm run build` - Build for production
- `npm run deploy` - Build and copy to your Obsidian vault (requires `.env` configuration)

## License

MIT
