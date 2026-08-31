import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'forge/stage4_review'))
from diagnose_render import load_mask,bbox_of,silhouette_iou
sys.path.insert(0,str(ROOT.parent/'forge/stage1_intake'))
from build_detail_inventory import write_png_rgb
s=json.loads((ROOT/'object-sculpt-spec.json').read_text(encoding='utf-8'))
a,_=load_mask(Path(s['sourceImage']));b,_=load_mask(ROOT/'evidence/blockout/match.png')
print('reference',bbox_of(a),'render',bbox_of(b),'iou',silhouette_iou(a,b))
out=[]
for x,y in zip(a,b):out.append((130,130,130) if x and y else (230,60,70) if x else (50,130,230) if y else (255,255,255))
write_png_rgb(ROOT/'evidence/mask-overlay.png',224,224,out)
