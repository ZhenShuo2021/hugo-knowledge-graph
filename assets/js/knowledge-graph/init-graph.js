import {
	initGraph,
	buildHopFilter,
	whenIdle,
	whenNearViewport,
	FULL_GRAPH_PARAMS,
	WIDGET_PARAMS,
	SHARED_PARAMS,
} from './main.js';

whenIdle(() => {
	if (document.getElementById('kg-root')) {
		initGraph(FULL_GRAPH_PARAMS, SHARED_PARAMS);
	}
});

document.querySelectorAll('[id^="kgw-root"]').forEach((rootEl) => {
	whenNearViewport(rootEl, () => {
		whenIdle(() => {
			const focalId = rootEl.dataset.focal ?? '';
			initGraph(WIDGET_PARAMS, SHARED_PARAMS, {
				rootEl,
				wrapId: 'kgw-wrap',
				showLayoutSwitcher: false,
				showSearch: false,
				showInfoCard: false,
				defaultLayout: 'uniform',
				filterNodes: focalId ? buildHopFilter(focalId, WIDGET_PARAMS.hopDepth) : null,
				onNodeClick: (node) => {
					if (node?.url) window.location.href = node.url;
				},
			});
		});
	});
});
