"""Human-observed exterior silhouette annotation. Never derived from model pixels.

Purpose: separate white paving from poster background in the reference. The
original remains the authority for all appearance/feature reviews. Boundary
uncertainty is ~5-12 source pixels around foliage; never claims segmentation truth.
"""
import json,sys
from pathlib import Path
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'forge/stage1_intake'))
from build_detail_inventory import write_png_rgb, read_png
# Clock tower -> rear roof and trees -> right rim -> front plinth -> left trees -> roof.
points=[(878,39),(950,83),(961,88),(961,100),(944,110),(943,208),(962,201),(996,206),(998,221),(1034,226),(1073,215),(1115,221),(1125,258),(1158,269),(1168,254),(1190,250),(1203,266),(1220,275),(1217,295),(1250,302),(1284,309),(1293,336),(1314,325),(1335,330),(1348,355),(1338,381),(1373,370),(1397,387),(1417,408),(1415,432),(1440,428),(1457,454),(1463,475),(1483,495),(1477,522),(1495,545),(1503,577),(1516,590),(1517,611),(1531,625),(1536,647),(1534,677),(1516,710),(1487,747),(1457,782),(1401,828),(1300,899),(1248,920),(1200,932),(1150,930),(1054,916),(971,904),(827,886),(774,892),(710,885),(524,850),(495,832),(339,802),(313,783),(142,744),(112,734),(98,720),(96,676),(107,654),(141,638),(177,602),(236,564),(265,546),(271,522),(293,500),(330,501),(346,481),(316,461),(315,441),(329,423),(347,402),(351,381),(369,363),(365,338),(384,318),(407,320),(413,300),(413,282),(431,270),(437,256),(458,248),(481,252),(496,268),(513,250),(511,231),(527,219),(544,219),(544,211),(567,204),(583,206),(606,213),(664,224),(683,220),(682,201),(721,186),(722,180),(743,177),(770,181),(769,194),(790,197),(790,112),(774,109),(773,96),(806,83),(840,60)]
w,h=1672,941
pixels=[(255,255,255)]*(w*h)
for y in range(h):
    intersections=[]
    for i,(x1,y1) in enumerate(points):
        x2,y2=points[(i+1)%len(points)]
        if (y1<=y<y2) or (y2<=y<y1):intersections.append(x1+(y-y1)*(x2-x1)/(y2-y1))
    intersections.sort()
    for a,b in zip(intersections[::2],intersections[1::2]):
        for x in range(max(0,int(a)),min(w,int(b)+1)):pixels[y*w+x]=(80,80,80)
write_png_rgb(R/'evidence/reference-silhouette.png',w,h,pixels)
spec=json.loads((R/'object-sculpt-spec.json').read_text(encoding='utf-8'))
_,_,source=read_png(Path(spec['sourceImage']))
isolated=[source[i][:3] if p==(80,80,80) else (255,255,255) for i,p in enumerate(pixels)]
write_png_rgb(R/'evidence/reference-isolated.png',w,h,isolated)
(R/'evidence/reference-silhouette-annotation.json').write_text(json.dumps({'source':'user reference','method':'manual observation of exterior perimeter, independent of model','points':points,'limitation':'Exterior-envelope only, ignores interior structure; original image and turntable required'},indent=2),encoding='utf-8')
