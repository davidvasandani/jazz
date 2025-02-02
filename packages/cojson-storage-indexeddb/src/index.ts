import {
    cojsonInternals,
    SessionID,
    SyncMessage,
    Peer,
    CojsonInternalTypes,
    MAX_RECOMMENDED_TX_SIZE,
    RawAccountID,
    IncomingSyncStream,
    OutgoingSyncQueue,
} from "cojson";
import { SyncPromise } from "./syncPromises.js";

type CoValueRow = {
    id: CojsonInternalTypes.RawCoID;
    header: CojsonInternalTypes.CoValueHeader;
};

type StoredCoValueRow = CoValueRow & { rowID: number };

type SessionRow = {
    coValue: number;
    sessionID: SessionID;
    lastIdx: number;
    lastSignature: CojsonInternalTypes.Signature;
    bytesSinceLastSignature?: number;
};

type StoredSessionRow = SessionRow & { rowID: number };

type TransactionRow = {
    ses: number;
    idx: number;
    tx: CojsonInternalTypes.Transaction;
};

type SignatureAfterRow = {
    ses: number;
    idx: number;
    signature: CojsonInternalTypes.Signature;
};

export class IDBStorage {
    db: IDBDatabase;
    toLocalNode: OutgoingSyncQueue;

    constructor(
        db: IDBDatabase,
        fromLocalNode: IncomingSyncStream,
        toLocalNode: OutgoingSyncQueue,
    ) {
        this.db = db;
        this.toLocalNode = toLocalNode;

        const processMessages = async () => {
            for await (const msg of fromLocalNode) {
                try {
                    if (msg === "Disconnected" || msg === "PingTimeout") {
                        throw new Error("Unexpected Disconnected message");
                    }
                    await this.handleSyncMessage(msg);
                } catch (e) {
                    console.error(
                        new Error(
                            `Error reading from localNode, handling msg\n\n${JSON.stringify(
                                msg,
                                (k, v) =>
                                    k === "changes" || k === "encryptedChanges"
                                        ? v.slice(0, 20) + "..."
                                        : v,
                            )}`,
                            { cause: e },
                        ),
                    );
                }
            }
        };

        processMessages().catch((e) =>
            console.error("Error in processMessages in IndexedDB", e),
        );
    }

    static async asPeer(
        {
            trace,
            localNodeName = "local",
        }: { trace?: boolean; localNodeName?: string } | undefined = {
            localNodeName: "local",
        },
    ): Promise<Peer> {
        const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
            localNodeName,
            "storage",
            { peer1role: "client", peer2role: "server", trace, crashOnClose: true },
        );

        await IDBStorage.open(
            localNodeAsPeer.incoming,
            localNodeAsPeer.outgoing,
        );

