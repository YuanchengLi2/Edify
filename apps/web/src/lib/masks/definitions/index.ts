import type { BaseMaskParams, MaskDefinition } from "@/lib/masks/types";
import { masksRegistry, type MaskIconProps } from "../registry";
import { cinematicBarsMaskDefinition } from "./cinematic-bars";
import { diamondMaskDefinition } from "./diamond";
import { ellipseMaskDefinition } from "./ellipse";
import { heartMaskDefinition } from "./heart";
import { rectangleMaskDefinition } from "./rectangle";
import { splitMaskDefinition } from "./split";
import { starMaskDefinition } from "./star";
import {
	triangleMaskDefinition,
	hexagonMaskDefinition,
	octagonMaskDefinition,
	pentagonMaskDefinition,
} from "./polygons";
import { arrowMaskDefinition } from "./arrow";
import { crossMaskDefinition } from "./cross";
import { roundedRectMaskDefinition } from "./rounded-rect";
import {
	MinusSignIcon,
	PanelRightDashedIcon,
	SquareIcon,
	CircleIcon,
	FavouriteIcon,
	DiamondIcon,
	StarsIcon,
	PlusSignIcon,
	ArrowUpIcon,
} from "@hugeicons/core-free-icons";

function registerDefaultMask<TParams extends BaseMaskParams>({
	definition,
	icon,
}: {
	definition: MaskDefinition<TParams>;
	icon: MaskIconProps;
}) {
	if (masksRegistry.has(definition.type)) {
		return;
	}

	masksRegistry.registerMask({ definition, icon });
}

export function registerDefaultMasks(): void {
	registerDefaultMask({
		definition: splitMaskDefinition,
		icon: { icon: PanelRightDashedIcon, strokeWidth: 1 },
	});
	registerDefaultMask({
		definition: cinematicBarsMaskDefinition,
		icon: { icon: MinusSignIcon },
	});
	registerDefaultMask({
		definition: rectangleMaskDefinition,
		icon: { icon: SquareIcon },
	});
	registerDefaultMask({
		definition: ellipseMaskDefinition,
		icon: { icon: CircleIcon },
	});
	registerDefaultMask({
		definition: heartMaskDefinition,
		icon: { icon: FavouriteIcon },
	});
	registerDefaultMask({
		definition: diamondMaskDefinition,
		icon: { icon: DiamondIcon },
	});
	registerDefaultMask({
		definition: starMaskDefinition,
		icon: { icon: StarsIcon },
	});
	registerDefaultMask({
		definition: triangleMaskDefinition,
		icon: { icon: FavouriteIcon, strokeWidth: 1 },
	});
	registerDefaultMask({
		definition: hexagonMaskDefinition,
		icon: { icon: DiamondIcon, strokeWidth: 1 },
	});
	registerDefaultMask({
		definition: octagonMaskDefinition,
		icon: { icon: CircleIcon, strokeWidth: 1 },
	});
	registerDefaultMask({
		definition: pentagonMaskDefinition,
		icon: { icon: StarsIcon, strokeWidth: 1 },
	});
	registerDefaultMask({
		definition: arrowMaskDefinition,
		icon: { icon: ArrowUpIcon },
	});
	registerDefaultMask({
		definition: crossMaskDefinition,
		icon: { icon: PlusSignIcon },
	});
	registerDefaultMask({
		definition: roundedRectMaskDefinition,
		icon: { icon: SquareIcon, strokeWidth: 1 },
	});
}
