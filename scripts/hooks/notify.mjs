// Notification: play a short system sound when Claude needs a decision.
import { spawnSync } from 'node:child_process';

if (process.platform === 'win32') {
  spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      '[System.Media.SystemSounds]::Exclamation.Play(); Start-Sleep -Milliseconds 700',
    ],
    { stdio: 'ignore' },
  );
} else if (process.platform === 'darwin') {
  spawnSync('afplay', ['/System/Library/Sounds/Glass.aiff'], { stdio: 'ignore' });
} else {
  process.stdout.write('\u0007');
}
process.exit(0);
