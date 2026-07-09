// A structured dictionary of official English words of different lengths
// Split into Common (daily used) and Rare (uncommon/technical) lists
// to weight the spawner towards high-frequency terms while keeping variety.

export const WORDS_SIMPLE_COMMON = [
  'cat', 'dog', 'run', 'net', 'sun', 'sky', 'fly', 'car', 'box', 'cup', 'red', 'blue', 'win', 'map', 'hat', 'cap',
  'pen', 'key', 'log', 'tag', 'bag', 'ice', 'fox', 'gas', 'war', 'day', 'boy', 'guy', 'job', 'man', 'law', 'art',
  'bus', 'fit', 'fix', 'hot', 'cold', 'bad', 'good', 'new', 'old', 'get', 'let', 'set', 'put', 'try', 'use', 'add',
  'one', 'two', 'six', 'ten', 'yes', 'not', 'out', 'off', 'our', 'own', 'who', 'why', 'how', 'see', 'saw', 'eat',
  'tea', 'pot', 'pan', 'pin', 'zip', 'raw', 'dry', 'wet', 'oil', 'fat', 'dig', 'cut', 'mix', 'bit', 'box', 'tab',
  'win', 'alt', 'esc', 'del', 'end', 'cap', 'num'
];

export const WORDS_SIMPLE_RARE = [
  'cpu', 'gpu', 'ram', 'usb', 'bot', 'hub', 'gem', 'hex', 'bin', 'cmd', 'sys', 'ray', 'web', 'dot', 'pad', 'bug',
  'dns', 'ssl', 'mac', 'ip', 'lan', 'wan', 'db', 'sql', 'git', 'cli', 'api', 'dev', 'ops', 'sec', 'nil', 'null',
  'nan', 'var', 'int', 'str', 'len', 'prt', 'scr', 'usr', 'pwd', 'ssh', 'ftp', 'url', 'uri', 'dom', 'ion', 'ore',
  'arc', 'pod', 'coda', 'crux'
];

export const WORDS_MEDIUM_COMMON = [
  'about', 'above', 'actor', 'admit', 'adopt', 'adult', 'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album',
  'alert', 'alike', 'alive', 'allow', 'alone', 'along', 'alter', 'among', 'anger', 'angle', 'angry', 'apart', 'apple',
  'apply', 'arena', 'argue', 'arise', 'arrow', 'aside', 'asset', 'avoid', 'award', 'aware', 'awful', 'badly', 'baker',
  'bases', 'basic', 'basin', 'basis', 'beach', 'beard', 'beast', 'begin', 'being', 'below', 'bench', 'birth', 'black',
  'blade', 'blame', 'blind', 'block', 'blood', 'board', 'boast', 'body', 'bonus', 'boost', 'booth', 'border', 'bound',
  'brain', 'brand', 'bread', 'break', 'breed', 'brief', 'bring', 'broad', 'broke', 'brown', 'brush', 'build', 'built',
  'bunch', 'buyer', 'cabin', 'cable', 'calm', 'camera', 'camp', 'canal', 'candy', 'canon', 'cards', 'carry', 'carve',
  'cases', 'catch', 'cause', 'chain', 'chair', 'chalk', 'chaos', 'chart', 'chase', 'cheap', 'check', 'cheek', 'cheer',
  'chef', 'chest', 'chief', 'child', 'china', 'chips', 'choir', 'chose', 'chunk', 'claim', 'class', 'claws', 'clean',
  'clear', 'clerk', 'click', 'cliff', 'climb', 'clock', 'close', 'cloth', 'cloud', 'clover', 'clown', 'clues', 'coach',
  'coast', 'cobra', 'cocoa', 'coins', 'color', 'colt', 'couch', 'cough', 'could', 'count', 'court', 'cover', 'craft',
  'crane', 'crank', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'creed', 'creek', 'creep', 'crest', 'crews', 'crick',
  'cried', 'cries', 'crime', 'crisp', 'crook', 'crops', 'cross', 'crowd', 'crown', 'crude', 'cruel', 'crumb', 'crush',
  'crust', 'cubes', 'curry', 'curse', 'curve', 'cycle', 'write', 'read', 'load', 'save', 'file', 'folder', 'drive',
  'disk', 'wire', 'plug', 'slot'
];

