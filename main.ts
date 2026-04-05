import { App, Modal, Notice, Plugin, requestUrl, Setting } from 'obsidian';

class GoogleDocUrlModal extends Modal {
	onSubmit: (url: string) => void;

	constructor(app: App, onSubmit: (url: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: 'Import Google Doc' });

		let inputValue = '';

		new Setting(contentEl)
			.setName('Google Doc URL')
			.setDesc('Paste the URL of a public Google Doc')
			.addText((text) => {
				text.setPlaceholder('https://docs.google.com/document/d/...');
				text.onChange((value) => {
					inputValue = value;
				});
				text.inputEl.style.width = '100%';
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.close();
						this.onSubmit(inputValue);
					}
				});
			});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText('Import')
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(inputValue);
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class GoogleDocImporterPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'import-google-doc',
			name: 'Import Google Doc',
			callback: () => {
				new GoogleDocUrlModal(this.app, (url) => {
					this.importGoogleDoc(url);
				}).open();
			},
		});
	}

	extractDocumentId(url: string): string | null {
		// Handle various Google Docs URL formats
		// https://docs.google.com/document/d/DOCUMENT_ID/edit
		// https://docs.google.com/document/d/DOCUMENT_ID/view
		// https://docs.google.com/document/d/DOCUMENT_ID
		const patterns = [
			/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
			/^([a-zA-Z0-9_-]+)$/ // Just the ID itself
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) {
				return match[1];
			}
		}

		return null;
	}

	async importGoogleDoc(url: string) {
		if (!url || url.trim() === '') {
			new Notice('Please enter a Google Doc URL');
			return;
		}

		const documentId = this.extractDocumentId(url.trim());

		if (!documentId) {
			new Notice('Invalid Google Doc URL. Please use a valid Google Docs link.');
			return;
		}

		new Notice('Importing Google Doc...');

		try {
			// Fetch the markdown export
			const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=md`;
			const response = await requestUrl({
				url: exportUrl,
				method: 'GET',
			});

			if (response.status !== 200) {
				new Notice(`Failed to fetch document. Make sure it's publicly accessible.`);
				return;
			}

			let markdown = response.text;

			// Extract title from the first heading or first line
			let title = this.extractTitle(markdown);
			
			// Sanitize the title for use as a filename
			title = this.sanitizeFilename(title);

			if (!title) {
				title = `Google Doc ${documentId.substring(0, 8)}`;
			}

			// Check if file already exists and generate unique name if needed
			let filename = `${title}.md`;
			let counter = 1;
			while (await this.app.vault.adapter.exists(filename)) {
				filename = `${title} ${counter}.md`;
				counter++;
			}

			// Create the note
			await this.app.vault.create(filename, markdown);

			// Open the newly created note
			const file = this.app.vault.getAbstractFileByPath(filename);
			if (file) {
				await this.app.workspace.openLinkText(filename, '', true);
			}

			new Notice(`Successfully imported: ${filename}`);
		} catch (error) {
			console.error('Error importing Google Doc:', error);
			new Notice(`Failed to import document. Make sure it's publicly accessible and try again.`);
		}
	}

	extractTitle(markdown: string): string {
		// Try to find a title from the first heading
		const headingMatch = markdown.match(/^#\s+(.+)$/m);
		if (headingMatch) {
			return headingMatch[1].trim();
		}

		// Fall back to first non-empty line
		const lines = markdown.split('\n');
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('<!--')) {
				// Remove any markdown formatting
				return trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
			}
		}

		return '';
	}

	sanitizeFilename(filename: string): string {
		// Remove or replace characters that are invalid in filenames
		return filename
			.replace(/[\\/:*?"<>|]/g, '-')
			.replace(/\s+/g, ' ')
			.trim()
			.substring(0, 100); // Limit length
	}

	onunload() {
		// Cleanup if needed
	}
}