        return { ...storageAsPeer, priority: 100 };
    }

    static async open(
        fromLocalNode: IncomingSyncStream,
        toLocalNode: OutgoingSyncQueue,
    ) {
        const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open("jazz-storage", 4);
            request.onerror = () => {
                reject(request.error);
            };
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onupgradeneeded = async (ev) => {
                const db = request.result;
                if (ev.oldVersion === 0) {
                    const coValues = db.createObjectStore("coValues", {
                        autoIncrement: true,
                        keyPath: "rowID",
                    });

                    coValues.createIndex("coValuesById", "id", {
                        unique: true,
                    });

                    const sessions = db.createObjectStore("sessions", {
                        autoIncrement: true,
                        keyPath: "rowID",
                    });

                    sessions.createIndex("sessionsByCoValue", "coValue");
                    sessions.createIndex(
                        "uniqueSessions",
                        ["coValue", "sessionID"],
                        {
                            unique: true,
                        },
                    );

                    db.createObjectStore("transactions", {
                        keyPath: ["ses", "idx"],
                    });
                }
                if (ev.oldVersion <= 1) {
                    db.createObjectStore("signatureAfter", {
                        keyPath: ["ses", "idx"],
                    });
                }
            };
        });

        return new IDBStorage(await dbPromise, fromLocalNode, toLocalNode);
    }

    async handleSyncMessage(msg: SyncMessage) {
        switch (msg.action) {
            case "load":
                await this.handleLoad(msg);
                break;
            case "content":
                await this.handleContent(msg);
                break;
            case "known":
                await this.handleKnown(msg);
                break;
            case "done":
                await this.handleDone(msg);
                break;
        }
    }

    currentTx:
        | {
              id: number;
              tx: IDBTransaction;
              stores: {
                  coValues: IDBObjectStore;
                  sessions: IDBObjectStore;
                  transactions: IDBObjectStore;
                  signatureAfter: IDBObjectStore;
              };
              startedAt: number;
              pendingRequests: ((txEntry: {
                  stores: {
                      coValues: IDBObjectStore;
                      sessions: IDBObjectStore;
                      transactions: IDBObjectStore;
                      signatureAfter: IDBObjectStore;
                  };
              }) => void)[];
          }
        | undefined;
    currentTxID = 0;

    makeRequest<T>(
        handler: (stores: {
            coValues: IDBObjectStore;
            sessions: IDBObjectStore;
            transactions: IDBObjectStore;
            signatureAfter: IDBObjectStore;
        }) => IDBRequest,
    ): SyncPromise<T> {
        return new SyncPromise((resolve, reject) => {
            let txEntry = this.currentTx;

            const requestEntry = ({
                stores,
            }: {
                stores: {
                    coValues: IDBObjectStore;
                    sessions: IDBObjectStore;
                    transactions: IDBObjectStore;
                    signatureAfter: IDBObjectStore;
                };
            }) => {
                const request = handler(stores);
                request.onerror = () => {
                    console.error("Error in request", request.error);
                    this.currentTx = undefined;
                    reject(request.error);
                    // TODO: recover pending requests in new tx
                };
                request.onsuccess = () => {
                    const value = request.result as T;
                    resolve(value);

                    const next = txEntry!.pendingRequests.shift();

                    if (next) {
                        next({ stores });
                    } else {
                        if (this.currentTx === txEntry) {
                            this.currentTx = undefined;
                        }
                    }
                };
            };

            if (!txEntry || performance.now() - txEntry.startedAt > 20) {
                const tx = this.db.transaction(
                    ["coValues", "sessions", "transactions", "signatureAfter"],
                    "readwrite",
                );
                txEntry = {
                    id: this.currentTxID++,
                    tx,
                    stores: {
                        coValues: tx.objectStore("coValues"),
                        sessions: tx.objectStore("sessions"),
                        transactions: tx.objectStore("transactions"),
                        signatureAfter: tx.objectStore("signatureAfter"),
                    },
                    startedAt: performance.now(),
                    pendingRequests: [],
                };

                // console.time("IndexedDB TX" + txEntry.id);

                // txEntry.tx.oncomplete = () => {
                //     console.timeEnd("IndexedDB TX" + txEntry!.id);
                // };

                this.currentTx = txEntry;

                requestEntry(txEntry);
            } else {
                txEntry.pendingRequests.push(requestEntry);
                // console.log(
                //     "Queued request in TX " + txEntry.id,
                //     txEntry.pendingRequests.length
                // );
            }
        });
    }

    sendNewContentAfter(
        theirKnown: CojsonInternalTypes.CoValueKnownState,
        asDependencyOf?: CojsonInternalTypes.RawCoID,
    ): SyncPromise<void> {
        return this.makeRequest<StoredCoValueRow | undefined>(({ coValues }) =>
            coValues.index("coValuesById").get(theirKnown.id),
        )
            .then((coValueRow) => {
                return (
                    coValueRow
                        ? this.makeRequest<StoredSessionRow[]>(({ sessions }) =>
                              sessions
                                  .index("sessionsByCoValue")
                                  .getAll(coValueRow.rowID),
                          )
                        : SyncPromise.resolve([])
                ).then((allOurSessions) => {
                    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
                        id: theirKnown.id,
                        header: !!coValueRow,
                        sessions: {},
                    };

                    const newContentPieces: CojsonInternalTypes.NewContentMessage[] =
                        [
                            {
                                action: "content",
                                id: theirKnown.id,
                                header: theirKnown.header
                                    ? undefined
                                    : coValueRow?.header,
                                new: {},
                                priority: cojsonInternals.getPriorityFromHeader(coValueRow?.header),
                            },
                        ];

                    return SyncPromise.all(
                        allOurSessions.map((sessionRow) => {
                            ourKnown.sessions[sessionRow.sessionID] =
                                sessionRow.lastIdx;

                            if (
                                sessionRow.lastIdx >
                                (theirKnown.sessions[sessionRow.sessionID] || 0)
                            ) {
                                const firstNewTxIdx =
                                    theirKnown.sessions[sessionRow.sessionID] ||
                                    0;

                                return this.makeRequest<SignatureAfterRow[]>(
                                    ({ signatureAfter }) =>
                                        signatureAfter.getAll(
                                            IDBKeyRange.bound(
                                                [
                                                    sessionRow.rowID,
                                                    firstNewTxIdx,
                                                ],
                                                [sessionRow.rowID, Infinity],
                                            ),
                                        ),
                                ).then((signaturesAndIdxs) => {
                                    // console.log(
                                    //     theirKnown.id,
                                    //     "signaturesAndIdxs",
                                    //     JSON.stringify(signaturesAndIdxs)
                                    // );

                                    return this.makeRequest<TransactionRow[]>(
                                        ({ transactions }) =>
                                            transactions.getAll(
                                                IDBKeyRange.bound(
                                                    [
                                                        sessionRow.rowID,
                                                        firstNewTxIdx,
                                                    ],
                                                    [
                                                        sessionRow.rowID,
                                                        Infinity,
                                                    ],
                                                ),
                                            ),
                                    ).then((newTxsInSession) => {
                                        collectNewTxs(
                                            newTxsInSession,
                                            newContentPieces,
                                            sessionRow,
                                            signaturesAndIdxs,
                                            theirKnown,
                                            firstNewTxIdx,
                                        );
                                    });
                                });
                            } else {
                                return SyncPromise.resolve();
                            }
                        }),
                    ).then(() => {
                        const dependedOnCoValues = getDependedOnCoValues(
                            coValueRow,
                            newContentPieces,
                            theirKnown,
                        );

                        return SyncPromise.all(
                            dependedOnCoValues.map((dependedOnCoValue) =>
                                this.sendNewContentAfter(
                                    {
                                        id: dependedOnCoValue,
                                        header: false,
                                        sessions: {},
                                    },
                                    asDependencyOf || theirKnown.id,
                                ),
                            ),
                        ).then(() => {
                            // we're done with IndexedDB stuff here so can use native Promises again
                            setTimeout(() => {
                                this.toLocalNode
                                    .push({
                                        action: "known",
                                        ...ourKnown,
                                        asDependencyOf,
                                    })
                                    .catch((e) =>
                                        console.error(
                                            "Error sending known state",
                                            e,
                                        ),
                                    );

                                const nonEmptyNewContentPieces =
                                    newContentPieces.filter(
                                        (piece) =>
                                            piece.header ||
                                            Object.keys(piece.new).length > 0,
                                    );

                                // console.log(theirKnown.id, nonEmptyNewContentPieces);

                                for (const piece of nonEmptyNewContentPieces) {
                                    this.toLocalNode
                                        .push(piece)
                                        .catch((e) =>
                                            console.error(
                                                "Error sending new content piece",
                                                e,
                                            ),
                                        );
                                }
                            });

                            return Promise.resolve();
                        });
                    });
                });
            })
            .then(() => {});
    }

    handleLoad(msg: CojsonInternalTypes.LoadMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleContent(
        msg: CojsonInternalTypes.NewContentMessage,
    ): SyncPromise<void> {
        return this.makeRequest<StoredCoValueRow | undefined>(({ coValues }) =>
            coValues.index("coValuesById").get(msg.id),
        )
            .then((coValueRow) => {
                if (coValueRow?.rowID === undefined) {
                    const header = msg.header;
                    if (!header) {
                        console.error("Expected to be sent header first");
                        this.toLocalNode
                            .push({
                                action: "known",
                                id: msg.id,
                                header: false,
                                sessions: {},
                                isCorrection: true,
                            })
                            .catch((e) =>
                                console.error("Error sending known state", e),
                            );
                        return SyncPromise.resolve();
                    }

                    return this.makeRequest<IDBValidKey>(({ coValues }) =>
                        coValues.put({
                            id: msg.id,
                            header: header,
                        } satisfies CoValueRow),
                    ) as SyncPromise<number>;
                } else {
                    return SyncPromise.resolve(coValueRow.rowID);
                }
            })
            .then((storedCoValueRowID: number) => {
                void this.makeRequest<StoredSessionRow[]>(({ sessions }) =>
                    sessions
                        .index("sessionsByCoValue")
                        .getAll(storedCoValueRowID),
                ).then((allOurSessionsEntries) => {
                    const allOurSessions: {
                        [sessionID: SessionID]: StoredSessionRow;
                    } = Object.fromEntries(
                        allOurSessionsEntries.map((row) => [
                            row.sessionID,
                            row,
                        ]),
                    );

                    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
                        id: msg.id,
                        header: true,
                        sessions: {},
                    };
                    let invalidAssumptions = false;

                    return Promise.all(
                        (Object.keys(msg.new) as SessionID[]).map(
                            (sessionID) => {
                                const sessionRow = allOurSessions[sessionID];
                                if (sessionRow) {
                                    ourKnown.sessions[sessionRow.sessionID] =
                                        sessionRow.lastIdx;
                                }

                                if (
                                    (sessionRow?.lastIdx || 0) <
                                    (msg.new[sessionID]?.after || 0)
                                ) {
                                    invalidAssumptions = true;
                                } else {
                                    return this.putNewTxs(
                                        msg,
                                        sessionID,
                                        sessionRow,
                                        storedCoValueRowID,
                                    );
                                }
                            },
                        ),
                    ).then(() => {
                        if (invalidAssumptions) {
                            this.toLocalNode
                                .push({
                                    action: "known",
                                    ...ourKnown,
                                    isCorrection: invalidAssumptions,
                                })
                                .catch((e) =>
                                    console.error(
                                        "Error sending known state",
                                        e,
                                    ),
                                );
                        }
                    });
                });
            });
    }

    private putNewTxs(
        msg: CojsonInternalTypes.NewContentMessage,
        sessionID: SessionID,
        sessionRow: StoredSessionRow | undefined,
        storedCoValueRowID: number,
    ) {
        const newTransactions = msg.new[sessionID]?.newTransactions || [];

        const actuallyNewOffset =
            (sessionRow?.lastIdx || 0) - (msg.new[sessionID]?.after || 0);

        const actuallyNewTransactions =
            newTransactions.slice(actuallyNewOffset);

        let newBytesSinceLastSignature =
            (sessionRow?.bytesSinceLastSignature || 0) +
            actuallyNewTransactions.reduce(
                (sum, tx) =>
                    sum +
                    (tx.privacy === "private"
                        ? tx.encryptedChanges.length
                        : tx.changes.length),
                0,
            );

        const newLastIdx =
            (sessionRow?.lastIdx || 0) + actuallyNewTransactions.length;

        let shouldWriteSignature = false;

        if (newBytesSinceLastSignature > MAX_RECOMMENDED_TX_SIZE) {
            shouldWriteSignature = true;
            newBytesSinceLastSignature = 0;
        }

        const nextIdx = sessionRow?.lastIdx || 0;

        const sessionUpdate = {
            coValue: storedCoValueRowID,
            sessionID: sessionID,
            lastIdx: newLastIdx,
            lastSignature: msg.new[sessionID]!.lastSignature,
            bytesSinceLastSignature: newBytesSinceLastSignature,
        };

        return this.makeRequest<number>(({ sessions }) =>
            sessions.put(
                sessionRow?.rowID
                    ? {
                          rowID: sessionRow.rowID,
                          ...sessionUpdate,
                      }
                    : sessionUpdate,
            ),
        ).then((sessionRowID) => {
            let maybePutRequest;
            if (shouldWriteSignature) {
                maybePutRequest = this.makeRequest(({ signatureAfter }) =>
                    signatureAfter.put({
                        ses: sessionRowID,
                        // TODO: newLastIdx is a misnomer, it's actually more like nextIdx or length
                        idx: newLastIdx - 1,
                        signature: msg.new[sessionID]!.lastSignature,
                    } satisfies SignatureAfterRow),
                );
            } else {
                maybePutRequest = SyncPromise.resolve();
            }

            return maybePutRequest.then(() =>
                Promise.all(
                    actuallyNewTransactions.map((newTransaction, i) => {
                        return this.makeRequest(({ transactions }) =>
                            transactions.add({
                                ses: sessionRowID,
                                idx: nextIdx + i,
                                tx: newTransaction,
                            } satisfies TransactionRow),
                        );
                    }),
                ),
            );
        });
    }

    handleKnown(msg: CojsonInternalTypes.KnownStateMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleDone(_msg: CojsonInternalTypes.DoneMessage) {}

    // inTransaction(mode: "readwrite" | "readonly"): {
    //     coValues: IDBObjectStore;
    //     sessions: IDBObjectStore;
    //     transactions: IDBObjectStore;
    //     signatureAfter: IDBObjectStore;
    // } {
    //     const tx = this.db.transaction(
    //         ["coValues", "sessions", "transactions", "signatureAfter"],
    //         mode
    //     );

    //     const txID = lastTx;
    //     lastTx++;
    //     console.time("IndexedDB TX" + txID);

    //     tx.onerror = (event) => {
    //         const target = event.target as unknown as {
    //             error: DOMException;
    //             source?: { name: string };
    //         } | null;
    //         throw new Error(
    //             `Error in transaction (${target?.source?.name}): ${target?.error}`,
    //             { cause: target?.error }
    //         );
    //     };
    //     tx.oncomplete = () => {
    //         console.timeEnd("IndexedDB TX" + txID);
    //     }
    //     const coValues = tx.objectStore("coValues");
    //     const sessions = tx.objectStore("sessions");
    //     const transactions = tx.objectStore("transactions");
    //     const signatureAfter = tx.objectStore("signatureAfter");

    //     return { coValues, sessions, transactions, signatureAfter };
    // }
}

