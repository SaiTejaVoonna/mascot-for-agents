"""Prepare the browser pack with Real SFX's uisfx, real-sound and earshot.

Run in the workspace audio-tools venv. See docs/THEATRE_AUDIO.md.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from scipy import signal


def read48(path):
    result = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                             '-map', '0:a:0', '-f', 'f32le', '-acodec', 'pcm_f32le',
                             '-ac', '2', '-ar', '48000', 'pipe:1'], capture_output=True, check=True)
    return np.frombuffer(result.stdout, dtype='<f4').reshape(-1, 2).copy()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skills-dir', type=Path, required=True)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--vocal-source', type=Path, required=True)
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[1] / 'theatre/assets/audio'
    output.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault('EARSHOT_HOME', str(args.skills_dir.parent / 'earshot-cache'))
    from earshot.features import measure
    spec = importlib.util.spec_from_file_location('real_sound_master', args.skills_dir / 'real-sound/scripts/master.py')
    master = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(master)
    pack = args.skills_dir / 'real-sfx/vendor/node_modules/uisfx'
    mapping = {'whoosh': 'swipe', 'pop': 'reaction', 'tap': 'press',
               'chime': 'notification', 'click': 'select', 'success': 'success'}
    measurements, assets = {}, {}
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    def encode(name, data):
        with tempfile.TemporaryDirectory(dir=output) as scratch:
            wav = Path(scratch) / 'prepared.wav'
            sf.write(wav, data, 48000, subtype='PCM_24')
            dest = output / f'{name}.mp3'
            subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav),
                            '-c:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', str(dest)], check=True)
        report = measure(read48(dest), light=True)
        if report.get('clipped_samples') or report.get('true_peak_dbtp', 0) > -1.5:
            raise RuntimeError(f'{name}: encoded asset exceeds peak headroom: {report}')
        measurements[name] = report
        return {'file': f'{name}.mp3', 'sha256': digest(dest), 'bytes': dest.stat().st_size,
                'durationSeconds': report['duration']}

    for name, cue in mapping.items():
        source = pack / f'sounds/zen/{cue}.mp3'
        data = read48(source)
        data -= data.mean(axis=0)
        peak = np.max(np.abs(data))
        if peak > 0:
            data *= min(1, 10 ** (-9 / 20) / peak)
        data = master.edge_fades(data, head=.003, tail=.012)
        item = encode(name, data)
        item.update({'source': f'uisfx 0.4.0 / zen / {cue}', 'license': 'CC0-1.0',
                     'creator': 'Yuki Capital / Romain Simon',
                     'sourceUrl': 'https://github.com/romainsimon/uisfx',
                     'sourceSha256': digest(source),
                     'edits': 'Mono duplicated to stereo when needed; DC removal; peak ceiling -9 dBFS; edge fades; MP3 encoding',
                     'kind': 'Produced UI cue (upstream synthesis, not a field recording)'})
        assets[name] = item

    source = args.source.resolve()
    if hashlib.sha1(source.read_bytes()).hexdigest() != '641163a91e9bd87d0f3f4d4b10e75b99f74afcec':
        raise RuntimeError('Fire recording differs from the Wikimedia source checksum.')
    fire = read48(source)[2 * 48000:22 * 48000]
    fire = signal.sosfilt(signal.butter(2, [80, 6500], btype='bandpass', fs=48000, output='sos'), fire, axis=0)
    fire, _ = master.finish(fire, lufs=-22, ceiling=.5, mono_hz=0, comp=False,
                            drive=0, air=0, hp_hz=0, end_fade=.01, tail_zero=0)
    # Overlap the tail with the head, preserving continuity across repeated cycles.
    overlap = 24000
    loop = fire[:-overlap].copy()
    phase = np.linspace(0, 1, overlap)[:, None]
    loop[:overlap] = fire[-overlap:] * np.cos(phase * np.pi / 2) + fire[:overlap] * np.sin(phase * np.pi / 2)
    item = encode('fireplace', loop)
    item.update({'source': 'Dry grass burning in open fireplace', 'creator': 'ezwa',
                 'license': 'Public domain (author dedication)',
                 'sourceUrl': 'https://commons.wikimedia.org/wiki/File:Dry_grass_burning_in_open_fireplace.ogg',
                 'sourceSha256': digest(source), 'kind': 'Field recording',
                 'edits': '2–22 s excerpt; 80–6500 Hz filtering; real-sound loudness preparation; 500 ms equal-power loop overlap; MP3 encoding'})
    assets['fireplace'] = item
    vocal = args.vocal_source.resolve()
    if digest(vocal) != '2a49243f228d192d59c1593d10b405dc6fcc77f472ede0ecc99fc6fffbc27a0b':
        raise RuntimeError('Vocal source differs from the licensed Freesound public preview.')
    data = read48(vocal)
    data -= data.mean(axis=0)
    peak = float(np.max(np.abs(data)))
    if peak:
        data *= 10 ** (-6 / 20) / peak
    data = master.edge_fades(data, head=.004, tail=.012)
    item = encode('hmm-female', data)
    item.update({'source': 'Hmm question.wav (public HQ MP3 preview)',
                 'creator': 'esperar', 'license': 'CC0-1.0', 'kind': 'Human vocal recording',
                 'sourceUrl': 'https://freesound.org/people/esperar/sounds/170768/',
                 'downloadUrl': 'https://cdn.freesound.org/previews/170/170768_377731-hq.mp3',
                 'sourceSha256': digest(vocal),
                 'edits': '48 kHz stereo decode; DC removal; -6 dBFS peak; short edge fades; MP3 encoding',
                 'note': 'Separate performer from Kokoro voices; not voice-matched or cloned.'})
    assets['hmm-female'] = item
    report = {'scope': 'Individual encoded assets only; not a rendered dialogue mix or listening judgment.',
              'engine': 'earshot 0.4.0 features.measure(light=True), no analysis models',
              'preparation': 'real-sound master.py and Real SFX bundled uisfx 0.4.0',
              'measurements': measurements}
    (output / 'measurements.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    (output / 'manifest.json').write_text(json.dumps({'version': 1, 'assets': assets}, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({name: {'duration': item['duration'], 'peakDbTP': item['true_peak_dbtp'],
                            'clippedSamples': item['clipped_samples']} for name, item in measurements.items()}, indent=2))


if __name__ == '__main__':
    main()