export const WORDS_MEDIUM_RARE = [
  'acute', 'audio', 'audit', 'bible', 'cargo', 'cedar', 'cigar', 'comet', 'comic', 'coral', 'cords', 'corny', 'creme',
  'crick', 'crypt', 'cuban', 'cubic', 'vortex', 'plasma', 'rover', 'probe', 'solar', 'sonar', 'radar', 'logic', 'pixel',
  'micro', 'macro', 'input', 'phase', 'array', 'laser', 'orbit', 'flux', 'warp', 'coda', 'heap', 'hash', 'salt', 'shell',
  'kernel', 'admin', 'guest', 'chip', 'plug', 'jack', 'slot'
];

export const WORDS_HARD_COMMON = [
  'ability', 'absence', 'academy', 'account', 'accused', 'achieve', 'acquire', 'acreage', 'actress', 'adapter', 'address',
  'advance', 'adverse', 'advised', 'adviser', 'advisor', 'against', 'airline', 'airport', 'already', 'altered', 'altitude',
  'amateur', 'amazing', 'ambient', 'amended', 'amnesty', 'amongst', 'amounts', 'analogy', 'analyze', 'anatomy', 'anchors',
  'ancient', 'animals', 'animate', 'answers', 'antenna', 'anxiety', 'anybody', 'anymore', 'anytime', 'apology', 'apparel',
  'appeals', 'appears', 'appease', 'applied', 'applies', 'appoint', 'approve', 'apricot', 'aquatic', 'archive', 'arguing',
  'arising', 'arrival', 'arrived', 'arrives', 'article', 'artisan', 'artists', 'ascends', 'ashamed', 'asphalt', 'aspired',
  'aspires', 'aspirin', 'assails', 'assault', 'assents', 'asserts', 'utility', 'vaccine', 'vaguely', 'valiant', 'validly',
  'valleys', 'valours', 'valuable', 'vanilla', 'vanished', 'vanishes', 'vaporize', 'variant', 'variety', 'various', 'varying',
  'vaults', 'vehicle', 'velocity', 'vendors', 'venture', 'verbose', 'verdict', 'verify', 'vernal', 'versant', 'version',
  'vertical', 'vessels', 'vestige', 'veteran', 'vetoed', 'vibrant', 'vicarage', 'vicious', 'victims', 'victory', 'viewers',
  'viewing', 'village', 'villain', 'vintage', 'violate', 'violent', 'violet', 'violins', 'virtual', 'virtues', 'viruses',
  'visages', 'visibly', 'visiting', 'visitor', 'visuals', 'desktop', 'laptop', 'browser', 'session', 'routing', 'gateway',
  'firewall', 'cookies', 'compile', 'upgrade', 'restore', 'backup'
];

export const WORDS_HARD_RARE = [
  'adjoint', 'admiral', 'aerator', 'affects', 'agendas', 'alchemy', 'alcohol', 'algebra', 'aliases', 'aligned', 'alleged',
  'allergy', 'alliance', 'allowed', 'alloyed', 'almanac', 'alumnae', 'alumni', 'amnesia', 'android', 'angular', 'annexed',
  'annuity', 'anysize', 'aquifer', 'arbitry', 'arcades', 'archery', 'archive', 'ardency', 'ardours', 'armored', 'arousal',
  'arraign', 'arrange', 'arrayed', 'arrears', 'arrival', 'arrived', 'arrives', 'arterial', 'ascorb', 'vectors', 'vehement',
  'velvety', 'venomous', 'verging', 'versant', 'vespers', 'vetoed', 'vicarage', 'visages', 'spyware', 'malware', 'hackers',
  'exploit', 'payload', 'release', 'station', 'reactor', 'warhead', 'cruiser', 'circuit', 'booster', 'horizon', 'cluster',
  'optical', 'thermal', 'turbine', 'missile'
];

