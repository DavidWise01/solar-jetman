/* MADRE PRIME / solar-system: scoped observable influence catalog and toy environment.
 * NOT a climate, mutagenesis, stellar evolution, or ecology predictive model.
 * Read-only; logical Node 184 is caller-validated but not cryptographic authentication.
 */
export const NODE=184, MADRE=366, BRANCHES=3, PER_BRANCH=122;
export const MATTER_COST=(3*3)**3; // 729 SYMBOLIC units, not measured diatom biomass
export const SOLAR_FLUX_1AU=1361; // NASA approximate TOA total solar irradiance in W/m²
const entry=(name,group,tier,path,scope,notes)=>Object.freeze({name,group,tier,path,scope,notes});
export const CATALOG=Object.freeze([
 // Source: core nuclear, stellar life cycle, electromagnetism & particles.
 entry('Core proton–proton fusion','SUN','major','source','direct','Dominant solar power source; hydrogen to helium, not fission'),
 entry('CNO fusion side contribution','SUN','minor','source','indirect','Small contribution in the present Sun'),
 entry('Thermal plasma / photon transport','SUN','major','source','direct','Energy diffuses outward before leaving the photosphere'),
 entry('Solar photosphere and emission spectrum','SUN','major','source','direct','UV, visible, near-IR, thermal IR; spectral output matters'),
 entry('Solar luminosity and mass loss','SUN','major','source','direct','Radiation and solar wind remove mass on distinct rates'),
 entry('Long-term stellar brightening','SUN','major','source','indirect','Core evolves on billion-year scales'),
 entry('Sunspot / 11-year activity cycle','SUN','major','source','direct','TSI ~0.1% over cycle; spectral UV can change more'),
 entry('22-year magnetic polarity cycle','SUN','minor','source','indirect','Magnetic orientation returns after two sunspot cycles'),
 entry('Solar rotation and active regions','SUN','minor','source','direct','Approximate 27-day apparent rotation; latitude dependent'),
 entry('Flares and X-rays','SUN','major','source','indirect','Bursts can affect upper atmosphere; surface biology shielded'),
 entry('Coronal mass ejections','SUN','major','source','indirect','Magnetized plasma causes space-weather disturbances'),
 entry('Solar energetic particles','SUN','major','source','indirect','Charged-particle radiation, mostly screened at ground'),
 entry('Solar wind / Parker spiral','SUN','major','transport','indirect','Heliospheric magnetized outflow'),
 entry('Solar neutrinos','SUN','minor','source','negligible','Fusion byproduct; minimal interaction with biota'),
 entry('Natural trace radioactive decay','SUN','minor','source','negligible','Not a meaningful power source compared with fusion'),
 entry('Sustained nuclear fission','SUN','minor','source','negligible','Not a meaningful solar energy source'),
 entry('Solar gravity','SUN','major','orbit','indirect','Dominant force maintaining planetary orbits'),
 // 8 planets are categories in inventory; not eight actual stellar phases.
 entry('Mercury','PLANETS','minor','orbit','indirect','Inner rocky world; no material contribution to Earth sunlight'),
 entry('Venus','PLANETS','minor','orbit','indirect','Rocky neighbor and comparative greenhouse-atmosphere case'),
 entry('Earth','PLANETS','major','habitat','direct','Only confirmed inhabited world; atmosphere, ocean, shields'),
 entry('Mars','PLANETS','minor','orbit','indirect','Comparative thin CO2 atmosphere and geologic history'),
 entry('Jupiter','PLANETS','major','orbit','indirect','Large gravitational perturber of long-term Solar System dynamics'),
 entry('Saturn','PLANETS','major','orbit','indirect','Gravitational perturbations contribute to orbital cycles'),
 entry('Uranus','PLANETS','minor','orbit','indirect','Ice giant; distant and not direct driver of terrestrial mutation'),
 entry('Neptune','PLANETS','minor','orbit','indirect','Ice giant, outer resonances and Kuiper-belt dynamics'),
 // Named IAU recognized dwarf planets.
 ...['Ceres','Pluto','Haumea','Makemake','Eris'].map(name=>entry(name,'DWARF PLANETS','minor','orbit','indirect','Recognized dwarf planet; tracked, not counted among 8 planets')),
 entry('Earth Moon','MOONS','major','habitat','indirect','Tides and ocean mixing; solar/lunar combined tides'),
 entry('Other natural satellites','MOONS','minor','orbit','indirect','Hundreds of planetary and dwarf-planet moons'),
 entry('Planetary rings','SMALL BODIES','minor','orbit','indirect','Ring systems around giant planets; not extra suns'),
 entry('Main asteroid belt','SMALL BODIES','minor','orbit','indirect','Impact-source reservoir over very long times'),
 entry('Comets','SMALL BODIES','minor','orbit','indirect','Ices, dust, rare impacts and delivery hypotheses'),
 entry('Meteoroids and impacts','SMALL BODIES','major','habitat','episodic','Rare major impacts can strongly alter climate and life'),
 entry('Interplanetary dust','SMALL BODIES','minor','transport','indirect','Zodiacal-light scatter and sparse atmospheric influx'),
 entry('Kuiper belt and TNOs','SMALL BODIES','minor','orbit','indirect','Outer reservoir beyond Neptune'),
 entry('Oort Cloud candidate reservoir','SMALL BODIES','minor','orbit','uncertain','Inferred distant comet reservoir, not directly imaged'),
 // Motion and environmental filters near Earth.
 entry('Sun–Earth distance / inverse square','EARTH FILTERS','major','orbit','direct','Top-of-atmosphere irradiance approximately 1/r²'),
 entry('Earth rotation / day-night','EARTH FILTERS','major','habitat','direct','Diurnal light dose and local photoperiod'),
 entry('Axial tilt / seasons','EARTH FILTERS','major','orbit','direct','Latitude and seasonal insolation distribution'),
 entry('Orbital eccentricity','EARTH FILTERS','major','orbit','indirect','~100k-year evolution and annual distance variation'),
 entry('Orbital precession','EARTH FILTERS','minor','orbit','indirect','Seasonal timing / 19–23k year forcing'),
 entry('Obliquity variation','EARTH FILTERS','minor','orbit','indirect','~41k-year axial tilt variation'),
 entry('Earth magnetosphere','EARTH FILTERS','major','shield','indirect','Charged-particle deflection varies by latitude'),
 entry('Upper atmosphere / ionosphere','EARTH FILTERS','minor','shield','indirect','X-ray/EUV and energetic-particle interactions'),
 entry('Ozone absorption','EARTH FILTERS','major','shield','direct','Blocks UVC and most UVB reaching surface'),
 entry('Atmospheric scattering / aerosols','EARTH FILTERS','major','shield','direct','Spectrally changes sunlight at surface'),
 entry('Clouds and weather','EARTH FILTERS','major','shield','direct','Short-term surface illumination and rainfall changes'),
 entry('Greenhouse gases / heat transport','EARTH FILTERS','major','habitat','indirect','Climate temperature, not an extra solar radiation source'),
 entry('Ice / ocean albedo','EARTH FILTERS','major','habitat','indirect','Reflectance feedback; habitat regulation'),
 entry('Lunar and solar tides','EARTH FILTERS','major','habitat','indirect','Coastal mixing, exposure, nutrients'),
 entry('Ocean depth and turbidity','EARTH FILTERS','major','shield','direct','Wavelength-dependent underwater attenuation'),
 entry('Ocean currents and upwelling','EARTH FILTERS','major','habitat','direct','Transport nutrients to illuminated waters'),
 entry('Volcanic aerosols','EARTH FILTERS','minor','shield','episodic','Short-term illumination impacts in major eruptions'),
 // Boundary flux originates outside Solar System but is filtered by Sun/Earth.
 entry('Heliospheric cosmic-ray modulation','BOUNDARY','major','transport','indirect','Heliosphere modulates incoming galactic cosmic rays'),
 entry('Galactic cosmic rays','BOUNDARY','major','external','external-origin','Enter our Solar System from beyond; not produced by Sun'),
 entry('Interstellar magnetic environment','BOUNDARY','minor','external','external-origin','Solar wind interacts with surrounding interstellar medium'),
 // Daughter / biology.
 entry('Photosynthetically active radiation','DIATOM','major','biology','direct','~400–700 nm visible light supports photosynthesis'),
 entry('UVB and UVA exposure','DIATOM','major','biology','direct','UVB can induce DNA lesions; UVA promotes oxidative stress'),
 entry('DNA repair and cellular shielding','DIATOM','major','biology','direct','Damage is not identical to fixed inherited mutation count'),
 entry('Dissolved inorganic carbon','DIATOM','major','biology','direct','Carbon source for photosynthetic growth'),
 entry('Dissolved silica / frustule','DIATOM','major','biology','direct','Silica cell wall requires dissolved silicon'),
 entry('Nitrogen and phosphorus','DIATOM','major','biology','direct','Macronutrients limit growth'),
 entry('Iron and trace nutrients','DIATOM','major','biology','direct','Micronutrient limitation in some habitats'),
 entry('Temperature / pH / salinity','DIATOM','major','biology','direct','Environmental tolerance depends on species'),
 entry('Predation, infection, competition','DIATOM','minor','biology','direct','Population loss and selection independent of solar output'),
 entry('Two-daughter mitotic division','DIATOM','major','biology','direct','A parent can produce 2 daughters, using frustule halves'),
 entry('Cell-size diminution','DIATOM','major','biology','direct','Often reduces mean cell size over repeated divisions'),
 entry('Auxospore size restoration','DIATOM','major','biology','direct','Sexual/restorative stages exist; species dependent'),
 entry('Leap year / calendar convention','OBSERVATION','minor','time','noncausal','Calendar 365/366 is not an organism-triggered wake rule'),
 entry('8-bin solar-cycle sampling','OBSERVATION','minor','time','symbolic','8 observational bins; not 8 stars or 8 nuclear states'),
 entry('Madre Prime 366/3','OBSERVATION','minor','symbolic','symbolic','3×122 tower addresses, 365 operational slots plus 0 anchor'),
]);
export const GROUPS=Object.freeze([...new Set(CATALOG.map(c=>c.group))]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function readSolar184(request){
 if(!request||request.via!==NODE||request.op!=='SOLAR_VIEW')return {accepted:false,error:'NODE_184_SOLAR_VIEW_REQUIRED'};
 const {phase=0, distanceAu=1, depthMeters=1,waterAttenuation=0.2, lightTransmission=0.75,
  uvbRelative=1,uvbTransmission=0.1,uvbAttenuation=0.5, material=5832, mature=8,
  nitrogen=1,phosphorus=1,silica=1,iron=1,carbon=1}=request;
 const args={phase,distanceAu,depthMeters,waterAttenuation,lightTransmission,uvbRelative,uvbTransmission,uvbAttenuation,material,mature,nitrogen,phosphorus,silica,iron,carbon};
 if(Object.values(args).some(v=>typeof v!=='number'||!Number.isFinite(v))||!Number.isInteger(phase)||phase<0||phase>7||distanceAu<=0||distanceAu>50||depthMeters<0||depthMeters>200||waterAttenuation<0||waterAttenuation>5||lightTransmission<0||lightTransmission>1||uvbRelative<0||uvbRelative>10||uvbTransmission<0||uvbTransmission>1||uvbAttenuation<0||uvbAttenuation>5||!Number.isSafeInteger(material)||material<0||material>1e9||!Number.isSafeInteger(mature)||mature<0||mature>1e6||[nitrogen,phosphorus,silica,iron,carbon].some(v=>v<0||v>1))return {accepted:false,error:'INVALID_OBSERVATION_RANGE'};
 const cycleUnit=Math.cos((2*Math.PI*phase)/8);
 const cycleTotalMultiplier=1+0.0005*cycleUnit; // 0.1% peak/trough illustrative
 const flux=SOLAR_FLUX_1AU*cycleTotalMultiplier/(distanceAu**2);
 const underwaterPAR=flux*0.43*lightTransmission*Math.exp(-waterAttenuation*depthMeters);
 const uvbProxy=(1+0.25*cycleUnit)*uvbRelative*uvbTransmission/(distanceAu**2)*Math.exp(-uvbAttenuation*depthMeters);
 const nutrientFactor=Math.min(nitrogen,phosphorus,silica,iron,carbon);
 const reproductionEvents=Math.min(mature,Math.floor(material/MATTER_COST),underwaterPAR>=25&&nutrientFactor>=0.2?1e6:0);
 return {accepted:true,readonly:true,via:NODE,phase,solar:{distanceAu,cycleTotalMultiplier,topOfAtmosphereWm2:flux,illustrativeUnderwaterPARWm2:underwaterPAR,relativeUVBExposureProxy:uvbProxy},
  diatom:{reproductionEvents,illustrativeDaughters:2*reproductionEvents,remainingSymbolicMaterial:material-MATTER_COST*reproductionEvents,limitingNutrientFactor:nutrientFactor,biologicalPrediction:false},
  torre:{base:MADRE,branches:BRANCHES,perBranch:PER_BRANCH,coreCells:365,structuralAnchor:1,materialPerEvent:MATTER_COST},
  disclaimers:['UVB proxy is not a mutation rate or dose','729 material units and reproduction threshold are user-symbolic and hypothetical','Eight phase bins are NOT physical fusion stages','Sunlight cannot substitute for matter','No cells are created or renewed in this read-only observer']};
}
export function catalogSummary(){return {count:CATALOG.length,major:CATALOG.filter(x=>x.tier==='major').length,minor:CATALOG.filter(x=>x.tier==='minor').length,groups:GROUPS.map(group=>({group,count:CATALOG.filter(x=>x.group===group).length}))};}
