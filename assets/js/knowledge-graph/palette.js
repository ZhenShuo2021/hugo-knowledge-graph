export const PALETTE = {};

// Converts rgb(r, g, b) to rgba(r, g, b, alpha)
export function toRgba(rgb, alpha) {
	return rgb.replace(/\s/g, '').replace('rgb(', `rgba(`).replace(')', `,${alpha})`);
}

export function syncPalette(sections = []) {
	const s = getComputedStyle(document.documentElement);
	const get = (v) => s.getPropertyValue(v).trim();
	const def = get('--kg-node-default');
	sections.forEach((sec) => {
		PALETTE[sec] = get(`--kg-node-${sec}`) || def;
	});
	PALETTE[''] = def;
	PALETTE.searchHighlight = get('--kg-node-search-highlight');
	PALETTE.searchDim = get('--kg-node-search-dim');
	PALETTE.hoverHighlightColor = get('--kg-node-hover-highlight');
	PALETTE.canvasBg = get('--kg-canvas-bg');
	PALETTE.canvasFg = get('--kg-canvas-fg');
	PALETTE.linkNormal = get('--kg-link-normal');
	PALETTE.linkNormalAlpha = parseFloat(get('--kg-link-normal-alpha'));
	PALETTE.linkDimAlpha = parseFloat(get('--kg-link-dim-alpha'));
}

export function pal(s) {
	return PALETTE[s] ?? PALETTE[''];
}
