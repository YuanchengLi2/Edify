import type { MaskDefinition, RectangleMaskParams } from "@/lib/masks/types";
import {
	BOX_LIKE_MASK_PARAMS,
	computeBoxMaskParamUpdate,
	getBoxLikeGeometry,
	getDefaultSquareMaskParams,
	getStrokeOffset,
	rotatePoint,
} from "./box-like";

function buildArrowPath({
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
	const notch = 0.4;
	const toPoint = ({ localX, localY }: { localX: number; localY: number }) =>
		rotatePoint({
			x: centerX + localX,
			y: centerY + localY,
			centerX,
			centerY,
			rotationRad,
		});

	const points = [
		toPoint({ localX: 0, localY: -halfHeight }),
		toPoint({ localX: halfWidth, localY: -halfHeight * notch }),
		toPoint({ localX: halfWidth * notch, localY: -halfHeight * notch }),
		toPoint({ localX: halfWidth * notch, localY: halfHeight }),
		toPoint({ localX: -halfWidth * notch, localY: halfHeight }),
		toPoint({ localX: -halfWidth * notch, localY: -halfHeight * notch }),
		toPoint({ localX: -halfWidth, localY: -halfHeight * notch }),
	];

	const path = new Path2D();
	path.moveTo(points[0].x, points[0].y);
	for (const p of points.slice(1)) path.lineTo(p.x, p.y);
	path.closePath();
	return path;
}

function buildOverlayArrowPath({
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
	const n = 0.4;
	return [
		`M ${cx},${cy - hh}`,
		`L ${cx + hw},${cy - hh * n}`,
		`L ${cx + hw * n},${cy - hh * n}`,
		`L ${cx + hw * n},${cy + hh}`,
		`L ${cx - hw * n},${cy + hh}`,
		`L ${cx - hw * n},${cy - hh * n}`,
		`L ${cx - hw},${cy - hh * n}`,
		"Z",
	].join(" ");
}

export const arrowMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "arrow",
	name: "Arrow",
	overlayShape: "box",
	buildOverlayPath: buildOverlayArrowPath,
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return { type: "arrow", params: getDefaultSquareMaskParams(context) };
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath({ resolvedParams, width, height }) {
			const params = resolvedParams as RectangleMaskParams;
			const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
				getBoxLikeGeometry({ params, width, height });
			return buildArrowPath({
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
			return buildArrowPath({
				centerX,
				centerY,
				halfWidth: Math.max(maskWidth / 2 + offset, 1),
				halfHeight: Math.max(maskHeight / 2 + offset, 1),
				rotationRad,
			});
		},
	},
};
