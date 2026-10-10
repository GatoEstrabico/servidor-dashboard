import assert from 'node:assert/strict';
import test from 'node:test';
import { getAlertAudioFile, getAlertAudioLibrary } from './alert-audio-library.js';

test('lista e serve o áudio padrão do projeto', async () => {
  const audios = await getAlertAudioLibrary();
  const defaultAudio = audios.find((audio) => audio.id === 'default');
  assert.equal(defaultAudio?.name, 'alert.mp3');
  assert.equal(defaultAudio?.url, '/audio/alert.mp3');

  const file = await getAlertAudioFile('default');
  assert.equal(file?.mimeType, 'audio/mpeg');
  assert.ok(file?.data.length);
});

test('não permite resolver IDs de áudio como caminhos', async () => {
  assert.equal(await getAlertAudioFile('../alert'), null);
});