function collectNewTxs(
    newTxsInSession: TransactionRow[],
    newContentPieces: CojsonInternalTypes.NewContentMessage[],
    sessionRow: StoredSessionRow,
    signaturesAndIdxs: SignatureAfterRow[],
    theirKnown: CojsonInternalTypes.CoValueKnownState,
    firstNewTxIdx: number,
) {
    let idx = firstNewTxIdx;

    // console.log(
    //     theirKnown.id,
    //     "newTxInSession",
    //     newTxInSession.length
    // );
    for (const tx of newTxsInSession) {
        let sessionEntry =
            newContentPieces[newContentPieces.length - 1]!.new[
                sessionRow.sessionID
            ];
        if (!sessionEntry) {
            sessionEntry = {
                after: idx,
                lastSignature:
                    "WILL_BE_REPLACED" as CojsonInternalTypes.Signature,
                newTransactions: [],
            };
            newContentPieces[newContentPieces.length - 1]!.new[
                sessionRow.sessionID
            ] = sessionEntry;
        }

        sessionEntry.newTransactions.push(tx.tx);

        if (signaturesAndIdxs[0] && idx === signaturesAndIdxs[0].idx) {
            sessionEntry.lastSignature = signaturesAndIdxs[0].signature;
            signaturesAndIdxs.shift();
            newContentPieces.push({
                action: "content",
                id: theirKnown.id,
                new: {},
                priority: cojsonInternals.getPriorityFromHeader(undefined),
            });
        } else if (idx === firstNewTxIdx + newTxsInSession.length - 1) {
            sessionEntry.lastSignature = sessionRow.lastSignature;
        }
        idx += 1;
    }
}

