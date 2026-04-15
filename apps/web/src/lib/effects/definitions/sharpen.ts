import type { EffectDefinition } from "@/lib/effects/types";
import { GAUSSIAN_BLUR_SHADER, intensityToSigma } from "./blur";

export const sharpenEffectDefinition: EffectDefinition = {
	type: "sharpen",
	name: "Sharpen",
	keywords: ["sharpen", "crisp", "detail", "edge"],
	params: [
		{
			key: "intensity",
			label: "Intensity",
			type: "number",
			default: 30,
			min: 0,
			max: 100,
			step: 1,
		},
	],
	renderer: {
		passes: [
			{
				shader: GAUSSIAN_BLUR_SHADER,
				uniforms: ({ effectParams, width }) => ({
					u_sigma: Math.max(
						intensityToSigma({
							intensity:
								typeof effectParams.intensity === "number"
									? effectParams.intensity
									: 30,
							resolution: width,
							reference: 1920,
						}) * 0.15,
						0.001,
					),
					u_step: 1,
					u_direction: [1, 0],
				}),
			},
			{
				shader: GAUSSIAN_BLUR_SHADER,
				uniforms: ({ effectParams, height }) => ({
					u_sigma: Math.max(
						intensityToSigma({
							intensity:
								typeof effectParams.intensity === "number"
									? effectParams.intensity
									: 30,
							resolution: height,
							reference: 1080,
						}) * 0.15,
						0.001,
					),
					u_step: 1,
					u_direction: [0, 1],
				}),
			},
		],
	},
};
