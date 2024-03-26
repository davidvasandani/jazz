import * as S from "@effect/schema/Schema";
import { CoValue, ID, CoValueSchema } from "../../coValueInterfaces.js";
import { CoMapSchema } from "../coMap/coMap.js";
import {
    AgentSecret,
    InviteSecret,
    Peer,
    RawAccount,
    RawControlledAccount,
    SessionID,
} from "cojson";
import { AccountMigration } from "./migration.js";
import { Context } from "effect";
import { ValueRef } from "../../refs.js";

export type ProfileSchema = CoMapSchema<
    any,
    {
        name: S.Schema<string>;
    }
>;

export interface Account<
    P extends ProfileSchema = ProfileSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValue<"Account", RawAccount> {
    profile?: S.Schema.To<P>;
    root?: S.Schema.To<R>;
    isMe: boolean;
    _refs: {
        profile: ValueRef<S.Schema.To<P>>;
        root: ValueRef<S.Schema.To<R>>;
    };
}

export function isAccount(value: CoValue): value is Account {
    return value._type === "Account";
}

export function isControlledAccount(
    value: CoValue
): value is ControlledAccount {
    return isAccount(value) && value.isMe;
}

export type ControlledAccount<
    P extends ProfileSchema = ProfileSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> = Account<P, R> &
    CoValue<"Account", RawControlledAccount> & {
        isMe: true;

        acceptInvite<V extends CoValueSchema>(
            valueID: ID<S.Schema.To<V>>,
            inviteSecret: InviteSecret,
            valueSchema: V
        ): Promise<V>;

        sessionID: SessionID;
    };

export interface AccountSchema<
    Self = any,
    P extends ProfileSchema = ProfileSchema,
    R extends CoValueSchema | S.Schema<null> = S.Schema<null>,
> extends CoValueSchema<Self, Account<P, R>, "Account", undefined> {
    readonly [controlledAccountSym]: ControlledAccount<P, R>;

    create(options: {
        name: string;
        migration?: AccountMigration<AccountSchema<Self, P, R>>;
        initialAgentSecret?: AgentSecret;
        peersToLoadFrom?: Peer[];
    }): Promise<ControlledAccount<P, R>>;

    become(options: {
        accountID: ID<Account<P, R>>;
        accountSecret: AgentSecret;
        sessionID: SessionID;
        peersToLoadFrom: Peer[];
        migration?: AccountMigration<AccountSchema<Self, P, R>>;
    }): Promise<ControlledAccount<P, R>>;
}

export const controlledAccountSym = Symbol("@jazz/controlledAccount");
export type controlledAccountSym = typeof controlledAccountSym;

export class ControlledAccountCtx extends Context.Tag("ControlledAccount")<
    ControlledAccountCtx,
    ControlledAccount
>() {}
