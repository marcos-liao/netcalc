const IPv4 = {
  parse(input) {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!match) return null;

    const octets = [+match[1], +match[2], +match[3], +match[4]];
    const prefix = +match[5];

    if (octets.some(o => o > 255) || prefix > 32) return null;

    return { octets, prefix };
  },

  toInt(octets) {
    return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  },

  toOctets(int) {
    return [
      (int >>> 24) & 0xFF,
      (int >>> 16) & 0xFF,
      (int >>> 8) & 0xFF,
      int & 0xFF
    ];
  },

  toStr(octets) {
    return octets.join('.');
  },

  maskFromPrefix(prefix) {
    if (prefix === 0) return 0;
    return (0xFFFFFFFF << (32 - prefix)) >>> 0;
  },

  calculate(input) {
    const parsed = this.parse(input);
    if (!parsed) return null;

    const { octets, prefix } = parsed;
    const ip = this.toInt(octets);
    const mask = this.maskFromPrefix(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;

    let firstHost, lastHost, totalHosts;
    if (prefix === 32) {
      firstHost = network;
      lastHost = network;
      totalHosts = 1;
    } else if (prefix === 31) {
      firstHost = network;
      lastHost = broadcast;
      totalHosts = 2;
    } else {
      firstHost = (network + 1) >>> 0;
      lastHost = (broadcast - 1) >>> 0;
      totalHosts = Math.pow(2, 32 - prefix) - 2;
    }

    return {
      ip: this.toStr(octets),
      prefix,
      network: this.toStr(this.toOctets(network)),
      broadcast: this.toStr(this.toOctets(broadcast)),
      firstHost: this.toStr(this.toOctets(firstHost)),
      lastHost: this.toStr(this.toOctets(lastHost)),
      totalHosts,
      mask: this.toStr(this.toOctets(mask)),
      wildcard: this.toStr(this.toOctets(wildcard)),
      ipClass: this.getClass(octets[0]),
      ipType: this.getType(octets),
      networkInt: network,
      broadcastInt: broadcast,
      maskInt: mask,
      bits: this.toBinary(octets),
      prefixLen: prefix
    };
  },

  toBinary(octets) {
    return octets.map(o => o.toString(2).padStart(8, '0'));
  },

  getClass(firstOctet) {
    if (firstOctet < 128) return 'A';
    if (firstOctet < 192) return 'B';
    if (firstOctet < 224) return 'C';
    if (firstOctet < 240) return 'D (Multicast)';
    return 'E (Reserved)';
  },

  getType(octets) {
    const [a, b] = octets;
    if (a === 10) return 'Private';
    if (a === 172 && b >= 16 && b <= 31) return 'Private';
    if (a === 192 && b === 168) return 'Private';
    if (a === 127) return 'Loopback';
    if (a === 169 && b === 254) return 'Link-local';
    if (a >= 224 && a <= 239) return 'Multicast';
    return 'Public';
  },

  split(networkInt, currentPrefix, newPrefix) {
    if (newPrefix <= currentPrefix || newPrefix > 32) return [];

    const subnets = [];
    const count = Math.pow(2, newPrefix - currentPrefix);
    const subnetSize = Math.pow(2, 32 - newPrefix);

    for (let i = 0; i < count; i++) {
      const subNet = (networkInt + i * subnetSize) >>> 0;
      const subBroadcast = (subNet + subnetSize - 1) >>> 0;
      let hosts;
      if (newPrefix === 32) hosts = 1;
      else if (newPrefix === 31) hosts = 2;
      else hosts = subnetSize - 2;

      subnets.push({
        network: this.toStr(this.toOctets(subNet)) + '/' + newPrefix,
        range: this.toStr(this.toOctets(subNet)) + ' - ' + this.toStr(this.toOctets(subBroadcast)),
        hosts,
        networkInt: subNet,
        broadcastInt: subBroadcast,
        prefix: newPrefix
      });
    }

    return subnets;
  },

  vlsm(networkCidr, requirements) {
    const parsed = this.parse(networkCidr);
    if (!parsed) return null;

    const networkInt = (this.toInt(parsed.octets) & this.maskFromPrefix(parsed.prefix)) >>> 0;
    const totalSpace = Math.pow(2, 32 - parsed.prefix);

    const sorted = requirements
      .map((r, i) => ({ ...r, index: i }))
      .sort((a, b) => b.hosts - a.hosts);

    const results = [];
    let currentAddr = networkInt;

    for (const req of sorted) {
      let needed = req.hosts + 2;
      let subnetBits = Math.ceil(Math.log2(needed));
      if (subnetBits < 2) subnetBits = 2;
      const subnetSize = Math.pow(2, subnetBits);
      const prefix = 32 - subnetBits;

      const alignedAddr = (Math.ceil(currentAddr / subnetSize) * subnetSize) >>> 0;

      if (alignedAddr + subnetSize > networkInt + totalSpace) {
        return { error: 'Not enough address space for "' + req.name + '"' };
      }

      results.push({
        name: req.name,
        network: this.toStr(this.toOctets(alignedAddr)) + '/' + prefix,
        firstHost: this.toStr(this.toOctets((alignedAddr + 1) >>> 0)),
        lastHost: this.toStr(this.toOctets((alignedAddr + subnetSize - 2) >>> 0)),
        broadcast: this.toStr(this.toOctets((alignedAddr + subnetSize - 1) >>> 0)),
        mask: this.toStr(this.toOctets(this.maskFromPrefix(prefix))),
        allocatedHosts: subnetSize - 2,
        requestedHosts: req.hosts,
        prefix
      });

      currentAddr = alignedAddr + subnetSize;
    }

    return results;
  }
};
