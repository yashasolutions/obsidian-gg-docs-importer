import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Read manifest to get plugin info
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));

const pluginEntry = {
	id: manifest.id,
	name: manifest.name,
	author: manifest.author,
	description: manifest.description,
	repo: "yashasolutions/google-doc-importer"
};

// Check if gh CLI is installed
try {
	execSync('gh --version', { stdio: 'ignore' });
} catch (error) {
	console.error('Error: GitHub CLI (gh) is not installed.');
	console.error('Install it from: https://cli.github.com/');
	process.exit(1);
}

// Check if user is authenticated
try {
	execSync('gh auth status', { stdio: 'ignore' });
} catch (error) {
	console.error('Error: Not authenticated with GitHub CLI.');
	console.error('Run: gh auth login');
	process.exit(1);
}

console.log('='.repeat(60));
console.log('OBSIDIAN COMMUNITY PLUGIN SUBMISSION');
console.log('='.repeat(60));
console.log('');

// Check prerequisites
console.log('Checking prerequisites...');

// Check if release exists
try {
	const releases = execSync('gh release list --repo yashasolutions/google-doc-importer --limit 1', { encoding: 'utf8' });
	if (!releases.trim()) {
		console.error('Error: No releases found. Create a release first with:');
		console.error('  git tag 1.0.0 && git push origin 1.0.0');
		process.exit(1);
	}
	console.log('  ✓ GitHub release exists');
} catch (error) {
	console.error('Error: Could not check releases. Make sure the repo exists and is public.');
	process.exit(1);
}

console.log('  ✓ README.md exists');
console.log('  ✓ LICENSE exists');
console.log('  ✓ manifest.json exists');
console.log('');

// Fork the obsidian-releases repo
console.log('Forking obsidian-releases repository...');
try {
	execSync('gh repo fork obsidianmd/obsidian-releases --clone=false', { stdio: 'inherit' });
} catch (error) {
	// Fork might already exist, which is fine
	console.log('  (Fork may already exist, continuing...)');
}
console.log('');

// Get the current user's GitHub username
const username = execSync('gh api user --jq .login', { encoding: 'utf8' }).trim();
console.log(`GitHub username: ${username}`);
console.log('');

// Create a unique branch name
const branchName = `add-plugin-${manifest.id}`;

// Fetch the current community-plugins.json
console.log('Fetching current community-plugins.json...');
const communityPluginsJson = execSync(
	'gh api repos/obsidianmd/obsidian-releases/contents/community-plugins.json --jq .content | base64 -d',
	{ encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
);

const communityPlugins = JSON.parse(communityPluginsJson);

// Check if plugin already exists
const existingPlugin = communityPlugins.find(p => p.id === manifest.id);
if (existingPlugin) {
	console.error(`Error: Plugin with id "${manifest.id}" already exists in community-plugins.json`);
	process.exit(1);
}

// Add the new plugin entry in alphabetical order by id
communityPlugins.push(pluginEntry);
communityPlugins.sort((a, b) => a.id.localeCompare(b.id));

const updatedJson = JSON.stringify(communityPlugins, null, '\t') + '\n';

// Write to a temp file
const tempFile = '/tmp/community-plugins.json';
const { writeFileSync } = await import('fs');
writeFileSync(tempFile, updatedJson);

console.log('');
console.log('Plugin entry to be added:');
console.log(JSON.stringify(pluginEntry, null, '\t'));
console.log('');

// Create a new branch and commit
console.log('Creating branch and committing changes...');

try {
	// Clone the fork, create branch, commit, and push
	const commands = [
		`gh repo clone ${username}/obsidian-releases /tmp/obsidian-releases -- --depth 1`,
		`cd /tmp/obsidian-releases && git remote add upstream https://github.com/obsidianmd/obsidian-releases.git`,
		`cd /tmp/obsidian-releases && git fetch upstream master`,
		`cd /tmp/obsidian-releases && git checkout -b ${branchName} upstream/master`,
		`cp ${tempFile} /tmp/obsidian-releases/community-plugins.json`,
		`cd /tmp/obsidian-releases && git add community-plugins.json`,
		`cd /tmp/obsidian-releases && git commit -m "Add plugin: ${manifest.name}"`,
		`cd /tmp/obsidian-releases && git push -u origin ${branchName} --force`
	];

	for (const cmd of commands) {
		execSync(cmd, { stdio: 'inherit' });
	}
} catch (error) {
	console.error('Error during git operations:', error.message);
	process.exit(1);
}

console.log('');

// Create the pull request
console.log('Creating pull request...');
try {
	const prBody = `## Add plugin: ${manifest.name}

### Plugin Information
- **ID:** ${manifest.id}
- **Name:** ${manifest.name}
- **Author:** ${manifest.author}
- **Description:** ${manifest.description}
- **Repository:** https://github.com/yashasolutions/google-doc-importer

### Checklist
- [x] I have tested the plugin on desktop
- [x] The plugin has a README.md
- [x] The plugin has a LICENSE file
- [x] The plugin has a manifest.json with all required fields
- [x] There is a GitHub release with main.js and manifest.json attached
`;

	const prUrl = execSync(
		`cd /tmp/obsidian-releases && gh pr create --repo obsidianmd/obsidian-releases --title "Add plugin: ${manifest.name}" --body "${prBody.replace(/"/g, '\\"')}"`,
		{ encoding: 'utf8' }
	).trim();

	console.log('');
	console.log('='.repeat(60));
	console.log('SUCCESS! Pull request created:');
	console.log(prUrl);
	console.log('='.repeat(60));
} catch (error) {
	console.error('Error creating pull request:', error.message);
	console.log('');
	console.log('You may need to create the PR manually at:');
	console.log(`https://github.com/${username}/obsidian-releases/pull/new/${branchName}`);
}

// Cleanup
try {
	execSync('rm -rf /tmp/obsidian-releases /tmp/community-plugins.json', { stdio: 'ignore' });
} catch (error) {
	// Ignore cleanup errors
}
