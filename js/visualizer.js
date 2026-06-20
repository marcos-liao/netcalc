const Visualizer = {
  renderBits(container, bits, prefix, mode) {
    container.innerHTML = '';

    if (mode === 'ipv4') {
      bits.forEach((octet, i) => {
        if (i > 0) {
          const dot = document.createElement('span');
          dot.className = 'bit-dot';
          dot.textContent = '.';
          container.appendChild(dot);
        }
        const group = document.createElement('span');
        group.className = 'bit-octet';

        for (let b = 0; b < 8; b++) {
          const bitIndex = i * 8 + b;
          const cell = document.createElement('span');
          cell.className = 'bit-cell ' + (bitIndex < prefix ? 'net' : 'host');
          cell.textContent = octet[b];
          group.appendChild(cell);
        }
        container.appendChild(group);
      });
    } else {
      bits.forEach((group, i) => {
        if (i > 0) {
          const sep = document.createElement('span');
          sep.className = 'bit-dot';
          sep.textContent = ':';
          container.appendChild(sep);
        }
        const grpEl = document.createElement('span');
        grpEl.className = 'bit-octet';

        for (let b = 0; b < 16; b++) {
          const bitIndex = i * 16 + b;
          const cell = document.createElement('span');
          cell.className = 'bit-cell ' + (bitIndex < prefix ? 'net' : 'host');
          cell.textContent = group[b];
          cell.style.width = '14px';
          cell.style.height = '18px';
          cell.style.fontSize = '9px';
          grpEl.appendChild(cell);
        }
        container.appendChild(grpEl);
      });
    }
  },

  renderBlockMap(container, result) {
    container.innerHTML = '';
    const totalHosts = result.totalHosts + 2;

    if (totalHosts > 1024) {
      this.renderBlockMapLarge(container, result);
      return;
    }

    for (let i = 0; i < totalHosts; i++) {
      const cell = document.createElement('div');
      cell.className = 'block-cell';

      const ip = IPv4.toStr(IPv4.toOctets((result.networkInt + i) >>> 0));

      if (i === 0) {
        cell.classList.add('network');
      } else if (i === totalHosts - 1) {
        cell.classList.add('broadcast');
      } else {
        cell.classList.add('usable');
      }

      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = ip;
      cell.appendChild(tooltip);

      container.appendChild(cell);
    }

    container.style.gridTemplateColumns = 'repeat(' + Math.min(totalHosts, 16) + ', 1fr)';
  },

  renderBlockMapLarge(container, result) {
    const totalHosts = result.totalHosts + 2;
    const cols = 32;
    const rows = 8;
    const totalCells = cols * rows;
    const step = Math.max(1, Math.floor(totalHosts / totalCells));

    for (let i = 0; i < totalCells; i++) {
      const offset = i * step;
      const cell = document.createElement('div');
      cell.className = 'block-cell';

      if (offset === 0) {
        cell.classList.add('network');
      } else if (offset >= totalHosts - step) {
        cell.classList.add('broadcast');
      } else {
        cell.classList.add('usable');
      }

      const ipAddr = IPv4.toStr(IPv4.toOctets((result.networkInt + offset) >>> 0));
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = ipAddr + (step > 1 ? ' (+' + step + ')' : '');
      cell.appendChild(tooltip);

      container.appendChild(cell);
    }

    container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  },

  renderVlsmTree(container, rootCidr, vlsmResults) {
    container.innerHTML = '';

    var colors = [
      {bg: '#E6F1FB', border: '#85B7EB', text: '#0C447C'},
      {bg: '#E1F5EE', border: '#5DCAA5', text: '#085041'},
      {bg: '#FAEEDA', border: '#EF9F27', text: '#633806'},
      {bg: '#EEEDFE', border: '#AFA9EC', text: '#3C3489'},
      {bg: '#FAECE7', border: '#F0997B', text: '#712B13'},
      {bg: '#FBEAF0', border: '#ED93B1', text: '#72243E'}
    ];

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 800 VIEWBOX_HEIGHT" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">';

    var rootX = 400;
    var rootY = 40;
    var rootW = 200;
    var rootH = 40;

    svg += '<rect x="' + (rootX - rootW/2) + '" y="' + rootY + '" width="' + rootW + '" height="' + rootH + '" rx="6" fill="#E6F1FB" stroke="#85B7EB" stroke-width="1.5"/>';
    svg += '<text x="' + rootX + '" y="' + (rootY + 25) + '" text-anchor="middle" font-size="13" font-weight="500" fill="#0C447C" font-family="Consolas, monospace">' + rootCidr + '</text>';

    var count = vlsmResults.length;
    var nodeW = 180;
    var nodeH = 50;
    var gap = 16;
    var cols = Math.min(count, 4);
    var rows = Math.ceil(count / cols);
    var startY = rootY + rootH + 50;

    for (var row = 0; row < rows; row++) {
      var itemsInRow = Math.min(cols, count - row * cols);
      var totalRowW = itemsInRow * nodeW + (itemsInRow - 1) * gap;
      var startX = rootX - totalRowW / 2;

      for (var col = 0; col < itemsInRow; col++) {
        var idx = row * cols + col;
        var r = vlsmResults[idx];
        var c = colors[idx % colors.length];
        var cx = startX + col * (nodeW + gap) + nodeW / 2;
        var cy = startY + row * (nodeH + 40);

        svg += '<line x1="' + rootX + '" y1="' + (rootY + rootH) + '" x2="' + cx + '" y2="' + cy + '" stroke="#ccc" stroke-width="1.5" stroke-dasharray="4,3"/>';

        svg += '<rect x="' + (cx - nodeW/2) + '" y="' + cy + '" width="' + nodeW + '" height="' + nodeH + '" rx="6" fill="' + c.bg + '" stroke="' + c.border + '" stroke-width="1.5"/>';
        svg += '<text x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle" font-size="12" font-weight="500" fill="' + c.text + '" font-family="Consolas, monospace">' + r.network + '</text>';
        svg += '<text x="' + cx + '" y="' + (cy + 38) + '" text-anchor="middle" font-size="10" fill="' + c.text + '" opacity="0.7">' + r.name + ' — ' + r.allocatedHosts + ' hosts</text>';
      }
    }

    var totalHeight = startY + rows * (nodeH + 40) + 20;
    svg = svg.replace('VIEWBOX_HEIGHT', totalHeight);
    svg += '</svg>';

    container.innerHTML = svg;
  },

  renderVlsmResults(container, results) {
    container.innerHTML = '';

    if (results.error) {
      container.innerHTML = '<div class="error-msg">' + results.error + '</div>';
      return;
    }

    let html = '<table class="vlsm-result-table"><thead><tr>' +
      '<th>Name</th><th>Network</th><th>Range</th><th>Mask</th><th>Hosts</th>' +
      '</tr></thead><tbody>';

    results.forEach(r => {
      html += '<tr>' +
        '<td class="name-col">' + r.name + '</td>' +
        '<td>' + r.network + '</td>' +
        '<td>' + r.firstHost + ' - ' + r.lastHost + '</td>' +
        '<td>' + r.mask + '</td>' +
        '<td>' + r.allocatedHosts + ' / ' + r.requestedHosts + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  generateMermaid(rootCidr, vlsmResults) {
    var lines = ['graph TD'];
    var rootId = 'ROOT';
    lines.push('    ' + rootId + '["' + rootCidr + '"]');

    vlsmResults.forEach(function(r, i) {
      var nodeId = 'S' + i;
      var label = r.network + '\\n' + r.name + ' — ' + r.allocatedHosts + ' hosts';
      lines.push('    ' + rootId + ' --> ' + nodeId + '["' + label + '"]');
    });

    return lines.join('\n');
  }
};
