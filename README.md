# Google Doc Importer for Obsidian

An Obsidian plugin that imports public Google Docs as Markdown notes.

## Features

- Import any public Google Doc by URL
- Automatically converts to Markdown using Google's native export
- Uses the document's title as the note filename
- Handles duplicate filenames automatically

## Installation

### From Community Plugins (Coming Soon)

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Google Doc Importer"
4. Install and enable the plugin

### Manual Installation

1. Go to the [Releases](https://github.com/yashasolutions/google-doc-importer/releases) page
2. Download `main.js` and `manifest.json` from the latest release
3. Create a folder called `google-doc-importer` in your vault's `.obsidian/plugins/` directory
4. Copy the downloaded files into that folder
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

## Releasing

To create a new release:

1. Update the version in `manifest.json` and `package.json`
2. Update `versions.json` with the new version mapping
3. Commit the changes
4. Create and push a tag: `git tag 1.0.0 && git push origin 1.0.0`
5. GitHub Actions will automatically build and create a release

## License

MIT
