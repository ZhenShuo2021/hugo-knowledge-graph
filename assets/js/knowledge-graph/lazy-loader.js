import { whenNearViewport } from './utils.js';

const { kgLib, kgApp } = document.querySelector('script[data-kg-app]').dataset;
const SEL = '[id^="kgw-root"], [id^="kg-root"]';
let loading;

const load = () => (loading ??= import(kgLib).then(() => import(kgApp)));

// Replaced by the real window.__HKG once the app loads.
function init(scope = document) {
	scope.querySelectorAll(SEL).forEach((el) => whenNearViewport(el, load));
}

window.__HKG = { init, destroy() {} };
init();
