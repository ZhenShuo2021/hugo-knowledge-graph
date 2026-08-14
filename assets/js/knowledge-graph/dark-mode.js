const DEFAULT_SELECTORS = [
	'html[data-theme="dark"]',
	'body[data-theme="dark"]',
	'html[data-bs-theme="dark"]',
	'html[data-scheme="dark"]',
	'body[data-scheme="dark"]',
	'html[data-color-mode="dark"]',
	'body[data-color-mode="dark"]',
	'body.dark',
	'body.dark-mode',
	'body.dark-theme',
	'body.theme-dark',
	'html.dark',
	'html.dark-mode',
	'html.dark-theme',
	'html.theme-dark',
];

function buildSelectors(darkSelectors) {
	if (darkSelectors)
		return darkSelectors
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	return DEFAULT_SELECTORS;
}

function isDark(selectors) {
	return selectors.some((sel) => document.querySelector(sel) !== null);
}

export function onDarkModeChange(callback, params) {
	const selectors = buildSelectors(params.darkSelectors);
	let prev = isDark(selectors);

	const observer = new MutationObserver(() => {
		const next = isDark(selectors);
		if (next !== prev) {
			prev = next;
			callback();
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class', 'data-theme', 'data-bs-theme', 'data-scheme', 'data-color-mode'],
	});
	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ['class', 'data-theme', 'data-scheme', 'data-color-mode'],
	});

	return observer;
}
