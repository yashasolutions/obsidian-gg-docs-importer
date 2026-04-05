import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Read manifest to get plugin info
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));

const pluginEntry = {
	id: manifest.id,
	name: manifest.name,
	author: manifest.author,
	description: manifest.description,
	repo: "yashasolutions/obsidian-gg-docs-importer"
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
	const releases = execSync('gh release list --repo yashasolutions/obsidian-gg-docs-importer --limit 1', { encoding: 'utf8' });
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

// Add the new plugin entry at the END (not sorted alphabetically!)
communityPlugins.push(pluginEntry);

const updatedJson = JSON.stringify(communityPlugins, null, '\t') + '\n';

// Write to a temp file
const tempFile = '/tmp/community-plugins.json';
const { writeFileSync } = await import('fs');
writeFileSync(tempFile, updatedJson);

console.log('');
console.log('Plugin entry to be added:');
console.log(JSON.stringify(pluginEntry, null, '\t'));
console.log('');

// Cleanup any previous attempt
console.log('Cleaning up any previous attempts...');
try {
	execSync('rm -rf /tmp/obsidian-releases', { stdio: 'ignore' });
} catch (error) {
	// Ignore cleanup errors
}

// Create a new branch and commit
console.log('Creating branch and committing changes...');

try {
	// Clone the fork
	console.log('  Cloning fork...');
	execSync(`gh repo clone ${username}/obsidian-releases /tmp/obsidian-releases -- --depth 1`, { stdio: 'inherit' });
	
	// Add upstream remote (ignore error if it already exists)
	console.log('  Setting up upstream remote...');
	try {
		execSync('cd /tmp/obsidian-releases && git remote add upstream https://github.com/obsidianmd/obsidian-releases.git', { stdio: 'pipe' });
	} catch (error) {
		// Remote might already exist, try to set the URL instead
		execSync('cd /tmp/obsidian-releases && git remote set-url upstream https://github.com/obsidianmd/obsidian-releases.git', { stdio: 'pipe' });
	}
	
	// Fetch upstream and create branch
	console.log('  Fetching upstream...');
	execSync('cd /tmp/obsidian-releases && git fetch upstream master', { stdio: 'inherit' });
	
	console.log('  Creating branch...');
	execSync(`cd /tmp/obsidian-releases && git checkout -b ${branchName} upstream/master`, { stdio: 'inherit' });
	
	// Copy the updated file
	console.log('  Copying updated community-plugins.json...');
	execSync(`cp ${tempFile} /tmp/obsidian-releases/community-plugins.json`, { stdio: 'inherit' });
	
	// Commit and push
	console.log('  Committing changes...');
	execSync('cd /tmp/obsidian-releases && git add community-plugins.json', { stdio: 'inherit' });
	execSync(`cd /tmp/obsidian-releases && git commit -m "Add plugin: ${manifest.name}"`, { stdio: 'inherit' });
	
	console.log('  Pushing to fork...');
	execSync(`cd /tmp/obsidian-releases && git push -u origin ${branchName} --force`, { stdio: 'inherit' });
} catch (error) {
	console.error('Error during git operations:', error.message);
	process.exit(1);
}

console.log('');

// Create the pull request using the official template
console.log('Creating pull request...');
try {
	const prBody = `# I am submitting a new Community Plugin

- [x] I attest that I have done my best to deliver a high-quality plugin, am proud of the code I have written, and would recommend it to others. I commit to maintaining the plugin and being responsive to bug reports. If I am no longer able to maintain it, I will make reasonable efforts to find a successor maintainer or withdraw the plugin from the directory.

## Repo URL

Link to my plugin: https://github.com/yashasolutions/obsidian-gg-docs-importer

## Release Checklist
- [x] I have tested the plugin on
  - [x] Windows
  - [x] macOS
  - [x] Linux
  - [ ] Android _(if applicable)_
  - [ ] iOS _(if applicable)_
- [x] My GitHub release contains all required files (as individual files, not just in the source.zip / source.tar.gz)
  - [x] \`main.js\`
  - [x] \`manifest.json\`
  - [ ] \`styles.css\` _(optional)_
- [x] GitHub release name matches the exact version number specified in my manifest.json (_**Note:** Use the exact version number, don't include a prefix \`v\`_)
- [x] The \`id\` in my \`manifest.json\` matches the \`id\` in the \`community-plugins.json\` file.
- [x] My README.md describes the plugin's purpose and provides clear usage instructions.
- [x] I have read the developer policies at https://docs.obsidian.md/Developer+policies, and have assessed my plugin's adherence to these policies.
- [x] I have read the tips in https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines and have self-reviewed my plugin to avoid these common pitfalls.
- [x] I have added a license in the LICENSE file.
- [x] My project respects and is compatible with the original license of any code from other plugins that I'm using.
      I have given proper attribution to these other projects in my \`README.md\`.
`;

	// Write PR body to a temp file to avoid shell escaping issues
	writeFileSync('/tmp/pr-body.md', prBody);

	const prUrl = execSync(
		`gh pr create --repo obsidianmd/obsidian-releases --head ${username}:${branchName} --base master --title "Add plugin: ${manifest.name}" --body-file /tmp/pr-body.md`,
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
	execSync('rm -rf /tmp/obsidian-releases /tmp/community-plugins.json /tmp/pr-body.md', { stdio: 'ignore' });
} catch (error) {
	// Ignore cleanup errors
}
