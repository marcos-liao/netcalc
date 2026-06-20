# NetCalc — Dual-Stack Subnet Calculator

A lightweight, browser-based IPv4/IPv6 subnet calculator with visual tools for network engineers and students.

## Features

### Calculator
- IPv4 & IPv6 address calculation (CIDR notation)
- Network address, broadcast, usable range, total hosts, subnet mask, wildcard, IP class & type
- Bit-level visualizer — see network vs host bits
- Address block map — visual grid of all IPs in a subnet
- Quick Reference panel — CIDR table, private ranges (RFC 1918), IPv6 address types

### Subnetting
- **FLSM** (Fixed Length Subnet Masking) — divide network into equal-sized subnets (2/4/8/16/32/64)
- **VLSM** (Variable Length Subnet Masking) — allocate subnets based on required host counts
- Subnet Tree View — visual diagram of allocation hierarchy
- Mermaid Code output — copy & paste into draw.io or any Mermaid-compatible tool

### Export
- Excel (.xls) via footer button
- PDF via browser print (Ctrl+P)
- Diagram via Mermaid code → draw.io

## Usage

```bash
git clone https://github.com/yourusername/netcalc.git
cd netcalc
# Open index.html in your browser — that's it.
```

No build tools. No npm install. No dependencies to install.

Libraries are loaded via CDN on first use (D3.js, SheetJS) — internet required for first load.

## Screenshots

### Calculator Tab
Supports IPv4 and IPv6 with bit-level visualization and address block map.

### Subnetting Tab
FLSM for equal division, VLSM for variable allocation, with inline tree view and Mermaid export.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- No frameworks, no build step
- Dark mode support (auto-detect system preference)
- Responsive layout

## License

MIT License — see [LICENSE](LICENSE) file.