export const WORDS_EXPERT_COMMON = [
  'abandonment', 'abbreviations', 'accidentally', 'accommodated', 'accommodations', 'accompanied', 'accompaniment',
  'accomplished', 'accomplishment', 'accordances', 'accordingly', 'accountability', 'accountable', 'accountancy',
  'accountants', 'accredited', 'accumulation', 'accumulators', 'accusations', 'accustomed', 'achievements', 'acknowledged',
  'acknowledgment', 'acquisitions', 'additionally', 'adjustments', 'administration', 'administrative', 'administrators',
  'adolescence', 'adolescents', 'adventures', 'adventurous', 'adversaries', 'adversities', 'advertised', 'advertisement',
  'advertiser', 'advertising', 'advisability', 'advisements', 'affectionate', 'affiliations', 'affirmative', 'afflictions',
  'affordable', 'afternoon', 'afterthoughts', 'aggressively', 'agitations', 'alignments', 'allegations', 'allegiance',
  'allowances', 'alterations', 'alternately', 'alternating', 'alternation', 'alternative', 'alternatives', 'amalgamation',
  'ambassador', 'ambiguity', 'ambiguous', 'anniversary', 'announcements', 'annoyances', 'annualized', 'anticipated',
  'anticipation', 'anticipatory', 'antiquities', 'anxiousness', 'apologetic', 'apologizing', 'apparatuses', 'apparentness',
  'appearances', 'applications', 'appointed', 'appointment', 'appointments', 'appraising', 'appreciable', 'appreciated',
  'appreciation', 'appreciative', 'approaches', 'approaching', 'appropriate', 'appropriation', 'approximate', 'approximation',
  'arbitration', 'architects', 'architectural', 'architecture', 'arguments', 'arranging', 'arrangements', 'articulate',
  'articulation', 'artificially', 'aspirations', 'assessments', 'assignments', 'associations', 'assortments', 'assumptions',
  'assurances', 'astonishing', 'astonishment', 'athleticism', 'attachments', 'attainment', 'attainments', 'attempting',
  'attendance', 'attendances', 'attendants', 'attentively', 'attentiveness', 'attitudes', 'attorneys', 'attractions',
  'attractive', 'attractiveness', 'attributable', 'attributes', 'attribution', 'attributive', 'audibilities', 'auditorium',
  'auditorsboard', 'augmentative', 'augmentation', 'authentically', 'authenticate', 'authentication', 'authenticity',
  'authorities', 'authorization', 'authorized', 'authorsboard', 'authorship', 'autobiography', 'autocracies', 'autographing',
  'autoluminescent', 'automated', 'automatic', 'automatically', 'automation', 'automobiles', 'autonomous', 'autonomously',
  'availability', 'averageboard', 'avoidances', 'awakening', 'awesomeness'
];

