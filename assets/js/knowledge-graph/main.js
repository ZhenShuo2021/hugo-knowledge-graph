import { initGraph } from './core.js';
import { FULL_GRAPH_PARAMS, WIDGET_PARAMS, SHARED_PARAMS } from './constants.js';

function buildHopFilter(focalId, hops) {
	return (allNodes, allEdges) => {
		const adj = new Map();
		allEdges.forEach(({ source, target }) => {
			if (!adj.has(source)) adj.set(source, []);
			if (!adj.has(target)) adj.set(target, []);
			adj.get(source).push(target);
			adj.get(target).push(source);
		});
		const visited = new Set([focalId]);
		let frontier = [focalId];
		for (let h = 0; h < hops; h++) {
			const next = [];
			frontier.forEach((id) => {
				(adj.get(id) ?? []).forEach((nbr) => {
					if (!visited.has(nbr)) {
						visited.add(nbr);
						next.push(nbr);
					}
				});
			});
			frontier = next;
		}
		return allNodes.filter((n) => visited.has(n.id));
	};
}

function whenIdle(fn, timeout = 3000) {
	if ('requestIdleCallback' in window) {
		requestIdleCallback(fn, { timeout });
	} else {
		setTimeout(fn, timeout);
	}
}

function whenNearViewport(el, onEnter) {
	if (!('IntersectionObserver' in window)) {
		onEnter();
		return;
	}
	const margin = `${Math.round(window.innerHeight * 1.5)}px 0px`;
	const io = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				io.disconnect();
				onEnter();
			}
		},
		{ rootMargin: margin, threshold: 0 },
	);
	io.observe(el);
}

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
