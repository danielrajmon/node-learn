const fs = require('fs');
const { execSync } = require('child_process');

try {
  const commitCount = execSync('git rev-list --count HEAD').toString().trim();
  const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  const commitDate = execSync('git log -1 --format=%cd --date=short').toString().trim();

  const version = {
    commitCount,
    commitHash,
    commitDate,
    version: `v${commitCount}-${commitHash}`,
    fullVersion: `Version ${commitCount} (${commitHash}) - ${commitDate}`
  };

  const outputPath = './src/version.json';
  fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));
  console.log('Version file generated:', version.fullVersion);
} catch (error) {
  console.error('Error generating version:', error.message);
  // Create a fallback version file
  const fallbackVersion = {
    commitCount: '0',
    commitHash: 'unknown',
    commitDate: new Date().toISOString().split('T')[0],
    version: 'v0-unknown',
    fullVersion: 'Version unknown'
  };
  fs.writeFileSync('./src/version.json', JSON.stringify(fallbackVersion, null, 2));
}