export const WORDS_EXPERT_RARE = [
  'abnormalities', 'abolitionist', 'abovementioned', 'abrasiveness', 'absorptivity', 'abstractness', 'abundantries',
  'academician', 'accelerated', 'acceleration', 'accelerators', 'acceptability', 'acceptances', 'accessibility',
  'accessories', 'acclimatization', 'acidification', 'acoustically', 'actionability', 'activations', 'adaptability',
  'adaptations', 'administrate', 'admissibility', 'admonitions', 'adoptability', 'adorableness', 'adventurers', 'aerodynamic',
  'aerodynamics', 'aerospace', 'aesthetician', 'aesthetics', 'affectation', 'ambivalence', 'ambivalent', 'ambitiousness',
  'amelioration', 'amenability', 'amiability', 'amicableness', 'ammunition', 'amortization', 'amphitheatre', 'amplification',
  'amusements', 'anachronism', 'analogous', 'analytical', 'analyzers', 'anarchists', 'anatomical', 'ancestries', 'anchorage',
  'anesthesiology', 'angrinesses', 'angularity', 'animations', 'antagonism', 'antagonistic', 'antecedents', 'anxiousness',
  'appareling', 'appellations', 'appendicitis', 'appetizers', 'appetizing', 'applicability', 'application', 'applicators',
  'apportioned', 'apprentice', 'approvalboard', 'approvingly', 'aquaculture', 'arbitrarily', 'arbitrary', 'arbitrator',
  'arithmetical', 'armaments', 'arrogancy', 'arrowheads', 'artificiality', 'artisticity', 'artlessness', 'aspirinboard',
  'assailants', 'assassination', 'assemblages', 'assemblies', 'assemblers', 'assertions', 'assessable', 'assessment',
  'assimilated', 'assimilation', 'astrological', 'astronautics', 'astronomers', 'astronomical', 'astrophysics', 'asymmetric',
  'asymmetry', 'atmospheres', 'atmospheric', 'attainability', 'audibilities', 'averagenesses', 'aversionboard'
];

export async function initDictionary() {
  try {
    const response = await fetch('/dictionary.txt');
    if (!response.ok) throw new Error('Fetch failed');
    const text = await response.text();
    const words = text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);
    
    // Group by length
    const simple = [];
    const medium = [];
    const hard = [];
    const expert = [];
    
    words.forEach(w => {
      if (w.length >= 3 && w.length <= 4) simple.push(w);
      else if (w.length >= 5 && w.length <= 6) medium.push(w);
      else if (w.length >= 7 && w.length <= 9) hard.push(w);
      else if (w.length >= 10) expert.push(w);
    });

    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    // Helper to ensure A-Z coverage in the base categories
    const ensureAlphabetCoverage = (list, fallbacks) => {
      const lettersPresent = new Set(list.map(w => w[0]));
      alphabet.forEach(letter => {
        if (!lettersPresent.has(letter)) {
          const letterFallbacks = fallbacks.filter(w => w[0] === letter);
          if (letterFallbacks.length > 0) {
            list.push(...letterFallbacks);
          } else {
            // Absolute minimal fallback if both are missing
            list.push(letter + 'ar'); 
          }
        }
      });
    };

    ensureAlphabetCoverage(simple, [...WORDS_SIMPLE_COMMON, ...WORDS_SIMPLE_RARE]);
    ensureAlphabetCoverage(medium, [...WORDS_MEDIUM_COMMON, ...WORDS_MEDIUM_RARE]);
    ensureAlphabetCoverage(hard, [...WORDS_HARD_COMMON, ...WORDS_HARD_RARE]);
    ensureAlphabetCoverage(expert, [...WORDS_EXPERT_COMMON, ...WORDS_EXPERT_RARE]);

    // Split list into 75% Common (high frequency) and 25% Rare (low frequency)
    const splitList = (list, targetCommon, targetRare) => {
      const splitIdx = Math.floor(list.length * 0.75);
      const common = list.slice(0, splitIdx);
      const rare = list.slice(splitIdx);
      
      // Safety check: Make sure both Common and Rare sub-lists have A-Z coverage
      const ensureSublistCoverage = (sublist, fullList) => {
        const letters = new Set(sublist.map(w => w[0]));
        alphabet.forEach(letter => {
          if (!letters.has(letter)) {
            const matches = fullList.filter(w => w[0] === letter);
            if (matches.length > 0) {
              sublist.push(matches[Math.floor(Math.random() * matches.length)]);
            }
          }
        });
      };

      ensureSublistCoverage(common, list);
      ensureSublistCoverage(rare, list);

      // Mutate target lists in-place so reference remains correct
      targetCommon.length = 0;
      targetCommon.push(...common);
      
      targetRare.length = 0;
      targetRare.push(...rare);
    };

    splitList(simple, WORDS_SIMPLE_COMMON, WORDS_SIMPLE_RARE);
    splitList(medium, WORDS_MEDIUM_COMMON, WORDS_MEDIUM_RARE);
    splitList(hard, WORDS_HARD_COMMON, WORDS_HARD_RARE);
    splitList(expert, WORDS_EXPERT_COMMON, WORDS_EXPERT_RARE);

    console.log(`Dictionary loaded: Simple=${WORDS_SIMPLE_COMMON.length + WORDS_SIMPLE_RARE.length}, Medium=${WORDS_MEDIUM_COMMON.length + WORDS_MEDIUM_RARE.length}, Hard=${WORDS_HARD_COMMON.length + WORDS_HARD_RARE.length}, Expert=${WORDS_EXPERT_COMMON.length + WORDS_EXPERT_RARE.length}`);
  } catch (e) {
    console.error('Failed to load dictionary.txt, using built-in fallbacks:', e);
  }
}

