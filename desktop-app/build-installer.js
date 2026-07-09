const winstaller = require('electron-winstaller');
const path = require('path');

async function build() {
  console.log('Compiling standalone Windows installer...');
  try {
    await winstaller.createWindowsInstaller({
      appDirectory: path.join(__dirname, 'release/VanguarDZ-win32-x64'),
      outputDirectory: path.join(__dirname, 'release/installer'),
      authors: 'VanguarDZ Team',
      exe: 'VanguarDZ.exe',
      setupExe: 'VanguarDZ-Setup.exe',
      noMsi: true,
      description: 'VanguarDZ - Typing Space Action Game'
    });
    console.log('Installer created successfully at desktop-app/release/installer/VanguarDZ-Setup.exe!');
  } catch (e) {
    console.error('Installer build failed:', e.message);
  }
}

build();
