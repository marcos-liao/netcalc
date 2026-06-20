document.addEventListener('DOMContentLoaded', () => {
  const ipInput = document.getElementById('ip-input');
  const btnCalc = document.getElementById('btn-calculate');
  const resultCards = document.getElementById('result-cards');
  const bitVisualizer = document.getElementById('bit-visualizer');
  const bitDisplay = document.getElementById('bit-display');
  const blockMap = document.getElementById('block-map');
  const blockGrid = document.getElementById('block-grid');
  const btnExportExcel = document.getElementById('btn-export-excel');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnCopy = document.getElementById('btn-copy');
  const btnVlsmAdd = document.getElementById('btn-vlsm-add');
  const btnVlsmCalc = document.getElementById('btn-vlsm-calc');
  const vlsmRows = document.getElementById('vlsm-rows');
  const vlsmResults = document.getElementById('vlsm-results');
  const btnFlsmCalc = document.getElementById('btn-flsm-calc');
  const flsmCount = document.getElementById('flsm-count');
  const flsmResults = document.getElementById('flsm-results');
  const flsmInfo = document.getElementById('flsm-info');
  const subnetNetwork = document.getElementById('subnet-network');

  let currentMode = 'ipv4';
  let currentResult = null;

  // Tab navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });

  // IPv4/IPv6 mode
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updatePlaceholder();
      updateRefPanel();
    });
  });

  function updatePlaceholder() {
    if (currentMode === 'ipv4') {
      ipInput.placeholder = '192.168.10.0/24';
    } else {
      ipInput.placeholder = '2001:db8::/48';
    }
  }

  // Reference panel
  var refToggle = document.getElementById('ref-toggle');
  var refContent = document.getElementById('ref-content');

  refToggle.addEventListener('click', () => {
    var isOpen = refContent.style.display !== 'none';
    refContent.style.display = isOpen ? 'none' : 'block';
    refToggle.classList.toggle('open', !isOpen);
  });

  function updateRefPanel() {
    document.getElementById('ref-ipv4').style.display = currentMode === 'ipv4' ? 'block' : 'none';
    document.getElementById('ref-ipv6').style.display = currentMode === 'ipv6' ? 'block' : 'none';
  }

  // FLSM / VLSM mode toggle
  document.querySelectorAll('.subnet-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subnet-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      var mode = btn.dataset.smode;
      document.getElementById('panel-flsm').style.display = mode === 'flsm' ? 'block' : 'none';
      document.getElementById('panel-vlsm').style.display = mode === 'vlsm' ? 'block' : 'none';
      flsmResults.innerHTML = '';
      flsmInfo.classList.remove('visible');
      vlsmResults.innerHTML = '';
      document.getElementById('subnet-tree-box').style.display = 'none';
    });
  });

  // Calculator
  btnCalc.addEventListener('click', calculate);
  ipInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calculate();
  });

  function calculate() {
    const input = ipInput.value.trim();
    if (!input) return;
    clearError();
    if (currentMode === 'ipv4') {
      calculateIPv4(input);
    } else {
      calculateIPv6(input);
    }
  }

  function calculateIPv4(input) {
    const result = IPv4.calculate(input);
    if (!result) {
      showError('Invalid IPv4 address. Use format: 192.168.10.0/24');
      return;
    }

    currentResult = result;

    document.getElementById('val-network').textContent = result.network;
    document.getElementById('val-broadcast').textContent = result.broadcast;
    document.getElementById('val-range').textContent = result.firstHost + ' - ' + result.lastHost;
    document.getElementById('val-hosts').textContent = result.totalHosts.toLocaleString();
    document.getElementById('val-mask').textContent = result.mask;
    document.getElementById('val-wildcard').textContent = result.wildcard;
    document.getElementById('val-class').textContent = result.ipClass;
    document.getElementById('val-type').textContent = result.ipType;

    resultCards.style.display = 'grid';
    bitVisualizer.style.display = 'block';
    blockMap.style.display = 'block';

    Visualizer.renderBits(bitDisplay, result.bits, result.prefixLen, 'ipv4');
    Visualizer.renderBlockMap(blockGrid, result);
    Export.setData(result);
  }

  function calculateIPv6(input) {
    const result = IPv6.calculate(input);
    if (!result) {
      showError('Invalid IPv6 address. Use format: 2001:db8::/48');
      return;
    }

    currentResult = result;

    document.getElementById('val-network').textContent = result.network;
    document.getElementById('val-broadcast').textContent = result.lastAddress;
    document.getElementById('val-range').textContent = result.firstHost + ' - ' + result.lastHost;
    document.getElementById('val-hosts').textContent = typeof result.totalHosts === 'string' ? result.totalHosts : result.totalHosts.toLocaleString();
    document.getElementById('val-mask').textContent = '/' + result.prefix;
    document.getElementById('val-wildcard').textContent = '—';
    document.getElementById('val-class').textContent = '—';
    document.getElementById('val-type').textContent = result.type;

    resultCards.style.display = 'grid';
    bitVisualizer.style.display = 'block';
    blockMap.style.display = 'none';

    Visualizer.renderBits(bitDisplay, result.bits, result.prefixLen, 'ipv6');

    Export.setData({
      ip: result.compressed,
      prefix: result.prefix,
      network: result.network,
      broadcast: result.lastAddress,
      firstHost: result.firstHost,
      lastHost: result.lastHost,
      totalHosts: result.totalHosts,
      mask: '/' + result.prefix,
      wildcard: '—',
      ipClass: '—',
      ipType: result.type
    });
  }

  // FLSM
  btnFlsmCalc.addEventListener('click', () => {
    const network = subnetNetwork.value.trim();
    if (!network) {
      showError('Enter a network CIDR address.');
      return;
    }
    clearError();

    const parsed = IPv4.parse(network);
    if (!parsed) {
      showError('Invalid network address. Use format: 192.168.1.0/24');
      return;
    }

    const count = parseInt(flsmCount.value, 10);
    const bitsNeeded = Math.ceil(Math.log2(count));
    const newPrefix = parsed.prefix + bitsNeeded;

    if (newPrefix > 30) {
      showError('Cannot create ' + count + ' subnets from /' + parsed.prefix + '. Not enough address space.');
      return;
    }

    const networkInt = (IPv4.toInt(parsed.octets) & IPv4.maskFromPrefix(parsed.prefix)) >>> 0;
    const subnets = IPv4.split(networkInt, parsed.prefix, newPrefix);

    var hostsPerSubnet = subnets[0].hosts;
    flsmInfo.textContent = 'Dividing /' + parsed.prefix + ' into ' + count + ' equal subnets of /' + newPrefix + ' (' + hostsPerSubnet + ' hosts each)';
    flsmInfo.classList.add('visible');

    var flsmVlsmFormat = subnets.map(function(s, i) {
      return {
        name: 'Subnet ' + (i + 1),
        network: s.network,
        firstHost: IPv4.toStr(IPv4.toOctets((s.networkInt + 1) >>> 0)),
        lastHost: IPv4.toStr(IPv4.toOctets((s.broadcastInt - 1) >>> 0)),
        broadcast: IPv4.toStr(IPv4.toOctets(s.broadcastInt)),
        mask: IPv4.toStr(IPv4.toOctets(IPv4.maskFromPrefix(s.prefix))),
        allocatedHosts: s.hosts,
        requestedHosts: s.hosts,
        prefix: s.prefix
      };
    });

    vlsmResults.innerHTML = '';
    Visualizer.renderVlsmResults(flsmResults, flsmVlsmFormat);
    showTree(network, flsmVlsmFormat);
  });

  // VLSM
  btnVlsmAdd.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'vlsm-row';
    row.innerHTML =
      '<input type="text" placeholder="Subnet name" class="vlsm-name">' +
      '<input type="number" placeholder="Hosts needed" class="vlsm-hosts" min="1">' +
      '<button class="btn-secondary vlsm-remove" style="padding:6px 10px;">x</button>';
    vlsmRows.appendChild(row);
    row.querySelector('.vlsm-remove').addEventListener('click', () => row.remove());
  });

  btnVlsmCalc.addEventListener('click', () => {
    const network = subnetNetwork.value.trim();
    if (!network) {
      showError('Enter a network CIDR address.');
      return;
    }
    clearError();

    const rows = vlsmRows.querySelectorAll('.vlsm-row');
    const requirements = [];

    rows.forEach(row => {
      const name = row.querySelector('.vlsm-name').value.trim();
      const hosts = parseInt(row.querySelector('.vlsm-hosts').value, 10);
      if (name && hosts > 0) {
        requirements.push({ name, hosts });
      }
    });

    if (requirements.length === 0) {
      showError('Add at least one subnet with name and host count.');
      return;
    }

    const results = IPv4.vlsm(network, requirements);
    if (!results) {
      showError('Invalid network address.');
      return;
    }

    flsmResults.innerHTML = '';
    flsmInfo.classList.remove('visible');
    Visualizer.renderVlsmResults(vlsmResults, results);

    if (!results.error) {
      showTree(network, results);
    } else {
      document.getElementById('subnet-tree-box').style.display = 'none';
    }
  });

  function showTree(network, results) {
    var treeBox = document.getElementById('subnet-tree-box');
    treeBox.style.display = 'block';
    Visualizer.renderVlsmTree(document.getElementById('subnet-tree'), network, results);

    var mermaidCode = Visualizer.generateMermaid(network, results);
    document.getElementById('mermaid-code').textContent = mermaidCode;

    Export.setData({
      ip: network,
      prefix: network.split('/')[1],
      network: network,
      broadcast: '—',
      firstHost: '—',
      lastHost: '—',
      totalHosts: '—',
      mask: '—',
      wildcard: '—',
      ipClass: '—',
      ipType: '—',
      subnets: results
    });
  }

  // Mermaid toggle
  document.getElementById('mermaid-toggle').addEventListener('click', function() {
    var code = document.getElementById('mermaid-code');
    var isOpen = code.style.display !== 'none';
    code.style.display = isOpen ? 'none' : 'block';
    this.classList.toggle('open', !isOpen);
  });

  // Copy mermaid
  document.getElementById('btn-copy-mermaid').addEventListener('click', function() {
    var code = document.getElementById('mermaid-code').textContent;
    var btn = this;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
    }
  });

  // Export
  btnExportExcel.addEventListener('click', () => Export.toExcel());

  function showError(msg) {
    clearError();
    const el = document.createElement('div');
    el.className = 'error-msg';
    el.textContent = msg;
    document.querySelector('.content').prepend(el);
  }

  function clearError() {
    document.querySelectorAll('.error-msg').forEach(e => e.remove());
  }
});