function getDependedOnCoValues(
    coValueRow: StoredCoValueRow | undefined,
    newContentPieces: CojsonInternalTypes.NewContentMessage[],
    theirKnown: CojsonInternalTypes.CoValueKnownState,
) {
    return coValueRow?.header.ruleset.type === "group"
        ? newContentPieces
              .flatMap((piece) => Object.values(piece.new))
              .flatMap((sessionEntry) =>
                  sessionEntry.newTransactions.flatMap((tx) => {
                      if (tx.privacy !== "trusting") return [];
                      // TODO: avoid parse here?
                      return cojsonInternals
                          .parseJSON(tx.changes)
                          .map(
                              (change) =>
                                  change &&
                                  typeof change === "object" &&
                                  "op" in change &&
                                  change.op === "set" &&
                                  "key" in change &&
                                  change.key,
                          )
                          .filter(
                              (key): key is CojsonInternalTypes.RawCoID =>
                                  typeof key === "string" &&
                                  key.startsWith("co_"),
                          );
                  }),
              )
        : coValueRow?.header.ruleset.type === "ownedByGroup"
          ? [
                coValueRow?.header.ruleset.group,
                ...new Set(
                    newContentPieces.flatMap((piece) =>
                        Object.keys(piece)
                            .map((sessionID) =>
                                cojsonInternals.accountOrAgentIDfromSessionID(
                                    sessionID as SessionID,
                                ),
                            )
                            .filter(
                                (accountID): accountID is RawAccountID =>
                                    cojsonInternals.isAccountID(accountID) &&
                                    accountID !== theirKnown.id,
                            ),
                    ),
                ),
            ]
          : [];
}
// let lastTx = 0;

// function promised<T>(request: IDBRequest<T>): Promise<T> {
//     return new Promise<T>((resolve, reject) => {
//         request.onsuccess = () => {
//             resolve(request.result);
//         };
//         request.onerror = () => {
//             reject(request.error);
//         };
//     });
// }
