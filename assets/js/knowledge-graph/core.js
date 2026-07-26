import { pal, syncPalette, PALETTE } from './palette.js';
import { createHighlightState } from './highlight.js';
import {
	makeLinkColor,
	makeArrowColor,
	onRenderFramePre,
	onRenderFramePost,
	nodeCanvasObject,
} from './render-graph.js';
import { applyForces } from './forces.js';
import { onDarkModeChange } from './dark-mode.js';
import { setupInfoCard, setupLegend, setupSearch, setupResize } from './render-ui.js';
import { lerpColor } from './utils.js';
const $ = (id) => document.getElementById(id);

const graphDataPromise = (() => {
	const ref = $('kg-root') ?? document.querySelector('[id^="kgw-root"]');
	if (!ref) return Promise.resolve(null);
	const baseURL = (ref.getAttribute('data-url') || '').replace(/\/?$/, '/');
	const hash = ref.getAttribute('data-hash') || '';
	return fetch(`${baseURL}knowledge-graph.json?v=${hash}`).then((r) => r.json());
})();

export async function initGraph(params, params_shared, config = {}) {
	const rootEl = config.rootEl ?? $('kg-root');
	const wrapId = config.wrapId ?? 'kg-wrap';
	const showLayoutSwitcher = config.showLayoutSwitcher ?? true;
	const showSearch = config.showSearch ?? true;
	const showInfoCard = config.showInfoCard ?? true;
	const defaultLayout = config.defaultLayout ?? 'uniform';

	let data;
	try {
		data = await graphDataPromise;
		if (!data) throw new Error();
	} catch {
		rootEl.querySelector('#' + wrapId).textContent = 'Failed to load knowledge-graph.json';
		return;
	}

	const rawNodes = data.nodes
		.filter((d) => params.showTags || d.section !== 'tag')
		.map((d) => ({ ...d, neighbors: [], links: [], x: 0, y: 0 }));

	const nodes = config.filterNodes ? config.filterNodes(rawNodes, data.edges) : rawNodes;
	const groups = [...new Set(nodes.map((n) => n.group || n.section))];
	syncPalette(groups);
	const nodeById = new Map(nodes.map((n) => [n.id, n]));
	const seenEdges = new Set();
	const links = data.edges
		.filter((e) => {
			const key = JSON.stringify(e);
			if (seenEdges.has(key)) return false;
			seenEdges.add(key);
			return true;
		})
		.map((d) => ({ ...d }))
		.filter((e) => nodeById.has(e.source) && nodeById.has(e.target));

	links.forEach((link) => {
		const a = nodeById.get(link.source);
		const b = nodeById.get(link.target);
		if (!a || !b) return;
		if (!a.neighbors.includes(b)) a.neighbors.push(b);
		if (!b.neighbors.includes(a)) b.neighbors.push(a);
		a.links.push(link);
		b.links.push(link);
	});

	const inDeg = {};
	links.forEach((l) => {
		if (l.type === 'link') inDeg[l.target] = (inDeg[l.target] || 0) + 1;
	});

	const tagCount = {};
	links.forEach((l) => {
		if (l.type === 'tag') {
			const tgt = typeof l.target === 'object' ? l.target.id : l.target;
			tagCount[tgt] = (tagCount[tgt] || 0) + 1;
		}
	});

	const visibleTagIds = new Set(
		nodes.filter((d) => d.section === 'tag' && (tagCount[d.id] || 0) >= params.tagMinCount).map((d) => d.id),
	);

	const nodeVal = (d) => {
		const deg = d.section === 'tag' ? tagCount[d.id] || 0 : inDeg[d.id] || 0;
		return Math.max(
			params.nodeValMin,
			Math.min(params.nodeValMax, params.nodeValMin + params.nodeValMin * deg * params.nodeValDegScale),
		);
	};

	const state = createHighlightState();
	const wrap = rootEl.querySelector('#' + wrapId);

	const { showInfo, hideInfo } = showInfoCard
		? setupInfoCard(state, tagCount, inDeg)
		: { showInfo: () => {}, hideInfo: () => {} };

	function clearPin() {
		state.pinnedNode = null;
		state.setHighlight(state.hoverNode);
		hideInfo();
	}

	const Graph = new ForceGraph(wrap)
		.width(wrap.clientWidth)
		.height(wrap.clientHeight)
		.backgroundColor(PALETTE.canvasBg)
		.graphData({ nodes, links })
		.linkHoverPrecision(1)
		.autoPauseRedraw(false)
		.nodeId('id')
		.nodeVal(nodeVal)
		.nodeRelSize(params.nodeRelSize)
		.nodeColor((d) => pal(d.group || d.section))
		.nodeLabel('')
		.nodeVisibility((d) => {
			if (d.section !== 'tag') return true;
			return visibleTagIds.has(d.id);
		})
		.linkSource('source')
		.linkTarget('target')
		.linkColor(makeLinkColor(state))
		.linkVisibility((l) => {
			const src = typeof l.source === 'object' ? l.source.id : l.source;
			const tgt = typeof l.target === 'object' ? l.target.id : l.target;
			if (l.type === 'tag') return visibleTagIds.has(src) || visibleTagIds.has(tgt);
			return true;
		})
		.linkWidth((l) => (l.type === 'link' ? 0.7 : 0.7))
		.linkCurvature(0)
		.enableNodeDrag(true)
		.enableZoomInteraction(true)
		.enablePanInteraction(true)
		.onRenderFramePre(onRenderFramePre(state, params))
		.onRenderFramePost(onRenderFramePost(state, nodeVal, () => Graph, params, params_shared, visibleTagIds))
		.nodeCanvasObjectMode((node) => (node.section === 'tag' ? 'replace' : 'after'))
		.nodeCanvasObject(nodeCanvasObject(state, nodeVal, params))
		.enablePointerInteraction(true)
		.onNodeHover((node) => {
			wrap.style.cursor = node ? 'pointer' : 'default';
			if (state.pinnedNode) {
				state.hoverNode = node || null;
			} else if (state.legendSections.size > 0) {
				state.hoverNode = node || null;
				if (node) {
					showInfo(node, false);
				} else {
					hideInfo();
				}
			} else {
				state.hoverNode = node || null;
				state.setHighlight(state.hoverNode);
				if (node) {
					showInfo(node, false);
				} else {
					hideInfo();
				}
			}
		})
		.onBackgroundClick(() => {
			state.legendSections.clear();
			rootEl.querySelectorAll('.leg-item').forEach((el) => el.classList.remove('active'));
			clearPin();
		})
		.onNodeClick((node) => {
			if (config.onNodeClick) {
				config.onNodeClick(node);
				return;
			}
			state.legendSections.clear();
			rootEl.querySelectorAll('.leg-item').forEach((el) => el.classList.remove('active'));
			if (state.pinnedNode === node) {
				clearPin();
			} else {
				state.pinnedNode = node;
				state.hoverNode = null;
				state.setHighlight(node);
				showInfo(node, true);
			}
		});

	Graph.zoom(params.graphZoomInit);

	const VALID_LAYOUTS = ['uniform', 'layered', 'organic'];
	let currentLayout;
	if (VALID_LAYOUTS.includes(params.fixedLayout)) {
		currentLayout = params.fixedLayout;
	} else if (showLayoutSwitcher) {
		const LAYOUT_KEY = 'yore-kg-layout';
		const saved = localStorage.getItem(LAYOUT_KEY);
		currentLayout = VALID_LAYOUTS.includes(saved) ? saved : defaultLayout;

		const layoutBtns = rootEl.querySelectorAll('#kg-layout-switcher [data-layout]');
		layoutBtns.forEach((btn) => {
			btn.classList.toggle('active', btn.dataset.layout === currentLayout);
			btn.addEventListener('click', () => {
				if (btn.dataset.layout === currentLayout) return;
				currentLayout = btn.dataset.layout;
				localStorage.setItem(LAYOUT_KEY, currentLayout);
				layoutBtns.forEach((b) => b.classList.toggle('active', b.dataset.layout === currentLayout));
				applyForces(Graph, nodeVal, nodes, currentLayout, params);
				Graph.d3ReheatSimulation();
			});
		});
	} else {
		currentLayout = defaultLayout;
	}
	applyForces(Graph, nodeVal, nodes, currentLayout, params);

	const { syncLegendColors } = setupLegend(rootEl, nodes, links, tagCount, Graph, state);
	if (showSearch) setupSearch(nodes, Graph, state, params);
	setupResize(wrap, Graph);

	const nodeAtEvent = (e) => {
		const rect = wrap.querySelector('canvas').getBoundingClientRect();
		const g = Graph.screen2GraphCoords(e.clientX - rect.left, e.clientY - rect.top);
		return (
			nodes.find((n) => {
				const dx = (n.x ?? 0) - g.x,
					dy = (n.y ?? 0) - g.y;
				return Math.hypot(dx, dy) < Math.sqrt(nodeVal(n)) * params.nodeRelSize + 4;
			}) ?? null
		);
	};
	wrap.addEventListener('auxclick', (e) => {
		if (e.button === 1) {
			e.preventDefault();
			const node = nodeAtEvent(e);
			if (node?.url) window.open(node.url, '_blank', 'noopener');
		}
	});

	onDarkModeChange(() => {
		syncPalette(groups);
		syncLegendColors();
		Graph.backgroundColor(PALETTE.canvasBg)
			.nodeColor((d) => pal(d.group || d.section))
			.linkColor(makeLinkColor(state))
			.linkDirectionalArrowColor(makeArrowColor(state));
	}, params_shared);
}
