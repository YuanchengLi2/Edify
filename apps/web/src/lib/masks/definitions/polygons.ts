import type { MaskDefinition, RectangleMaskParams } from "@/lib/masks/types";
import {
	BOX_LIKE_MASK_PARAMS,
	computeBoxMaskParamUpdate,
	getBoxLikeGeometry,
	getDefaultSquareMaskParams,
	getStrokeOffset,
	rotatePoint,
} from "./box-like";

function buildPolygonPath({
	centerX,
	centerY,
	halfWidth,
	halfHeight,
	sides,
	rotationRad,
}: {
	centerX: number;
	centerY: number;
	halfWidth: number;
	halfHeight: number;
	sides: number;
	rotationRad: number;
}): Path2D {
	const path = new Path2D();
	for (let i = 0; i < sides; i++) {
		const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
		const point = rotatePoint({
			x: centerX + halfWidth * Math.cos(angle),
			y: centerY + halfHeight * Math.sin(angle),
			centerX,
			centerY,
			rotationRad,
		});
		if (i === 0) path.moveTo(point.x, point.y);
		else path.lineTo(point.x, point.y);
	}
	path.closePath();
	return path;
}

function buildOverlayPolygonPath({
	width,
	height,
	sides,
}: {
	width: number;
	height: number;
	sides: number;
}): string {
	const cx = width / 2;
	const cy = height / 2;
	const rx = width / 2;
	const ry = height / 2;
	const segments: string[] = [];
	for (let i = 0; i < sides; i++) {
		const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
		const x = cx + rx * Math.cos(angle);
		const y = cy + ry * Math.sin(angle);
		segments.push(`${i === 0 ? "M" : "L"} ${x},${y}`);
	}
	return `${segments.join(" ")} Z`;
}

function makePolygonBuildPath(sides: number) {
	return ({
		resolvedParams,
		width,
		height,
	}: {
		resolvedParams: unknown;
		width: number;
		height: number;
	}) => {
		const params = resolvedParams as RectangleMaskParams;
		const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
			getBoxLikeGeometry({ params, width, height });
		return buildPolygonPath({
			centerX,
			centerY,
			halfWidth: maskWidth / 2,
			halfHeight: maskHeight / 2,
			sides,
			rotationRad,
		});
	};
}

function makePolygonBuildStrokePath(sides: number) {
	return ({
		resolvedParams,
		width,
		height,
	}: {
		resolvedParams: unknown;
		width: number;
		height: number;
	}) => {
		const params = resolvedParams as RectangleMaskParams;
		const { centerX, centerY, maskWidth, maskHeight, rotationRad } =
			getBoxLikeGeometry({ params, width, height });
		const offset = getStrokeOffset({
			strokeAlign: params.strokeAlign,
			strokeWidth: params.strokeWidth,
		});
		return buildPolygonPath({
			centerX,
			centerY,
			halfWidth: Math.max(maskWidth / 2 + offset, 1),
			halfHeight: Math.max(maskHeight / 2 + offset, 1),
			sides,
			rotationRad,
		});
	};
}

export const triangleMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "triangle",
	name: "Triangle",
	overlayShape: "box",
	buildOverlayPath({ width, height }) {
		return buildOverlayPolygonPath({ width, height, sides: 3 });
	},
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return { type: "triangle", params: getDefaultSquareMaskParams(context) };
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath: makePolygonBuildPath(3),
		buildStrokePath: makePolygonBuildStrokePath(3),
	},
};

export const hexagonMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "hexagon",
	name: "Hexagon",
	overlayShape: "box",
	buildOverlayPath({ width, height }) {
		return buildOverlayPolygonPath({ width, height, sides: 6 });
	},
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return { type: "hexagon", params: getDefaultSquareMaskParams(context) };
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath: makePolygonBuildPath(6),
		buildStrokePath: makePolygonBuildStrokePath(6),
	},
};

export const octagonMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "octagon",
	name: "Octagon",
	overlayShape: "box",
	buildOverlayPath({ width, height }) {
		return buildOverlayPolygonPath({ width, height, sides: 8 });
	},
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return { type: "octagon", params: getDefaultSquareMaskParams(context) };
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath: makePolygonBuildPath(8),
		buildStrokePath: makePolygonBuildStrokePath(8),
	},
};

export const pentagonMaskDefinition: MaskDefinition<RectangleMaskParams> = {
	type: "pentagon",
	name: "Pentagon",
	overlayShape: "box",
	buildOverlayPath({ width, height }) {
		return buildOverlayPolygonPath({ width, height, sides: 5 });
	},
	features: { hasPosition: true, hasRotation: true, sizeMode: "width-height" },
	params: BOX_LIKE_MASK_PARAMS,
	buildDefault(context) {
		return { type: "pentagon", params: getDefaultSquareMaskParams(context) };
	},
	computeParamUpdate: computeBoxMaskParamUpdate,
	renderer: {
		buildPath: makePolygonBuildPath(5),
		buildStrokePath: makePolygonBuildStrokePath(5),
	},
};
