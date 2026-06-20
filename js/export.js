const Export = {
  currentData: null,

  setData(data) {
    this.currentData = data;
  },

  buildReportHTML(forPrint) {
    var d = this.currentData;
    if (!d) return '';

    var style = forPrint
      ? 'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1c1917;font-size:13px;}' +
        '@media print{body{padding:0;}}'
      : 'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1c1917;font-size:13px;background:#fff;}';

    style += 'h1{font-size:18px;font-weight:600;margin:0 0 4px;}' +
      '.subtitle{color:#57534e;font-size:12px;margin:0 0 20px;}' +
      '.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}' +
      '.card{background:#f5f5f4;border-radius:6px;padding:10px;}' +
      '.card-label{font-size:10px;color:#57534e;text-transform:uppercase;letter-spacing:0.5px;}' +
      '.card-value{font-size:13px;font-weight:500;font-family:Consolas,monospace;margin-top:2px;}' +
      'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;}' +
      'th{text-align:left;font-size:10px;font-weight:500;color:#57534e;text-transform:uppercase;letter-spacing:0.5px;padding:8px;border-bottom:1px solid #e7e5e4;}' +
      'td{padding:8px;font-family:Consolas,monospace;border-bottom:1px solid #e7e5e4;}' +
      '.name-col{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-weight:500;}' +
      '.section-title{font-size:13px;font-weight:500;color:#57534e;margin:20px 0 8px;}' +
      '.tree-container{text-align:center;padding:16px;border:1px solid #e7e5e4;border-radius:6px;margin-top:12px;}';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>NetCalc Report</title><style>' + style + '</style></head><body>';
    html += '<h1>NetCalc Report</h1>';
    html += '<p class="subtitle">Generated ' + new Date().toLocaleString() + '</p>';

    html += '<div class="cards">';
    var cards = [
      ['Network', d.network || '—'],
      ['Broadcast', d.broadcast || '—'],
      ['Usable range', (d.firstHost && d.lastHost) ? d.firstHost + ' — ' + d.lastHost : '—'],
      ['Total hosts', d.totalHosts !== undefined ? d.totalHosts.toLocaleString() : '—'],
      ['Subnet mask', d.mask || '—'],
      ['Wildcard', d.wildcard || '—'],
      ['Class', d.ipClass || '—'],
      ['Type', d.ipType || '—']
    ];
    cards.forEach(function(c) {
      html += '<div class="card"><div class="card-label">' + c[0] + '</div><div class="card-value">' + c[1] + '</div></div>';
    });
    html += '</div>';

    if (d.subnets && d.subnets.length > 0) {
      html += '<div class="section-title">Subnet allocation</div>';
      html += '<table><thead><tr><th>Name</th><th>Network</th><th>Range</th><th>Mask</th><th>Hosts</th></tr></thead><tbody>';
      d.subnets.forEach(function(s) {
        var name = s.name || s.network;
        var range = s.range || (s.firstHost + ' — ' + s.lastHost);
        var mask = s.mask || '';
        var hosts = s.allocatedHosts !== undefined ? (s.allocatedHosts + ' / ' + s.requestedHosts) : (s.hosts || '');
        html += '<tr><td class="name-col">' + name + '</td><td>' + (s.network || '') + '</td><td>' + range + '</td><td>' + mask + '</td><td>' + hosts + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    var treeSvg = document.getElementById('subnet-tree');
    if (treeSvg && treeSvg.querySelector('svg')) {
      html += '<div class="section-title">Subnet tree view</div>';
      html += '<div class="tree-container">' + treeSvg.innerHTML + '</div>';
    }

    html += '</body></html>';
    return html;
  },

  toExcel() {
    if (!this.currentData) return;

    var d = this.currentData;
    var tsv = 'Property\tValue\n';
    tsv += 'IP Address\t' + (d.ip || d.network || '') + '\n';
    tsv += 'Prefix\t/' + d.prefix + '\n';
    tsv += 'Network\t' + (d.network || '') + '\n';
    tsv += 'Broadcast\t' + (d.broadcast || '') + '\n';
    tsv += 'First Host\t' + (d.firstHost || '') + '\n';
    tsv += 'Last Host\t' + (d.lastHost || '') + '\n';
    tsv += 'Total Hosts\t' + (d.totalHosts || '') + '\n';
    tsv += 'Subnet Mask\t' + (d.mask || '') + '\n';
    tsv += 'Wildcard\t' + (d.wildcard || '') + '\n';
    tsv += 'Class\t' + (d.ipClass || '') + '\n';
    tsv += 'Type\t' + (d.ipType || '') + '\n';

    if (d.subnets && d.subnets.length > 0) {
      tsv += '\nName\tNetwork\tRange\tMask\tAllocated\tRequested\n';
      d.subnets.forEach(function(s) {
        var range = s.range || (s.firstHost + ' - ' + s.lastHost);
        tsv += (s.name || '') + '\t' + (s.network || '') + '\t' + range + '\t' + (s.mask || '') + '\t' + (s.allocatedHosts || s.hosts || '') + '\t' + (s.requestedHosts || '') + '\n';
      });
    }

    this.download(tsv, 'netcalc-report.xls', 'application/vnd.ms-excel');
  },

  toPDF() {
    var html = this.buildReportHTML(true);
    if (!html) return;

    var win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(function() {
      win.print();
    }, 300);
  },

  toHTML() {
    var html = this.buildReportHTML(false);
    if (!html) return;
    this.download(html, 'netcalc-report.html', 'text/html');
  },

  download(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
