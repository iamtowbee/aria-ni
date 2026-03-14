/**
 * TinyTokenizer — Lightweight BPE-style tokenizer for on-device use
 *
 * No external dependencies. Works in React Native / Expo.
 * Starts with character-level vocab, learns merge rules from
 * experience using frequency-based BPE (Byte Pair Encoding).
 *
 * Vocab is persistent — grows as the model sees more text.
 */

const SPECIAL_TOKENS = {
  PAD:   0,
  UNK:   1,
  BOS:   2,
  EOS:   3,
  SEP:   4,
  MASK:  5,
  USER:  6,
  ARIA:  7,
  IMG:   8,
  MEM:   9,
};

const BASE_VOCAB_SIZE = 256; // byte-level base

export class TinyTokenizer {
  constructor(options = {}) {
    this.maxVocabSize  = options.maxVocabSize  ?? 4096;
    this.maxSeqLen     = options.maxSeqLen     ?? 256;
    this.minFreq       = options.minFreq       ?? 3;    // min pair freq for merge

    // Token ↔ ID maps
    this.token2id = new Map();
    this.id2token = new Map();

    // BPE merge rules: "A B" → "AB"  (ordered list)
    this.mergeRules = [];          // [["ab", "cd"], ...]

    // Pair frequency stats (for adaptive learning)
    this.pairFreqs = new Map();

    // Corpus stats
    this.wordFreqs = new Map();

    this._initBaseVocab();
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  _initBaseVocab() {
    // Special tokens first
    for (const [name, id] of Object.entries(SPECIAL_TOKENS)) {
      const tok = `<|${name.toLowerCase()}|>`;
      this.token2id.set(tok, id);
      this.id2token.set(id, tok);
    }

    // Byte-level base: printable ASCII + common chars
    let nextId = Object.keys(SPECIAL_TOKENS).length;
    for (let i = 32; i < 127; i++) {
      const ch = String.fromCharCode(i);
      if (!this.token2id.has(ch)) {
        this.token2id.set(ch, nextId);
        this.id2token.set(nextId, ch);
        nextId++;
      }
    }

    // Common English subwords to bootstrap
    const seeds = [
      ' the',' a',' an',' is',' are',' was',' be',' have',
      ' to',' of',' and',' in',' that',' it',' for',
      ' I',' you',' we',' he',' she',' they',
      'ing','ed','er','ly','tion','ment','ness','able',
      ' on',' at',' with',' from',' by',' as',' or',
      ' not',' but',' if',' when',' how',' what',' why',
      '\n',' ',
    ];
    for (const s of seeds) {
      if (!this.token2id.has(s) && nextId < this.maxVocabSize) {
        this.token2id.set(s, nextId);
        this.id2token.set(nextId, s);
        nextId++;
      }
    }
  }

  // ── Encoding ──────────────────────────────────────────────────────────────

  encode(text, options = {}) {
    const { addBos = false, addEos = false, truncate = true } = options;
    const ids = [];

    if (addBos) ids.push(SPECIAL_TOKENS.BOS);

    // Pre-tokenize: split on whitespace boundaries, preserve spaces
    const words = this._pretokenize(text);

    for (const word of words) {
      const wordIds = this._encodeWord(word);
      ids.push(...wordIds);
    }

    if (addEos) ids.push(SPECIAL_TOKENS.EOS);

    if (truncate && ids.length > this.maxSeqLen) {
      return ids.slice(0, this.maxSeqLen);
    }
    return ids;
  }

  decode(ids, options = {}) {
    const { skipSpecial = true } = options;
    const specialIds = new Set(Object.values(SPECIAL_TOKENS));
    return ids
      .filter(id => !skipSpecial || !specialIds.has(id))
      .map(id => this.id2token.get(id) ?? '<|unk|>')
      .join('');
  }

  encodeChat(messages) {
    // Encode a chat history into token ids
    const ids = [SPECIAL_TOKENS.BOS];
    for (const msg of messages) {
      ids.push(msg.role === 'user' ? SPECIAL_TOKENS.USER : SPECIAL_TOKENS.ARIA);
      ids.push(...this.encode(msg.content));
      ids.push(SPECIAL_TOKENS.SEP);
    }
    // Prime for next assistant turn
    ids.push(SPECIAL_TOKENS.ARIA);
    return ids.slice(-this.maxSeqLen); // keep recent context
  }

  // ── BPE Learning ──────────────────────────────────────────────────────────

  /**
   * Learn new merge rules from a text corpus.
   * Called automatically during self-learning cycles.
   */
  learnFromText(text) {
    // Update word frequencies
    const words = this._pretokenize(text);
    for (const w of words) {
      this.wordFreqs.set(w, (this.wordFreqs.get(w) ?? 0) + 1);
    }

    // Count pair frequencies across corpus
    for (const [word, freq] of this.wordFreqs) {
      const chars = this._splitIntoKnownTokens(word);
      if (chars.length < 2) continue;
      for (let i = 0; i < chars.length - 1; i++) {
        const pair = chars[i] + '|' + chars[i + 1];
        this.pairFreqs.set(pair, (this.pairFreqs.get(pair) ?? 0) + freq);
      }
    }

    // Learn top merge rules if vocab has room
    let learned = 0;
    const sorted = [...this.pairFreqs.entries()]
      .filter(([, f]) => f >= this.minFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    for (const [pair] of sorted) {
      const [a, b] = pair.split('|');
      const merged = a + b;
      if (!this.token2id.has(merged) && this.token2id.size < this.maxVocabSize) {
        const newId = this.token2id.size;
        this.token2id.set(merged, newId);
        this.id2token.set(newId, merged);
        this.mergeRules.push([a, b]);
        learned++;
      }
    }

    return { learned, vocabSize: this.token2id.size };
  }

  getStats() {
    return {
      vocabSize:    this.token2id.size,
      mergeRules:   this.mergeRules.length,
      wordFreqs:    this.wordFreqs.size,
      maxVocabSize: this.maxVocabSize,
      coverage:     Math.round(this.token2id.size / this.maxVocabSize * 100) + '%',
    };
  }

  // Serialize for AsyncStorage persistence
  serialize() {
    return JSON.stringify({
      token2id:   [...this.token2id.entries()],
      mergeRules: this.mergeRules,
      wordFreqs:  [...this.wordFreqs.entries()].slice(0, 2000),
    });
  }

  deserialize(data) {
    const obj = JSON.parse(data);
    this.token2id  = new Map(obj.token2id);
    this.id2token  = new Map(obj.token2id.map(([k, v]) => [v, k]));
    this.mergeRules = obj.mergeRules ?? [];
    this.wordFreqs  = new Map(obj.wordFreqs ?? []);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _pretokenize(text) {
    // Split keeping spaces attached to following word (GPT-style)
    return text.match(/\s?\S+|\s+/g) ?? [];
  }

  _encodeWord(word) {
    // Apply learned merge rules
    let symbols = this._splitIntoKnownTokens(word);

    for (const [a, b] of this.mergeRules) {
      let i = 0;
      while (i < symbols.length - 1) {
        if (symbols[i] === a && symbols[i + 1] === b) {
          symbols.splice(i, 2, a + b);
        } else {
          i++;
        }
      }
    }

    return symbols.map(s => this.token2id.get(s) ?? SPECIAL_TOKENS.UNK);
  }

  _splitIntoKnownTokens(word) {
    // Greedy longest-match from known vocab
    const result = [];
    let i = 0;
    while (i < word.length) {
      let matched = false;
      for (let len = Math.min(word.length - i, 12); len > 0; len--) {
        const sub = word.slice(i, i + len);
        if (this.token2id.has(sub)) {
          result.push(sub);
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result.push(word[i]);
        i++;
      }
    }
    return result;
  }
}

export { SPECIAL_TOKENS };
export default TinyTokenizer;
