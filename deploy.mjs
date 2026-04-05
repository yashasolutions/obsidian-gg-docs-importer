import { config } from 'dotenv';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

config();

const destFolder = process.env.OBSIDIAN_PLUGIN_FOLDER;

if (!destFolder) {
	console.error('Error: OBSIDIAN_PLUGIN_FOLDER is not defined in .env file');
	console.error('Create a .env file with: OBSIDIAN_PLUGIN_FOLDER=/path/to/your/vault/.obsidian/plugins/google-doc-importer');
	process.exit(1);
}

if (!existsSync(destFolder)) {
	mkdirSync(destFolder, { recursive: true });
	console.log(`Created directory: ${destFolder}`);
}

const filesToCopy = ['main.js', 'manifest.json'];

for (const file of filesToCopy) {
	const src = file;
	const dest = join(destFolder, file);
	
	if (!existsSync(src)) {
		console.error(`Error: ${src} not found. Did you run the build first?`);
		process.exit(1);
	}
	
	copyFileSync(src, dest);
	console.log(`Copied ${src} -> ${dest}`);
}

console.log('Deploy complete!');
