import type { MaskDefinition, RectangleMaskParams } from "@/lib/masks/types";
import {
	BOX_LIKE_MASK_PARAMS,
	computeBoxMaskParamUpdate,
	getBoxLikeGeometry,
	getDefaultSquareMaskParams,
	getStrokeOffset,
	rotatePoint,
} from "./box-like";

function buildRoundedRectPath({
	centerX,
	centerY,
	halfWidth,
	halfHeight,
	radius,
	rotationRad,
}: {
	centerX: number;
	centerY: number;
	halfWidth: number;
	halfHeight: number;
	radius: number;
	rotationRad: number;
}): Path2D {
	const r = Math.min(radius, halfWidth, halfHeight);
	const path = new Path2D();
	const corners = [
		{ x: centerX - halfWidth, y: centerY - halfHeight, cx: 1, cy: 1 },
		{ x: centerX + halfWidth, y: centerY - halfHeight, cx: -1, cy: 1 },
		{ x: centerX + halfWidth, y: centerY + halfHeight, cx: -1, cy: -1 },
		{ x: centerX - halfWidth, y: centerY + halfHeight, cx: 1, cy: -1 },
	];

	const first = rotatePoint({
		x: corners[0].x + r * corners[0].cx,
		y: corners[0].y,
		centerX,
		centerY,
		rotationRad,
	});
	path.moveTo(first.x, first.y);

	for (const corner of corners) {
		const arcStart = rotatePoint({
			x: corner.x + r * corner.cx,
			y: corner.y,
			centerX,
			centerY,
			rotationRad,
		});
		const arcEnd = rotatePoint({
			x: corner.x,
			y: corner.y + r * corner.cy,
			centerX,
			centerY,
			rotationRad,
		});
		path.lineTo(arcStart.x, arcStart.y);
		path.arcTo(arcStart.x, arcStart.y, arcEnd.x, arcEnd.y, r);
		path.lineTo(arcEnd.x, arcEnd.y);
	}
	path.closePath();
	return path;
}

function buildOverlayRoundedRectPath({
	width,
	height,
}: {
	width: number;
	height: number;
}): string {
	const r = Math.min(width, height) * 0.15;
	const hw = width / 2;
	const hh = height / 2;
	const cx = hw;
	const cy = hh;
	return [
		`M ${cx - hw + r},${cy - hh}`,
		`L ${cx + hw - r},${cy - hh}`,
		`A ${r},${r} 0 0,1 ${cx + hw},${cy - hh + r}`,
		`L ${cx + hw},${cy + hh - r}`,
		`A ${r},${r} 0 0,1 ${cx + hw - r},${cy + hh}`,
		`L ${cx - hw + r},${cy + hh}`,
		`A ${r},${r} 0 0,1 ${cx - hw},${cy + hh - r}`,
		`L ${cx - hw},${cy - hh + r}`,
		`A ${r},${r} 0 0,1 ${cx - hw + r},${cy - hh}`,
		"Z",
	].join(" ");
}

export const roundedRectMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "rounded-rect",
	name: "Rounded Rect",
	overlayShape: "box",
	buildOverlayPath: buildOverlayRoundedRectPath,
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return {
			type: "rounded-rect",
			params: getDefaultSquareMaskParams(context),
		};
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath({ resolvedParams, width, height }) {
			const params = resolvedParams as RectangleMaskParams;
			const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
				getBoxLikeGeometry({ params, width, height });
			const radius = Math.min(maskWidth, maskHeight) * 0.15;
			return buildRoundedRectPath({
				centerX,
				centerY,
				halfWidth: maskWidth / 2,
				halfHeight: maskHeight / 2,
				radius,
				rotationRad,
			});
		},
		buildStrokePath({ resolvedParams, width, height }) {
			const params = resolvedParams as RectangleMaskParams;
			const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
				getBoxLikeGeometry({ params, width, height });
			const offset = getStrokeOffset({
				strokeAlign: params.strokeAlign,
				strokeWidth: params.strokeWidth,
			});
			const mw = Math.max(maskWidth / 2 + offset, 1);
			const mh = Math.max(maskHeight / 2 + offset, 1);
			const radius = Math.min(mw * 2, mh * 2) * 0.15;
			return buildRoundedRectPath({
				centerX,
				centerY,
				halfWidth: mw,
				halfHeight: mh,
				radius,
				rotationRad,
			});
		},
	},
};
