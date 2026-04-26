export function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

export function easeOutBack(t: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeOutBounce(t: number): number {
	const n1 = 7.5625;
	const d1 = 2.75;
	if (t < 1 / d1) return n1 * t * t;
	let t2 = t - 1.5 / d1;
	if (t < 2 / d1) return n1 * t2 * t2 + 0.75;
	t2 = t - 2.25 / d1;
	if (t < 2.5 / d1) return n1 * t2 * t2 + 0.9375;
	t2 = t - 2.625 / d1;
	return n1 * t2 * t2 + 0.984375;
}

export function easeOutElastic(t: number): number {
	if (t === 0 || t === 1) return t;
	return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}
