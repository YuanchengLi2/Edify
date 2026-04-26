import { useEffect, useRef } from "react";

export function useRafLoop(
	callback: ({ time }: { time: number }) => void,
	{ fps }: { fps?: number } = {},
) {
	const requestRef = useRef<number>(0);
	const previousTimeRef = useRef<number | null>(null);
	const callbackRef = useRef(callback);
	const lastCallTimeRef = useRef<number>(0);
	const intervalRef = useRef(fps ? 1000 / fps : 0);
	callbackRef.current = callback;
	intervalRef.current = fps ? 1000 / fps : 0;

	useEffect(() => {
		const loop = (time: number) => {
			const interval = intervalRef.current;
			const elapsed = time - lastCallTimeRef.current;

			if (elapsed >= interval) {
				if (previousTimeRef.current !== null) {
					const deltaTime = time - previousTimeRef.current;
					callbackRef.current({ time: deltaTime });
				}
				previousTimeRef.current = time;
				lastCallTimeRef.current = time;
			}

			requestRef.current = requestAnimationFrame(loop);
		};

		requestRef.current = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(requestRef.current);
	}, []);
}
