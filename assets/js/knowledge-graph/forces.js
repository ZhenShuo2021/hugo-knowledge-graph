import { SHARED_PARAMS } from './constants.js';

const { forceCollide, forceX, forceY, forceRadial } = await import(SHARED_PARAMS.d3ForceSrc);

function collide(nodeVal, params) {
	return forceCollide((node) => Math.sqrt(nodeVal(node)) * params.nodeRelSize + 12).strength(0.5);
}

export function applyUniform(Graph, nodeVal, _nodes, params) {
	Graph.d3Force('radial', null);
	Graph.d3Force('collide', collide(nodeVal, params));
	Graph.d3Force('link').distance(params.linkDistance);
	Graph.d3Force('charge').strength(params.chargeStrength).distanceMin(30);
	Graph.d3Force('x', forceX(0).strength(0.1));
	Graph.d3Force('y', forceY(0).strength(0.1));
}

export function applyLayered(Graph, nodeVal, nodes, params) {
	const degreeMap = new Map(nodes.map((n) => [n.id, n.links.length]));
	Graph.d3Force('center', null);
	Graph.d3Force('collide', collide(nodeVal, params));
	Graph.d3Force('link').distance(params.linkDistance);
	Graph.d3Force('charge').strength(params.chargeStrength).distanceMin(30);
	Graph.d3Force('x', forceX(0).strength(0.1));
	Graph.d3Force('y', forceY(0).strength(0.1));
	Graph.d3Force(
		'radial',
		forceRadial((node) => {
			const deg = degreeMap.get(node.id) || 0;
			if (deg === 0) return 2000;
			return Math.max(0, 800 - deg * 50);
		}).strength(0.2),
	);
}

export function applyOrganic(Graph, nodeVal, _nodes, params) {
	Graph.d3Force('radial', null);
	Graph.d3Force('x', null);
	Graph.d3Force('y', null);
	Graph.d3Force('collide', collide(nodeVal, params));
	Graph.d3Force('link').distance(params.linkDistance / 2.5);
	Graph.d3Force('charge')
		.strength(params.chargeStrength / 10)
		.distanceMin(30);
}

const LAYOUTS = {
	uniform: applyUniform,
	layered: applyLayered,
	organic: applyOrganic,
};

export function applyForces(Graph, nodeVal, nodes, layout, params) {
	LAYOUTS[layout]?.(Graph, nodeVal, nodes, params);
}
