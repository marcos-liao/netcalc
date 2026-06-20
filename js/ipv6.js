const IPv6 = {
  parse(input) {
    const trimmed = input.trim();
    const parts = trimmed.split('/');
    if (parts.length !== 2) return null;

    const prefix = parseInt(parts[1], 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 128) return null;

    const expanded = this.expand(parts[0]);
    if (!expanded) return null;

    return { address: expanded, prefix };
  },

  expand(addr) {
    if (addr.indexOf('::') !== -1) {
      const halves = addr.split('::');
      if (halves.length > 2) return null;

      const left = halves[0] ? halves[0].split(':') : [];
      const right = halves[1] ? halves[1].split(':') : [];
      const missing = 8 - left.length - right.length;

      if (missing < 0) return null;

      const middle = Array(missing).fill('0000');
      const groups = [...left, ...middle, ...right];

      return groups.map(g => g.padStart(4, '0')).join(':');
    }

    const groups = addr.split(':');
    if (groups.length !== 8) return null;

    return groups.map(g => g.padStart(4, '0')).join(':');
  },

  compress(expanded) {
    const groups = expanded.split(':').map(g => g.replace(/^0+/, '') || '0');

    let bestStart = -1, bestLen = 0;
    let curStart = -1, curLen = 0;

    for (let i = 0; i < 8; i++) {
      if (groups[i] === '0') {
        if (curStart === -1) curStart = i;
        curLen++;
        if (curLen > bestLen) {
          bestStart = curStart;
          bestLen = curLen;
        }
      } else {
        curStart = -1;
        curLen = 0;
      }
    }

    if (bestLen < 2) return groups.join(':');

    const left = groups.slice(0, bestStart).join(':');
    const right = groups.slice(bestStart + bestLen).join(':');
    return left + '::' + right;
  },

  toBits(expanded) {
    return expanded.split(':').map(g =>
      parseInt(g, 16).toString(2).padStart(16, '0')
    );
  },

  calculate(input) {
    const parsed = this.parse(input);
    if (!parsed) return null;

    const { address, prefix } = parsed;
    const groups = address.split(':');
    const totalBits = groups.map(g => parseInt(g, 16).toString(2).padStart(16, '0')).join('');

    const networkBits = totalBits.substring(0, prefix).padEnd(128, '0');
    const firstBits = networkBits.substring(0, prefix).padEnd(128, '0');
    const lastBits = networkBits.substring(0, prefix).padEnd(128, '1');

    const networkAddr = this.bitsToAddr(networkBits);
    const firstAddr = this.bitsToAddr(firstBits.substring(0, 127) + '1');
    const lastAddr = this.bitsToAddr(lastBits.substring(0, 127) + '0');
    const lastAddrFull = this.bitsToAddr(lastBits);

    const hostBits = 128 - prefix;
    let totalHosts;
    if (hostBits > 53) {
      totalHosts = '2^' + hostBits;
    } else {
      totalHosts = Math.pow(2, hostBits);
    }

    return {
      expanded: address,
      compressed: this.compress(address),
      prefix,
      network: this.compress(networkAddr) + '/' + prefix,
      firstHost: this.compress(firstAddr),
      lastHost: this.compress(lastAddr),
      lastAddress: this.compress(lastAddrFull),
      totalHosts,
      bits: this.toBits(address),
      prefixLen: prefix,
      type: this.getType(address)
    };
  },

  bitsToAddr(bits) {
    const groups = [];
    for (let i = 0; i < 128; i += 16) {
      groups.push(parseInt(bits.substring(i, i + 16), 2).toString(16).padStart(4, '0'));
    }
    return groups.join(':');
  },

  getType(expanded) {
    const first = expanded.substring(0, 4);
    const firstInt = parseInt(first, 16);

    if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') return 'Loopback';
    if (expanded === '0000:0000:0000:0000:0000:0000:0000:0000') return 'Unspecified';
    if (first.startsWith('fe8') || first.startsWith('fe9') || first.startsWith('fea') || first.startsWith('feb')) return 'Link-local';
    if (first.startsWith('fc') || first.startsWith('fd')) return 'Unique local';
    if (first.startsWith('ff')) return 'Multicast';
    if (firstInt >= 0x2000 && firstInt <= 0x3fff) return 'Global unicast';
    return 'Reserved';
  },

  eui64(macAddress) {
    const mac = macAddress.replace(/[:\-\.]/g, '').toLowerCase();
    if (mac.length !== 12 || !/^[0-9a-f]+$/.test(mac)) return null;

    const firstByte = parseInt(mac.substring(0, 2), 16) ^ 0x02;
    const eui = firstByte.toString(16).padStart(2, '0') +
      mac.substring(2, 6) + 'fffe' + mac.substring(6, 12);

    const groups = [];
    for (let i = 0; i < 16; i += 4) {
      groups.push(eui.substring(i, i + 4));
    }

    return 'fe80::' + groups.join(':');
  }
};
