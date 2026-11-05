import {
	initGraph,
	buildHopFilter,
	whenIdle,
	whenNearViewport,
	FULL_GRAPH_PARAMS,
	WIDGET_PARAMS,
	SHARED_PARAMS,
} from './main.js';

const SEL = '#kg-root,[id^="kgw-root"]';
const instances = new Map(); // rootEl -> instance | null (pending)

function mount(rootEl) {
	if (instances.has(rootEl)) return;
	instances.set(rootEl, null);

	const isWidget = rootEl.id.startsWith('kgw-root');
	const wrapId = isWidget ? 'kgw-wrap' : 'kg-wrap';
	// Cached DOM snapshots may carry a stale canvas
	if (rootEl.dataset.kgInit) rootEl.querySelector('#' + wrapId)?.replaceChildren();
	rootEl.dataset.kgInit = '1';

	const run = async () => {
		if (!instances.has(rootEl)) return; // destroyed before start
		const inst = isWidget
			? await initGraph(WIDGET_PARAMS, SHARED_PARAMS, {
					rootEl,
					wrapId,
					showLayoutSwitcher: false,
					showSearch: false,
					showInfoCard: false,
					defaultLayout: 'uniform',
					filterNodes: rootEl.dataset.focal
						? buildHopFilter(rootEl.dataset.focal, WIDGET_PARAMS.hopDepth)
						: null,
					onNodeClick: (node) => {
						if (node?.url) window.location.href = node.url;
					},
				})
			: await initGraph(FULL_GRAPH_PARAMS, SHARED_PARAMS, { rootEl });
		if (instances.has(rootEl)) instances.set(rootEl, inst ?? null);
		else inst?.destroy(); // destroyed while loading
	};

	if (isWidget) whenNearViewport(rootEl, () => whenIdle(run));
	else whenIdle(run);
}

export function init(scope = document) {
	if (scope.matches?.(SEL)) mount(scope);
	scope.querySelectorAll?.(SEL).forEach(mount);
}

export function destroy(scope = document) {
	[...instances.keys()].forEach((el) => {
		if (scope === el || scope.contains(el)) {
			instances.get(el)?.destroy();
			instances.delete(el);
		}
	});
}

window.__HKG = { init, destroy };
init();
