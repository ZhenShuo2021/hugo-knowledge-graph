import { whenNearViewport } from './utils.js';

const { kgLib, kgApp } = document.querySelector('script[data-kg-app]').dataset;

document.querySelectorAll('[id^="kgw-root"], [id^="kg-root"]').forEach((el) =>
	whenNearViewport(el, async () => {
		await import(kgLib);
		await import(kgApp);
	}),
);
