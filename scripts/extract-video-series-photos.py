#!/usr/bin/env python3
"""Re-extract reviewed video crops: python scripts/extract-video-series-photos.py SOURCE_DIR.
Requires ffmpeg and the four original, unmodified uploads. Checks each SHA-256 before writing.
The reviewed recipes and assembly actions are in docs/video-series-transcript.json.
"""
import pathlib,sys,json,hashlib,subprocess
root=pathlib.Path(__file__).resolve().parent.parent
source=pathlib.Path(sys.argv[1]).resolve()
photos=json.loads((root/'src/videoSeriesPhotos.json').read_text())
recipes=json.loads((root/'public/recipes.json').read_text())['recipes']
checked=set()
for rid,p in photos.items():
    r=next(r for r in recipes if r['id']==rid)
    video=source/r['source']['file']
    if video not in checked:
        if hashlib.sha256(video.read_bytes()).hexdigest()!=r['source']['sha256']:raise ValueError('Source checksum mismatch: '+video.name)
        checked.add(video)
    target=root/'public'/p['file']
    target.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-threads','1','-ss',str(p['frameSeconds']),'-i',str(video),'-vf','crop='+p['crop'],'-frames:v','1','-c:v','libwebp','-quality','88','-y',str(target)],check=True)
    p['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
(root/'src/videoSeriesPhotos.json').write_text(json.dumps(photos,ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(photos),'reviewed video crops')
