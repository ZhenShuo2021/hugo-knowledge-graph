export function createHighlightState() {
	const highlightNodes = new Set();
	const highlightLinks = new Set();
	let hoverNode = null;
	let pinnedNode = null;
	let dimProgress = 0;
	let targetProgress = 0;
	let hoverLabelProgress = 0;
	let hoverLabelTarget = 0;
	let searchQuery = '';
	const legendSections = new Set();

	function getActive() {
		return pinnedNode ?? hoverNode ?? (legendSections.size > 0 ? true : null);
	}

	function setHighlight(node) {
		highlightNodes.clear();
		highlightLinks.clear();
		if (node) {
			highlightNodes.add(node);
			node.neighbors.forEach((n) => highlightNodes.add(n));
			node.links.forEach((l) => highlightLinks.add(l));
		}
		targetProgress = node ? 1 : 0;
	}

	function setLegendFilter(allNodes, allLinks) {
		highlightNodes.clear();
		highlightLinks.clear();
		if (legendSections.size === 0) {
			targetProgress = 0;
			return;
		}
		allNodes.forEach((n) => {
			if (legendSections.has(n.group || n.section)) highlightNodes.add(n);
		});
		allLinks.forEach((l) => {
			const srcNode = typeof l.source === 'object' ? l.source : null;
			const tgtNode = typeof l.target === 'object' ? l.target : null;
			if (
				srcNode &&
				tgtNode &&
				legendSections.has(srcNode.group || srcNode.section) &&
				legendSections.has(tgtNode.group || tgtNode.section)
			) {
				highlightLinks.add(l);
			}
		});
		targetProgress = 1;
	}

	function matchesSearch(node) {
		if (!searchQuery) return false;
		return node.title?.toLowerCase().includes(searchQuery);
	}

	return {
		highlightNodes,
		highlightLinks,
		get hoverNode() {
			return hoverNode;
		},
		set hoverNode(v) {
			hoverNode = v;
			hoverLabelTarget = pinnedNode && v && v !== pinnedNode ? 1 : 0;
		},
		get pinnedNode() {
			return pinnedNode;
		},
		set pinnedNode(v) {
			pinnedNode = v;
			hoverLabelTarget = v && hoverNode && hoverNode !== v ? 1 : 0;
		},
		get dimProgress() {
			return dimProgress;
		},
		set dimProgress(v) {
			dimProgress = v;
		},
		get targetProgress() {
			return targetProgress;
		},
		get hoverLabelProgress() {
			return hoverLabelProgress;
		},
		set hoverLabelProgress(v) {
			hoverLabelProgress = v;
		},
		get hoverLabelTarget() {
			return hoverLabelTarget;
		},
		get searchQuery() {
			return searchQuery;
		},
		set searchQuery(v) {
			searchQuery = v;
		},
		legendSections,
		matchesSearch,
		getActive,
		setHighlight,
		setLegendFilter,
	};
}
