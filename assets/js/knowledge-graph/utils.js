export function parseColor(str) {
	if (!str) return { r: 128, g: 128, b: 128, a: 1 };
	const s = str.trim();
	if (s[0] === '#') {
		const h = s.slice(1);
		const n = parseInt(
			h.length === 3
				? h
						.split('')
						.map((c) => c + c)
						.join('')
				: h,
			16,
		);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
	}
	const m = s.match(/[\d.]+/g);
	if (m) return { r: +m[0], g: +m[1], b: +m[2], a: m[3] !== undefined ? +m[3] : 1 };
	return { r: 128, g: 128, b: 128, a: 1 };
}

export function lerp(a, b, t) {
	return a + (b - a) * t;
}

export function lerpColor(fromStr, toStr, t) {
	const f = parseColor(fromStr);
	const to = parseColor(toStr);
	return `rgba(${Math.round(lerp(f.r, to.r, t))},${Math.round(lerp(f.g, to.g, t))},${Math.round(lerp(f.b, to.b, t))},${lerp(f.a, to.a, t).toFixed(3)})`;
}

export function truncateLabel(title, maxChars) {
	if (!title) return '';
	return title.length > maxChars ? title.slice(0, maxChars) + '…' : title;
}
