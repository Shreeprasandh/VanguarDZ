/**
 * Curated Lexicon Packs for VanguarDZ Solo Mode.
 * Strictly alphanumeric lowercase strings (a-z) to guarantee fluid keyboard input
 * without requiring Shift-key modifier combinations.
 */

export const LEXICON_PACKS = [
  {
    id: 'english',
    label: 'English',
    badge: 'ENG',
    description: 'Standard cyber dictionary'
  },
  {
    id: 'python',
    label: 'Python',
    badge: 'PY',
    description: 'Keywords, built-ins, standard libraries',
    words: {
      short: [
        'def', 'len', 'zip', 'map', 'int', 'str', 'set', 'for', 'try', 'pop',
        'get', 'del', 'min', 'max', 'sum', 'all', 'any', 'bin', 'hex', 'chr',
        'abs', 'dir', 'doc', 'env', 'pip', 'cls', 'self', 'args', 'none', 'true',
        'repr', 'iter', 'next', 'open', 'read', 'byte', 'file', 'type', 'pass', 'with'
      ],
      medium: [
        'lambda', 'return', 'filter', 'sorted', 'import', 'yield', 'assert', 'except',
        'global', 'format', 'append', 'extend', 'remove', 'insert', 'update', 'values',
        'pytest', 'params', 'django', 'fastapi', 'pandas', 'numpy', 'scipy', 'random',
        'choice', 'pickle', 'sqlite', 'socket', 'thread', 'daemon', 'asyncio', 'future',
        'kwargs', 'getattr', 'setattr', 'hasattr', 'issubclass', 'callable', 'property',
        'setter', 'closure', 'method', 'module', 'package', 'syntax', 'indent', 'schema'
      ],
      long: [
        'isinstance', 'enumerate', 'dictionary', 'comprehension', 'classmethod',
        'staticmethod', 'matplotlib', 'tensorflow', 'sqlalchemy', 'traceback',
        'asynchronous', 'generator', 'serializer', 'dataclass', 'metaclass',
        'contextmanager', 'breakpoint', 'supercharged', 'multiprocessing', 'concurrent',
        'decoratortype', 'abstractmethod', 'runtimeerror', 'typeerror', 'valueerror',
        'indexerror', 'stopiteration', 'zerodivision', 'recursionlimit', 'subprocesses'
      ]
    }
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    badge: 'JS',
    description: 'ES6+, DOM, React, TypeScript',
    words: {
      short: [
        'var', 'let', 'map', 'set', 'pop', 'get', 'dom', 'api', 'ref', 'log',
        'npm', 'npx', 'key', 'tag', 'row', 'col', 'null', 'true', 'void', 'this',
        'new', 'try', 'for', 'with', 'byte', 'eval', 'node', 'vite', 'json', 'data',
        'path', 'blob', 'file', 'link', 'text', 'send', 'emit', 'pipe', 'next', 'meta'
      ],
      medium: [
        'const', 'return', 'export', 'import', 'filter', 'reduce', 'typeof', 'length',
        'concat', 'splice', 'object', 'string', 'number', 'symbol', 'async', 'await',
        'promise', 'react', 'state', 'effect', 'context', 'router', 'nextjs', 'redux',
        'target', 'render', 'script', 'window', 'worker', 'canvas', 'fetch', 'assign',
        'freeze', 'entries', 'resolve', 'reject', 'finally', 'catch', 'switch', 'spread'
      ],
      long: [
        'queryselector', 'addeventlistener', 'preventdefault', 'stoppropagation',
        'localstorage', 'sessionstorage', 'clearinterval', 'settimeout', 'usecallback',
        'usememo', 'typescript', 'interface', 'constructor', 'inheritance', 'prototype',
        'xmlhttprequest', 'domcontentloaded', 'intersectionobserver', 'mutationobserver',
        'requestanimationframe', 'structuredclone', 'createroot', 'strictmode', 'destructure'
      ]
    }
  },
  {
    id: 'java',
    label: 'Java / C++',
    badge: 'JAVA',
    description: 'Object-oriented, algorithms, systems',
    words: {
      short: [
        'int', 'new', 'for', 'try', 'out', 'run', 'get', 'set', 'byte', 'char',
        'long', 'this', 'super', 'null', 'void', 'case', 'goto', 'enum', 'main', 'true',
        'size', 'head', 'tail', 'node', 'heap', 'tree', 'root', 'leaf', 'edge', 'loop',
        'push', 'poll', 'peek', 'hash', 'sort', 'swap', 'base', 'cast', 'auto', 'lock'
      ],
      medium: [
        'public', 'static', 'class', 'return', 'switch', 'import', 'package', 'extends',
        'boolean', 'integer', 'scanner', 'system', 'vector', 'string', 'stream', 'thread',
        'spring', 'gradle', 'maven', 'lombok', 'finally', 'assert', 'record', 'sealed',
        'native', 'double', 'float', 'private', 'protected', 'default', 'abstract', 'lambda'
      ],
      long: [
        'implements', 'interface', 'synchronized', 'override', 'exception',
        'nullpointer', 'arraylist', 'linkedlist', 'hashmap', 'stringbuilder',
        'bufferedreader', 'inputstream', 'outputstream', 'polymorphism', 'encapsulation',
        'serializable', 'comparable', 'threadpoolexecutor', 'completablefuture', 'reflection',
        'stackoverflow', 'outofmemory', 'concurrentmodification', 'classnotfound', 'instantiation'
      ]
    }
  },
  {
    id: 'terminal',
    label: 'Terminal / CLI',
    badge: 'CLI',
    description: 'DevOps, shell, Linux, containerization',
    words: {
      short: [
        'cat', 'pwd', 'ssh', 'git', 'top', 'tar', 'awk', 'sed', 'env', 'man',
        'log', 'who', 'tee', 'cut', 'zip', 'dig', 'curl', 'ping', 'kill', 'nano',
        'sudo', 'root', 'user', 'echo', 'grep', 'find', 'tail', 'head', 'diff', 'gzip',
        'bash', 'zsh', 'sh', 'cron', 'pipe', 'link', 'stat', 'read', 'wait', 'exit'
      ],
      medium: [
        'docker', 'commit', 'branch', 'rebase', 'systemctl', 'journalctl', 'status', 'reboot',
        'chmod', 'chown', 'netstat', 'kubectl', 'daemon', 'kernel', 'packet', 'router',
        'server', 'client', 'socket', 'listen', 'config', 'service', 'daemon', 'iptables',
        'dockerfile', 'compose', 'ingress', 'cluster', 'deploy', 'storage', 'secret', 'volume'
      ],
      long: [
        'traceroute', 'kubernetes', 'terraform', 'permission', 'cherrypick',
        'repository', 'wireguard', 'nameserver', 'filesystem', 'namespacing',
        'helmchart', 'containerd', 'podman', 'virtualenv', 'cloudflare',
        'certbot', 'prometheus', 'grafana', 'reverseproxy', 'loadbalancer',
        'firewalld', 'packetfilter', 'sshkeygen', 'ansibleplaybook', 'distribution'
      ]
    }
  }
];

