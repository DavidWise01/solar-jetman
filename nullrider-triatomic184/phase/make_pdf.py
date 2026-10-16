from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from pathlib import Path
import json
root=Path(__file__).parent
r=json.loads((root/'results.json').read_text())
main=r['main']; nul=r['nullControl']; bad=r['assumptionViolation']; quota=main['exactTwoPercentBudget']
doc=SimpleDocTemplate(str(root/'NODE184_PHASE_BENCHMARK.pdf'),pagesize=(612,792),leftMargin=45,rightMargin=45,topMargin=40,bottomMargin=40)
styles=getSampleStyleSheet();styles.add(ParagraphStyle(name='KTitle',parent=styles['Title'],fontName='Helvetica-Bold',fontSize=18,leading=23,textColor=colors.HexColor('#146b5a'),spaceAfter=10));styles.add(ParagraphStyle(name='Sub',parent=styles['Normal'],fontSize=10,leading=15,textColor=colors.HexColor('#344955'),spaceAfter=9));styles.add(ParagraphStyle(name='Sm',parent=styles['Normal'],fontSize=8.5,leading=12,spaceAfter=6));styles.add(ParagraphStyle(name='Th',parent=styles['Heading2'],fontSize=11,textColor=colors.HexColor('#146b5a'),spaceBefore=8,spaceAfter=6));
story=[]
story.append(Paragraph('NULLRIDER / NODE 184',styles['KTitle']))
story.append(Paragraph('Counter-rotating toroids — reproducible synthetic inference A/B test  |  16 Oct 2026',styles['Sub']))
story.append(Paragraph('<b>Test question:</b> Does two-angle sensing (0°, 180°) outperform two stationary samples (0°, 0°), at the same observation budget and 2% average selection quota?',styles['Sm']))
story.append(Paragraph('Setup',styles['Th']))
story.append(Paragraph('Three 118-slot branches + 11 reserve = 365 cells. All observations pass Node 184. 100 paired seeds × 365 cells = 36,500 records; 25% masking of each legacy alarm/drift sensor. The observer is read-only. Input faults exist only as hidden simulator labels.',styles['Sm']))
story.append(Paragraph('Exact 2% quota (73 candidate selections every 10 independent scenarios)',styles['Th']))
rows=[['Metric','Stationary 0° / 0°','Spinning 0° / 180°'],['Selection budget','730','730'],['True faults selected',str(quota['stationaryHits']),str(quota['rotatingHits'])],['Selection precision',f"{100*quota['stationaryPrecision']:.2f}%",f"{100*quota['rotatingPrecision']:.2f}%"],['Recall among 3,507 faults',f"{100*quota['stationaryRecall']:.2f}%",f"{100*quota['rotatingRecall']:.2f}%"],['Brier score (lower better)',f"{main['brier']['stationary']:.5f}",f"{main['brier']['rotating']:.5f}"]]
t=Table(rows,colWidths=[195,155,155]); t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dae9e4')),('TEXTCOLOR',(0,0),(-1,0),colors.HexColor('#134e42')),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#bfd4ca')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f4f8f6')]),('FONTSIZE',(0,0),(-1,-1),8.5),('LEFTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.append(t)
story.append(Spacer(1,10));story.append(Paragraph(f"<b>Observed gain:</b> {quota['improvementInHits']} additional correct selections across 100 paired synthetic scenarios. Mean Brier improvement: {main['brier']['absoluteImprovement']:.5f}; approximate paired 95% CI [{main['brier']['CI95'][0]:.5f}, {main['brier']['CI95'][1]:.5f}].",styles['Sm']))
story.append(Paragraph('Adversarial controls',styles['Th']))
story.append(Paragraph(f"<b>No phase signal:</b> stationary and rotating are identical (Brier {nul['brier']['stationary']:.5f}).",styles['Sm']))
story.append(Paragraph(f"<b>Wrong phase assumption:</b> spinning Brier {bad['brier']['rotating']:.5f}, worse than stationary {bad['brier']['stationary']:.5f}; spinning correctly predicts fewer faults if the hypothesized sign reversal is absent.",styles['Sm']))
story.append(Paragraph('Validation and limitations',styles['Th']))
story.append(Paragraph('29 / 29 Node.js regression tests pass (15 original + 14 new). Population remains 365 / 365. All inference passes are read-only; no actual replacement policy was modified. Node 184 phase gate uses ±7.5° relative alignment, producing two 7.5°-wide angular windows per complete revolution (4.167% duty). This is separate from the exact 2% candidate quota.',styles['Sm']))
story.append(Paragraph('<b>Engineering conclusion:</b> Differential phase observations can help if faults genuinely change the signal across orientations. Spinning alone provides no information and an incorrect model actively harms inference. No physical toroid, quantum state, Planck-scale mechanism, or real-world sensor was tested.',styles['Sm']))

def footer(canvas,doc):
    canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#6b7280'));canvas.drawString(45,24,'NULLRIDER / reproducible symbolic software benchmark');canvas.drawRightString(566,24,str(doc.page))
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(root/'NODE184_PHASE_BENCHMARK.pdf')
