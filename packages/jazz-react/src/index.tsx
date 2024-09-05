import React, { useEffect, useState } from "react";
import {
    BrowserContext,
    BrowserGuestContext,
    consumeInviteLinkFromWindowLocation,
    createJazzBrowserContext,
} from "jazz-browser";

import {
    Account,
    AccountClass,
    AnonymousJazzAgent,
    AuthMethod,
    CoValue,
    CoValueClass,
    DeeplyLoaded,
    DepthsIn,
    ID,
    subscribeToCoValue,
} from "jazz-tools";

/** @category Context & Hooks */
export function createJazzReactApp<Acc extends Account>({
    AccountSchema = Account as unknown as AccountClass<Acc>,
}: {
    AccountSchema?: AccountClass<Acc>;
} = {}): JazzReactApp<Acc> {
    const JazzContext = React.createContext<
        BrowserContext<Acc> | BrowserGuestContext | undefined
    >(undefined);

    function Provider({
        children,
        auth,
        peer,
        storage,
    }: {
        children: React.ReactNode;
        auth: AuthMethod | "guest";
        peer: `wss://${string}` | `ws://${string}`;
        storage?: "indexedDB" | "singleTabOPFS";
    }) {
        const [ctx, setCtx] = useState<
            BrowserContext<Acc> | BrowserGuestContext | undefined
        >();

        useEffect(() => {
            const promiseWithDoneCallback = createJazzBrowserContext<Acc>(
                auth === "guest"
                    ? {
                          peer,
                          storage,
                      }
                    : {
                          AccountSchema,
                          auth: auth,
                          peer,
                          storage,
                      },
            ).then((context) => {
                setCtx(context);
                return context.done;
            });

            return () => {
                void promiseWithDoneCallback.then((done) => done());
            };
        }, [AccountSchema, auth, peer, storage]);

        return (
            <JazzContext.Provider value={ctx}>{children}</JazzContext.Provider>
        );
    }

    function useAccount(): { me: Acc };
    function useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): { me: DeeplyLoaded<Acc, D> | undefined };
    function useAccount<D extends DepthsIn<Acc>>(
        depth?: D,
    ): { me: Acc | DeeplyLoaded<Acc, D> | undefined } {
        const context = React.useContext(JazzContext);

        if (!context) {
            throw new Error("useAccount must be used within a JazzProvider");
        }

        if (!("me" in context)) {
            throw new Error(
                "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
            );
        }

        const me = useCoState<Acc, D>(
            context?.me.constructor as CoValueClass<Acc>,
            context?.me.id,
            depth,
        );

        return {
            me: depth === undefined ? me || context.me : me,
        };
    }

    function useAccountOrGuest(): Acc | AnonymousJazzAgent {
        const context = React.useContext(JazzContext);

        if (!context) {
            throw new Error("useAccountOrGuest must be used within a JazzProvider");
        }

        return "me" in context ? context.me : context.guest;
    }

    function useCoState<V extends CoValue, D>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Schema: CoValueClass<V>,
        id: ID<V> | undefined,
        depth: D & DepthsIn<V> = [] as D & DepthsIn<V>,
    ): DeeplyLoaded<V, D> | undefined {
        const [state, setState] = useState<{
            value: DeeplyLoaded<V, D> | undefined;
        }>({ value: undefined });
        const context = React.useContext(JazzContext);

        if (!context) {
            throw new Error("useCoState must be used within a JazzProvider");
        }

        useEffect(() => {
            if (!id) return;

            return subscribeToCoValue(Schema, id, "me" in context ? context.me : context.guest, depth, (value) => {
                setState({ value });
            });
        }, [Schema, id, context]);

        return state.value;
    }

    function useAcceptInvite<V extends CoValue>({
        invitedObjectSchema,
        onAccept,
        forValueHint,
    }: {
        invitedObjectSchema: CoValueClass<V>;
        onAccept: (projectID: ID<V>) => void;
        forValueHint?: string;
    }): void {
        const context = React.useContext(JazzContext);

        if (!context) {
            throw new Error("useAcceptInvite must be used within a JazzProvider");
        }

        if (!("me" in context)) {
            throw new Error("useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.");
        }

        useEffect(() => {
            if (!context) return;

            const result = consumeInviteLinkFromWindowLocation({
                as: context.me,
                invitedObjectSchema,
                forValueHint,
            });

            result
                .then((result) => result && onAccept(result?.valueID))
                .catch((e) => {
                    console.error("Failed to accept invite", e);
                });
        }, [onAccept]);
    }

    return {
        Provider,
        useAccount,
        useAccountOrGuest,
        useCoState,
        useAcceptInvite,
    };
}

/** @category Context & Hooks */
export interface JazzReactApp<Acc extends Account> {
    /** @category Provider Component */
    Provider: React.FC<{
        children: React.ReactNode;
        auth: AuthMethod | "guest";
        peer: `wss://${string}` | `ws://${string}`;
        storage?: "indexedDB" | "singleTabOPFS";
    }>;

    /** @category Hooks */
    useAccount(): {
        me: Acc;
    };
    /** @category Hooks */
    useAccount<D extends DepthsIn<Acc>>(
        depth: D,
    ): {
        me: DeeplyLoaded<Acc, D> | undefined;
    };

    /** @category Hooks */
    useAccountOrGuest(): Acc | AnonymousJazzAgent;
    /** @category Hooks */
    useCoState<V extends CoValue, D>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Schema: { new (...args: any[]): V } & CoValueClass,
        id: ID<V> | undefined,
        depth?: D & DepthsIn<V>,
    ): DeeplyLoaded<V, D> | undefined;

    /** @category Hooks */
    useAcceptInvite<V extends CoValue>({
        invitedObjectSchema,
        onAccept,
        forValueHint,
    }: {
        invitedObjectSchema: CoValueClass<V>;
        onAccept: (projectID: ID<V>) => void;
        forValueHint?: string;
    }): void;
}

export { createInviteLink, parseInviteLink } from "jazz-browser";

export * from "./auth/auth.js";
export * from "./media.js";
