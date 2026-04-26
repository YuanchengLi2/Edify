import { BaseNode, type AnyBaseNode } from "./base-node";

export type RootNodeParams = {
	duration: number;
};

export class RootNode extends BaseNode<RootNodeParams> {
	private elementMap = new Map<string, AnyBaseNode>();
	private _dirtyVersion = 0;

	get duration() {
		return this.params.duration ?? 0;
	}

	get dirtyVersion(): number {
		return this._dirtyVersion;
	}

	markDirty(): void {
		this._dirtyVersion++;
	}

	add(child: AnyBaseNode): this {
		this.children.push(child);
		const params = child.params as { elementId?: string };
		if (params?.elementId) {
			this.elementMap.set(params.elementId, child);
		}
		return this;
	}

	getNodeByElementId(elementId: string): AnyBaseNode | undefined {
		return this.elementMap.get(elementId);
	}
}
