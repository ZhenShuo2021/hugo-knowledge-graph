import { pal, PALETTE } from './palette.js';

const $ = (id) => document.getElementById(id);

export function setupInfoCard(state, tagCount, inDeg) {
	const relatedLabel = document.getElementById('kg-root').dataset.relatedLabel || 'Related Articles';

	function showInfo(d, pinned = false) {
		const box = $('kg-info');
		const titleEl = $('ki-title');
		if (d.url) {
			titleEl.innerHTML = `<a href="${d.url}" style="color:inherit;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:1px;">${d.title}</a>`;
		} else {
			titleEl.textContent = d.title;
		}
		$('ki-meta').textContent =
			d.section === 'tag'
				? `tag | used by ${tagCount[d.id] || 0} pages`
				: `${d.section || 'page'} | ${(d.words || 0).toLocaleString()} words | ${inDeg[d.id] || 0} backlinks`;
		$('ki-tags').innerHTML = (d.tags || [])
			.slice(0, 5)
			.map((t) => `<span>${t}</span>`)
			.join('');

		const relatedEl = $('ki-related');
		if (relatedEl) {
			const neighbors = d.neighbors || [];
			if (neighbors.length > 0) {
				relatedEl.innerHTML =
					'<div class="ki-related-label">' +
					relatedLabel +
					'</div>' +
					'<div class="ki-related-scroll">' +
					neighbors
						.map((n) =>
							n.url
								? `<a class="ki-related-item" href="${n.url}">${n.title || n.id}</a>`
								: `<div class="ki-related-item">${n.title || n.id}</div>`,
						)
						.join('') +
					'</div>';
				relatedEl.style.display = 'block';
			} else {
				relatedEl.innerHTML = '';
				relatedEl.style.display = 'none';
			}
		}
		box.classList.toggle('pinned', pinned);
		box.classList.add('show');
	}

	function hideInfo() {
		$('kg-info').classList.remove('show', 'pinned');
	}

	const closeBtn = $('ki-close');
	if (closeBtn) {
		closeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			state.pinnedNode = null;
			state.setHighlight(state.hoverNode);
			hideInfo();
		});
	}

	return { showInfo, hideInfo };
}

export function setupLegend(root, nodes, _links, _tagCount, Graph, state) {
	const sections = [...new Set(nodes.map((n) => n.group || n.section))].sort();
	const legendEl = root.querySelector('.kg-legend');
	if (!legendEl) return { syncLegendColors: () => {} };

	sections.forEach((sec) => {
		const item = document.createElement('div');
		item.className = 'leg-item';
		const dot = document.createElement('span');
		dot.className = 'leg-dot';
		dot.style.background = pal(sec);
		item.appendChild(dot);
		item.appendChild(document.createTextNode(sec || 'page'));
		item.onclick = () => {
			state.legendSections.has(sec) ? state.legendSections.delete(sec) : state.legendSections.add(sec);
			item.classList.toggle('active', state.legendSections.has(sec));
			state.pinnedNode = null;
			state.hoverNode = null;
			state.setLegendFilter(Graph.graphData().nodes, Graph.graphData().links);
		};
		legendEl.appendChild(item);
	});

	function syncLegendColors() {
		legendEl.querySelectorAll('.leg-item').forEach((item, i) => {
			item.querySelector('.leg-dot').style.background = pal(sections[i]);
		});
	}

	return { syncLegendColors };
}

export function setupSearch(nodes, Graph, state, params) {
	const searchEl = $('kg-search');
	const searchWrap = $('kg-search-wrap');

	function applySearch(q) {
		searchWrap.classList.toggle('has-value', q.length > 0);
		state.searchQuery = q;
		Graph.nodeColor((d) => {
			if (!q) return pal(d.group || d.section);
			if (state.matchesSearch(d)) return pal('searchHighlight');
			return PALETTE.searchDim;
		});
		if (!q) return;
		const matched = nodes.filter((n) => state.matchesSearch(n));
		if (matched.length === 1) {
			Graph.centerAt(matched[0].x, matched[0].y, 500);
			Graph.zoom(params.searchZoomDest, params.searchZoomDur);
		}
	}

	searchEl.addEventListener('input', (e) => applySearch(e.target.value.trim().toLowerCase()));

	const clearBtn = $('kg-search-clear');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			searchEl.value = '';
			applySearch('');
			searchEl.focus();
		});
	}
}

export function setupResize(wrap, Graph) {
	new ResizeObserver(() => {
		Graph.width(wrap.clientWidth).height(wrap.clientHeight);
	}).observe(wrap);
}
