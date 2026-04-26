import type { MaskDefinition, RectangleMaskParams } from "@/lib/masks/types";
import {
	BOX_LIKE_MASK_PARAMS,
	computeBoxMaskParamUpdate,
	getBoxLikeGeometry,
	getDefaultSquareMaskParams,
	getStrokeOffset,
	rotatePoint,
} from "./box-like";

function buildCrossPath({
	centerX,
	centerY,
	halfWidth,
	halfHeight,
	rotationRad,
}: {
	centerX: number;
	centerY: number;
	halfWidth: number;
	halfHeight: number;
	rotationRad: number;
}): Path2D {
	const t = 0.33;
	const toPoint = ({ localX, localY }: { localX: number; localY: number }) =>
		rotatePoint({
			x: centerX + localX,
			y: centerY + localY,
			centerX,
			centerY,
			rotationRad,
		});

	const points = [
		toPoint({ localX: -halfWidth * t, localY: -halfHeight }),
		toPoint({ localX: halfWidth * t, localY: -halfHeight }),
		toPoint({ localX: halfWidth * t, localY: -halfHeight * t }),
		toPoint({ localX: halfWidth, localY: -halfHeight * t }),
		toPoint({ localX: halfWidth, localY: halfHeight * t }),
		toPoint({ localX: halfWidth * t, localY: halfHeight * t }),
		toPoint({ localX: halfWidth * t, localY: halfHeight }),
		toPoint({ localX: -halfWidth * t, localY: halfHeight }),
		toPoint({ localX: -halfWidth * t, localY: halfHeight * t }),
		toPoint({ localX: -halfWidth, localY: halfHeight * t }),
		toPoint({ localX: -halfWidth, localY: -halfHeight * t }),
		toPoint({ localX: -halfWidth * t, localY: -halfHeight * t }),
	];

	const path = new Path2D();
	path.moveTo(points[0].x, points[0].y);
	for (const p of points.slice(1)) path.lineTo(p.x, p.y);
	path.closePath();
	return path;
}

function buildOverlayCrossPath({
	width,
	height,
}: {
	width: number;
	height: number;
}): string {
	const cx = width / 2;
	const cy = height / 2;
	const hw = width / 2;
	const hh = height / 2;
	const t = 0.33;
	return [
		`M ${cx - hw * t},${cy - hh}`,
		`L ${cx + hw * t},${cy - hh}`,
		`L ${cx + hw * t},${cy - hh * t}`,
		`L ${cx + hw},${cy - hh * t}`,
		`L ${cx + hw},${cy + hh * t}`,
		`L ${cx + hw * t},${cy + hh * t}`,
		`L ${cx + hw * t},${cy + hh}`,
		`L ${cx - hw * t},${cy + hh}`,
		`L ${cx - hw * t},${cy + hh * t}`,
		`L ${cx - hw},${cy + hh * t}`,
		`L ${cx - hw},${cy - hh * t}`,
		`L ${cx - hw * t},${cy - hh * t}`,
		"Z",
	].join(" ");
}

export const crossMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "cross",
	name: "Cross",
	overlayShape: "box",
	buildOverlayPath: buildOverlayCrossPath,
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return { type: "cross", params: getDefaultSquareMaskParams(context) };
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath({ resolvedParams, width, height }) {
			const params = resolvedParams as RectangleMaskParams;
			const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
				getBoxLikeGeometry({ params, width, height });
			return buildCrossPath({
				centerX,
				centerY,
				halfWidth: maskWidth / 2,
				halfHeight: maskHeight / 2,
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
			return buildCrossPath({
				centerX,
				centerY,
				halfWidth: Math.max(maskWidth / 2 + offset, 1),
				halfHeight: Math.max(maskHeight / 2 + offset, 1),
				rotationRad,
			});
		},
	},
};
