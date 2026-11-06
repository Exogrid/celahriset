// Run with: node docs/engine/exovir-gap-engine.test.mjs
// Synthetic fixtures only; no claim is based on real scholarly articles.
import {buildSearchPlan, discoverGapSeeds, evaluateCandidate, runDiscovery} from './exovir-gap-engine.mjs';
function assert(label, ok){if(!ok)throw new Error('FAIL '+label);console.log('PASS '+label);}
const study={id:'S1',kind:'study',doi:'10.0000/synthetic',reviewed:true,relevant:true,claimSpan:'Isi klaim yang diverifikasi',claimLocator:'halaman 4'};
const problem={id:'P1',kind:'problem',url:'https://example.org/synthetic',reviewed:true,relevant:true,claimSpan:'Indikator dari data',claimLocator:'tabel 2'};
const nearest={evidenceId:'S1',reviewed:true,equivalence:'distinct',comparison:'Menguji mekanisme yang berbeda'};
const valid={id:'C1',claim:'Hipotesis mekanisme baru',route:'hybrid',supportIds:['S1','P1'],nearestStudies:[nearest],
 contribution:{kind:'theoretical',claim:'Menjelaskan mekanisme',baseline:'Teori lama',mechanismOrAssumption:'Asumsi penjelas'},
 method:{design:'longitudinal',outcome:'outcome terukur',analysisPlan:'regresi preregistrasi',validityReviewed:true},
 feasibility:{dataAccess:'verified',resourcesReviewed:true,ethicsReviewed:true},
 antithesis:{completed:true,humanReviewed:true,queries:['synonym counter-search'],resolution:'Bantahan ditinjau'}
};
const ctx={theme:'Keputusan studi lanjut',evidence:[study,problem],candidates:[valid],coverageAssessed:true,
 searchLog:[{source:'OpenAlex',query:'career decision',searchedAt:'2026-11-06',screenedCount:12}]};
assert('01 - kueri berlapis',buildSearchPlan(ctx).queries.length===5);
assert('02 - kandidat lengkap hanya PROVISIONAL',evaluateCandidate(valid,ctx).status==='PROVISIONAL');
assert('03 - nol bukti => INSUFFICIENT',evaluateCandidate(valid,{...ctx,evidence:[]}).status==='INSUFFICIENT_EVIDENCE');
assert('04 - bukti problem tanpa studi => INSUFFICIENT',evaluateCandidate({...valid,supportIds:['P1']},ctx).status==='INSUFFICIENT_EVIDENCE');
assert('05 - DOI metadata saja bukan bukti',evaluateCandidate(valid,{...ctx,evidence:[{...study,claimLocator:''},problem]}).status==='INSUFFICIENT_EVIDENCE');
assert('06 - duplikasi substantif => REJECTED',evaluateCandidate({...valid,nearestStudies:[{...nearest,equivalence:'equivalent'}]},ctx).status==='REJECTED');
assert('07 - lokasi saja => REJECTED',evaluateCandidate({...valid,contribution:{...valid.contribution,kind:'location_only'}},ctx).status==='REJECTED');
assert('08 - kueri tidak tercatat => INSUFFICIENT',evaluateCandidate(valid,{...ctx,searchLog:[]}).status==='INSUFFICIENT_EVIDENCE');
assert('09 - review antitesis belum selesai => INSUFFICIENT',evaluateCandidate({...valid,antithesis:{...valid.antithesis,humanReviewed:false}},ctx).status==='INSUFFICIENT_EVIDENCE');
assert('10 - gap seed hanya hipotesis',discoverGapSeeds({...ctx,evidence:[{...study,gapSignals:['inconsistent_information']}]}).every(x=>x.status==='HYPOTHESIS_UNVERIFIED'));
assert('11 - runner tidak mengklaim produksi',runDiscovery(ctx).status==='REFERENCE_ONLY_NOT_PRODUCTION');
console.log('11/11 unit tests passed (synthetic fixtures, not scientific benchmark).');
