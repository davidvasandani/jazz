import type { RawCoValue } from "cojson";
import type {
    Account,
    CoValue,
    ID,
    CoValueClass,
    CoValueFromRaw,
    AnonymousJazzAgent,
} from "../internal.js";

export const subscriptionsScopes = new WeakMap<
    CoValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SubscriptionScope<any>
>();

const TRACE_INVALIDATIONS = false;

export class SubscriptionScope<Root extends CoValue> {
    scopeID: string = `scope-${Math.random().toString(36).slice(2)}`;
    subscriber: Account | AnonymousJazzAgent;
    entries = new Map<
        ID<CoValue>,
        | { state: "loading"; immediatelyUnsub?: boolean }
        | { state: "loaded"; rawUnsub: () => void }
    >();
    rootEntry: {
        state: "loaded";
        value: Root;
        rawUnsub: () => void;
    };
    onUpdate: (newRoot: Root) => void;
    scheduledUpdate: boolean = false;
    cachedValues: { [id: ID<CoValue>]: CoValue } = {};
    parents: { [id: ID<CoValue>]: Set<ID<CoValue>> } = {};
    rootSchema: CoValueClass<Root> & CoValueFromRaw<Root>

    constructor(
        root: Root,
        rootSchema: CoValueClass<Root> & CoValueFromRaw<Root>,
        onUpdate: (newRoot: Root) => void,
    ) {
        this.rootEntry = {
            state: "loaded" as const,
            value: root,
            rawUnsub: () => {}, // placeholder
        };
        this.entries.set(root.id, this.rootEntry);

        subscriptionsScopes.set(root, this);

        this.subscriber = root._loadedAs;
        this.onUpdate = onUpdate;
        this.rootSchema = rootSchema;
        this.rootEntry.rawUnsub = root._raw.core.subscribe(
            (rawUpdate: RawCoValue | undefined) => {
                if (!rawUpdate) return;
                this.rootEntry.value = rootSchema.fromRaw(rawUpdate) as Root;
                // console.log("root update", this.rootEntry.value.toJSON());
                subscriptionsScopes.set(this.rootEntry.value, this);
                this.scheduleUpdate();
            },
        );
    }

    scheduleUpdate() {
        this.onUpdate(this.rootEntry.value);
    }

    onRefAccessedOrSet(
        fromId: ID<CoValue>,
        accessedOrSetId: ID<CoValue> | undefined,
    ) {
        // console.log("onRefAccessedOrSet", this.scopeID, accessedOrSetId);
        if (!accessedOrSetId) {
            return;
        }

        this.parents[accessedOrSetId] =
            this.parents[accessedOrSetId] || new Set();
        this.parents[accessedOrSetId]!.add(fromId);

        if (!this.entries.has(accessedOrSetId)) {
            const loadingEntry = {
                state: "loading",
                immediatelyUnsub: false,
            } as const;
            this.entries.set(accessedOrSetId, loadingEntry);
            const node =
                this.subscriber._type === "Account"
                    ? this.subscriber._raw.core.node
                    : this.subscriber.node;
            void node.loadCoValueCore(accessedOrSetId).then((core) => {
                if (
                    loadingEntry.state === "loading" &&
                    loadingEntry.immediatelyUnsub
                ) {
                    return;
                }
                if (core !== "unavailable") {
                    const entry = {
                        state: "loaded" as const,
                        rawUnsub: () => {}, // placeholder
                    };
                    this.entries.set(accessedOrSetId, entry);

                    const rawUnsub = core.subscribe((rawUpdate) => {
                        // console.log("ref update", this.scopeID, accessedOrSetId, JSON.stringify(rawUpdate))
                        if (!rawUpdate) return;
                        this.invalidate(accessedOrSetId);
                        this.scheduleUpdate();
                    });

                    entry.rawUnsub = rawUnsub;
                }
            });
        }
    }

    invalidate(
        id: ID<CoValue>,
        fromChild?: ID<CoValue>,
        seen: Set<ID<CoValue>> = new Set(),
    ) {
        if (seen.has(id)) return;
        TRACE_INVALIDATIONS &&
            console.log(
                "invalidating",
                fromChild,
                "->",
                id,
                this.cachedValues[id],
            );
        delete this.cachedValues[id];
        seen.add(id);
        for (const parent of this.parents[id] || []) {
            this.invalidate(parent, id, seen);
        }
        this.rootEntry.value = this.rootSchema.fromRaw(this.rootEntry.value._raw) as Root;
    }

    unsubscribeAll() {
        for (const entry of this.entries.values()) {
            if (entry.state === "loaded") {
                entry.rawUnsub();
            } else {
                entry.immediatelyUnsub = true;
            }
        }
        this.entries.clear();
    }
}
