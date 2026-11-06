// EXOVIR Evidence-Gap Core, reference-only; not a live literature-retrieval service.
// Plain ES module. No third-party dependencies. No API credentials. Evidence is supplied by trusted upstream connectors and reviewers.
export function buildSearchPlan({theme,synonyms=[],exclusions=[],languages=["id","en"]}={}){
  if(!String(theme||"").trim()) throw new Error("theme wajib diisi");
  const terms=[theme,...synonyms].map(x=>String(x||"").trim()).filter(Boolean);
  const uq=[...new Set(terms.map(x=>x.toLowerCase()))];
  const extra=exclusions.map(x=>String(x).trim()).filter(Boolean);
  const orGroup="("+uq.map(t=>`"${t.replace(/"/g,"")}"`).join(" OR ")+")";
  return {
    theme, languages, generatedAt:null,
    queries:[
      {purpose:"core",query:orGroup},
      {purpose:"prior_art",query:`${orGroup} AND (study OR trial OR survey OR model OR instrument OR evaluation)`},
      {purpose:"systematic_reviews",query:`${orGroup} AND ("systematic review" OR "meta-analysis" OR "scoping review")`},
      {purpose:"contradictions",query:`${orGroup} AND (contradictory OR inconsistent OR replication OR null OR limitation)`},
      {purpose:"problem_evidence",query:`${orGroup} AND (policy OR indicator OR prevalence OR implementation OR evaluation)`}
    ].map(q=>({...q,exclusions:extra})),
    requirements:["Catat database, versi kueri, tanggal, jumlah hasil/screening/inklusi dan strategi snowballing","Pisahkan DOI/metadata dari klaim substantif terverifikasi","Periksa sinonim konsep, definisi operasional, istilah dalam bahasa lain, dan nearest prior art"]
  };
}
export function verifiedEvidence(r){
  return Boolean(r&&r.id&&["study","problem","policy","dataset","review"].includes(r.kind)&&(r.doi||r.url)&&r.reviewed===true&&String(r.claimSpan||"").trim()&&String(r.claimLocator||"").trim()&&r.relevant===true);
}
export function discoverGapSeeds({evidence=[]}={}){
  const allowed=new Set(["insufficient_information","biased_information","inconsistent_information","wrong_information","assumption_challenge","hidden_link","solution_failure"]);
  return evidence.filter(verifiedEvidence).flatMap(r=>(Array.isArray(r.gapSignals)?r.gapSignals:[]).filter(v=>allowed.has(v)).map(v=>({route:["solution_failure"].includes(v)?"problem":"sota",gapType:v,evidenceIds:[r.id],claim:`Hipotesis gap ${v} dari ${r.id}`,status:"HYPOTHESIS_UNVERIFIED",note:"Sinyal berbasis bukti, belum lolos prior-art search maupun uji kontribusi."})));
}
export function evaluateCandidate(candidate={},ctx={}){
  const evidence=Array.isArray(ctx.evidence)?ctx.evidence:[];
  const indexed=new Map(evidence.map(x=>[x.id,x]));
  const req=(Array.isArray(candidate.supportIds)?candidate.supportIds:[]).map(id=>indexed.get(id)).filter(Boolean);
  const relevant=req.filter(verifiedEvidence);
  const nearest=Array.isArray(candidate.nearestStudies)?candidate.nearestStudies:[];
  const searchLog=Array.isArray(ctx.searchLog)?ctx.searchLog:[];
  const c=candidate.contribution||{},m=candidate.method||{},f=candidate.feasibility||{},a=candidate.antithesis||{};
  const gates=[];
  const add=(id,pass,reason,evidenceIds=[])=>gates.push({gate:id,pass,reason,evidenceIds});
  const route=["sota","problem","hybrid"].includes(candidate.route)?candidate.route:null;
  add("G1",Boolean(String(candidate.claim||"").trim()&&route&&relevant.length>0&&(route==="sota"||req.some(r=>r&&r.kind==="problem"&&verifiedEvidence(r)))),"Klaim, jalur dan bukti relevan dengan kutipan+locator terverifikasi wajib ada.",relevant.map(r=>r.id));
  add("G2",Boolean(ctx.coverageAssessed===true&&searchLog.length>0&&searchLog.every(l=>l.source&&l.query&&l.searchedAt&&Number.isInteger(l.screenedCount)&&l.screenedCount>=0)),"Log pencarian dapat direproduksi dan cakupan telah dinilai. Tidak ada ambang jumlah paper yang membuktikan novelty.");
  const equivalent=nearest.some(p=>p.equivalence==="equivalent"&&p.reviewed===true&&p.evidenceId&&indexed.has(p.evidenceId));
  const priorReviewed=nearest.length>0&&nearest.every(p=>p.evidenceId&&indexed.has(p.evidenceId)&&p.reviewed===true&&p.comparison&&["distinct","equivalent"].includes(p.equivalence)&&verifiedEvidence(indexed.get(p.evidenceId)));
  add("G3",priorReviewed&&!equivalent,"Pembanding substantif terdekat harus ditelaah; ekuivalensi membatalkan klaim novelty.",nearest.map(p=>p.evidenceId).filter(Boolean));
  const localOnly=["location_only","population_only","renaming_only"].includes(c.kind)&&!String(c.theoreticalJustification||"").trim();
  add("G4",Boolean(c.kind&&!localOnly),"Perubahan lokasi/populasi/istilah saja tidak cukup; diperlukan justifikasi kontribusi ilmiah.");
  add("G5",Boolean(String(c.claim||"").trim()&&String(c.baseline||"").trim()&&String(c.mechanismOrAssumption||"").trim()),"Nyatakan kontribusi, pembanding ilmiah, dan mekanisme atau asumsi yang diuji.");
  add("G6",Boolean(m.design&&m.outcome&&m.analysisPlan&&m.validityReviewed===true),"Rancangan, outcome, rencana analisis dan penilaian validitas harus tersedia.");
  add("G7",Boolean(f.dataAccess==="verified"&&f.resourcesReviewed===true&&f.ethicsReviewed===true),"Akses data, sumber daya dan etik diverifikasi.");
  add("G8",Boolean(a.completed===true&&a.humanReviewed===true&&Array.isArray(a.queries)&&a.queries.length>0&&String(a.resolution||"").trim()),"Pencarian antitesis terlog, risiko ditangani, dan penilaian manusia ada.");
  const hardReasons=[];
  if(equivalent)hardReasons.push("EQUIVALENT_PRIOR_ART");
  if(localOnly)hardReasons.push("COSMETIC_DIFFERENCE");
  const status=hardReasons.length?"REJECTED":gates.every(g=>g.pass)?"PROVISIONAL":"INSUFFICIENT_EVIDENCE";
  const blockers=gates.filter(g=>!g.pass).map(g=>g.gate);
  return {id:candidate.id||null,claim:candidate.claim||"",status,blockers,hardReasons,gates,validSupportingEvidence:relevant.map(r=>r.id),disclaimer:"PROVISIONAL bukan sertifikat kebaruan. Metadata/DOI saja tidak memvalidasi isi klaim, dan penilaian manusia tetap wajib."};
}
export function runDiscovery(input={}){
  return {engine:"EXOVIR Evidence-Gap Core reference v0.1",status:"REFERENCE_ONLY_NOT_PRODUCTION",queryPlan:buildSearchPlan(input),gapSeeds:discoverGapSeeds(input),evaluations:(input.candidates||[]).map(c=>evaluateCandidate(c,input)),limits:["Tanpa konektor retrieval dan pembacaan full-text, mesin ini tidak menghasilkan novelty dari tema saja.","Persamaan semantik, ABC link prediction, NLI dan bibliometrik harus diisi dari komponen eksternal yang terkalibrasi, bukan disimulasikan sebagai verifikasi.","Keputusan novelty final memerlukan reviewer ahli dan audit korpus."]};
}