export function getLexiconPack(packId) {
  return LEXICON_PACKS.find(p => p.id === packId) || LEXICON_PACKS[0];
}

/**
 * Selects an appropriate anti-repetitive word from the specified lexicon pack
 * aligned with wave difficulty thresholds.
 */
export function getLexiconWord(packId, wave, usedSet, type = null) {
  const pack = getLexiconPack(packId);
  if (!pack || pack.id === 'english' || !pack.words) {
    return null;
  }

  let wordList;
  if (type === 'boss' || type === 'anomaly' || (type === 'cruiser' && wave >= 10)) {
    wordList = pack.words.long;
  } else if (type === 'drone' && wave <= 4) {
    wordList = pack.words.short;
  } else if (wave <= 4) {
    wordList = pack.words.short;
  } else if (wave <= 14) {
    wordList = pack.words.medium;
  } else {
    wordList = pack.words.long;
  }

  if (!wordList || wordList.length === 0) {
    wordList = pack.words.medium || pack.words.short;
  }

  let candidates = usedSet 
    ? wordList.filter(w => !usedSet.has(w))
    : [...wordList];

  // If all words in this tier have been exhausted, recycle the set
  if (candidates.length === 0) {
    if (usedSet) {
      wordList.forEach(w => usedSet.delete(w));
    }
    candidates = [...wordList];
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  if (usedSet && chosen) {
    usedSet.add(chosen);
  }
  return chosen;
}