export function getWordForEnemy(type, waveNumber, usedSet) {
  let commonCandidates = [];
  let rareCandidates = [];

  if (type === 'drone' || type === 'meteor') {
    if (waveNumber <= 3) {
      commonCandidates = WORDS_SIMPLE_COMMON;
      rareCandidates = WORDS_SIMPLE_RARE;
    } else {
      commonCandidates = WORDS_MEDIUM_COMMON;
      rareCandidates = WORDS_MEDIUM_RARE;
    }
  } else if (type === 'interceptor' || type === 'kamikaze' || type === 'stealth_cloaker') {
    if (waveNumber <= 5) {
      commonCandidates = WORDS_MEDIUM_COMMON;
      rareCandidates = WORDS_MEDIUM_RARE;
    } else {
      commonCandidates = WORDS_HARD_COMMON;
      rareCandidates = WORDS_HARD_RARE;
    }
  } else if (type === 'cruiser' || type === 'shield_linker' || type === 'replicator') {
    if (waveNumber <= 28) {
      commonCandidates = WORDS_HARD_COMMON;
      rareCandidates = WORDS_HARD_RARE;
    } else {
      commonCandidates = WORDS_EXPERT_COMMON;
      rareCandidates = WORDS_EXPERT_RARE;
    }
  } else {
    // Boss shields, anomaly mini-boss, and other special items
    commonCandidates = WORDS_EXPERT_COMMON;
    rareCandidates = WORDS_EXPERT_RARE;
  }

  // Filter out already used words from candidates
  let availableCommon = commonCandidates;
  let availableRare = rareCandidates;

  if (usedSet) {
    availableCommon = commonCandidates.filter(w => !usedSet.has(w));
    availableRare = rareCandidates.filter(w => !usedSet.has(w));
  }

  // Choose from Common pool with 75% chance, Rare pool with 25% chance
  let chosenList = [];
  const roll = Math.random();

  if (roll < 0.75 && availableCommon.length > 0) {
    chosenList = availableCommon;
  } else if (availableRare.length > 0) {
    chosenList = availableRare;
  } else {
    // Fallback if the selected list is empty
    chosenList = availableCommon.length > 0 ? availableCommon : availableRare;
  }

  // Recycle all lists in this tier if we've exhausted all unique candidates
  if (chosenList.length === 0) {
    if (usedSet) {
      commonCandidates.forEach(w => usedSet.delete(w));
      rareCandidates.forEach(w => usedSet.delete(w));
    }
    chosenList = commonCandidates;
  }

  const chosen = chosenList[Math.floor(Math.random() * chosenList.length)];
  if (usedSet && chosen) {
    usedSet.add(chosen);
  }
  return chosen;
}
