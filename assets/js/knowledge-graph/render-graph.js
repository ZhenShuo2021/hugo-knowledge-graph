import { lerp, lerpColor, truncateLabel } from './utils.js';
import { pal, PALETTE, toRgba } from './palette.js';

export function linkNormalColor() {
	return toRgba(PALETTE.linkNormal, PALETTE.linkNormalAlpha);
}

export function linkDimColor() {
	return toRgba(PALETTE.linkNormal, PALETTE.linkDimAlpha);
}

export function makeLinkColor(state) {
	return (l) => {
		const t = state.dimProgress;
		if (t === 0) return linkNormalColor();
		return state.highlightLinks.has(l)
			? lerpColor(linkNormalColor(), pal('hoverHighlightColor'), t)
			: lerpColor(linkNormalColor(), linkDimColor(), t);
	};
}

export function makeArrowColor(state) {
	return (l) => {
		const baseColor = pal(l.source?.group || (l.source?.section ?? ''));
		if (state.dimProgress === 0) return baseColor;
		if (state.highlightLinks.has(l)) return lerpColor(baseColor, pal('hoverHighlightColor'), state.dimProgress);
		return toRgba(PALETTE.linkNormal, 0);
	};
}

export function onRenderFramePre(state, params) {
	return () => {
		if (state.dimProgress !== state.targetProgress) {
			state.dimProgress =
				Math.abs(state.targetProgress - state.dimProgress) < 0.01
					? state.targetProgress
					: lerp(state.dimProgress, state.targetProgress, params.animSpeed);
		}
		if (state.hoverLabelProgress !== state.hoverLabelTarget) {
			state.hoverLabelProgress =
				Math.abs(state.hoverLabelTarget - state.hoverLabelProgress) < 0.01
					? state.hoverLabelTarget
					: lerp(state.hoverLabelProgress, state.hoverLabelTarget, params.animSpeed);
		}
	};
}

export function onRenderFramePost(state, nodeVal, graphRef, params, params_shared, visibleTagIds) {
	return (ctx, globalScale) => {
		const activeNode = state.getActive();
		const graphNodes = graphRef().graphData().nodes;

		function drawLabel(node, alpha, opaqueBg) {
			const isTag = node.section === 'tag';
			const size = isTag
				? Math.sqrt(Math.max(0, nodeVal(node))) * params.nodeRelSize * 0.8
				: Math.sqrt(Math.max(0, nodeVal(node))) * params.nodeRelSize;

			const fontSize = Math.max(params.labelFontMin, (size * params.labelFontScale) / globalScale);
			ctx.font = `${fontSize}px Sans-Serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			const yOffset = size + params.labelOffsetPx / globalScale;

			const isHoverTarget = node === state.hoverNode;
			const displayLabel =
				isHoverTarget || (activeNode && node === activeNode)
					? node.title || ''
					: truncateLabel(node.title, params.labelMaxChars);
			if (!displayLabel) return;

			const metrics = ctx.measureText(displayLabel);
			const textWidth = metrics.width;
			const textHeight = fontSize;
			const padX = 2 / globalScale;
			const padY = 1 / globalScale;

			const bgAlpha = opaqueBg ? 1 : alpha * 0.75;
			ctx.fillStyle = toRgba(PALETTE.canvasBg, bgAlpha);
			ctx.fillRect(
				node.x - textWidth / 2 - padX,
				node.y + yOffset - padY,
				textWidth + padX * 2,
				textHeight + padY * 2,
			);

			ctx.fillStyle = toRgba(PALETTE.canvasFg, alpha);
			ctx.fillText(displayLabel, node.x, node.y + yOffset);
		}

		const zoomOpacity =
			globalScale < params.labelZoomThreshold
				? 0
				: Math.min(
						1,
						(globalScale - params.labelZoomThreshold) / (params.labelZoomThreshold * params.labelFadeRate),
					);

		graphNodes.forEach((node) => {
			if (!node.x && node.x !== 0) return;
			if (node.section === 'tag' && !visibleTagIds.has(node.id)) return;
			if (node === state.hoverNode) return;
			const isHighlighted = activeNode && state.highlightNodes.has(node);
			const dimOpacity = activeNode ? (isHighlighted ? state.dimProgress : state.dimProgress * 0.1) : 1;
			const hoverDim = state.hoverNode ? 0.15 : 1;
			const forceShow = isHighlighted || (activeNode && node === activeNode);
			const alpha = forceShow ? hoverDim : zoomOpacity * dimOpacity * hoverDim;
			if (alpha < 0.01) return;
			drawLabel(node, alpha, false);
		});

		if (state.hoverNode && state.hoverNode.x != null) {
			if (state.hoverNode.section === 'tag' && !visibleTagIds.has(state.hoverNode.id)) return;
			const alpha = state.hoverLabelProgress || 1;
			drawLabel(state.hoverNode, alpha, true);
		}
	};
}

export function nodeCanvasObject(state, nodeVal, params) {
	return (node, ctx) => {
		const activeNode = state.getActive();

		if (node.section === 'tag') {
			const size = Math.sqrt(Math.max(0, nodeVal(node))) * params.nodeRelSize * 0.8;
			ctx.beginPath();
			ctx.moveTo(node.x, node.y - size);
			ctx.lineTo(node.x + size, node.y);
			ctx.lineTo(node.x, node.y + size);
			ctx.lineTo(node.x - size, node.y);
			ctx.closePath();
			ctx.fillStyle = state.matchesSearch(node) ? pal('searchHighlight') : pal('tag');
			ctx.fill();

			const shouldDim =
				(activeNode && !state.highlightNodes.has(node)) || (state.searchQuery && !state.matchesSearch(node));
			if (shouldDim) {
				ctx.beginPath();
				ctx.moveTo(node.x, node.y - size);
				ctx.lineTo(node.x + size, node.y);
				ctx.lineTo(node.x, node.y + size);
				ctx.lineTo(node.x - size, node.y);
				ctx.closePath();
				ctx.fillStyle = toRgba(PALETTE.canvasBg, 0.94 * state.dimProgress);
				ctx.fill();
			}
			return;
		}

		const val = Math.max(0, nodeVal(node));
		const r = Math.sqrt(val) * params.nodeRelSize + Math.pow(val, 0.25);
		if (activeNode && !state.highlightNodes.has(node)) {
			ctx.beginPath();
			ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
			ctx.fillStyle = toRgba(PALETTE.canvasBg, 0.94 * state.dimProgress);
			ctx.fill();
		}
	};
}
