import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from "ethers";
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "../common";
export type CacheControlStruct = {
    maxAge: BigNumberish;
    noStore: boolean;
    noCache: boolean;
    immutableFlag: boolean;
    publicFlag: boolean;
};
export type CacheControlStructOutput = [
    maxAge: bigint,
    noStore: boolean,
    noCache: boolean,
    immutableFlag: boolean,
    publicFlag: boolean
] & {
    maxAge: bigint;
    noStore: boolean;
    noCache: boolean;
    immutableFlag: boolean;
    publicFlag: boolean;
};
export type RedirectStruct = {
    code: BigNumberish;
    location: string;
};
export type RedirectStructOutput = [code: bigint, location: string] & {
    code: bigint;
    location: string;
};
export type HeaderInfoStruct = {
    methods: BigNumberish;
    cache: CacheControlStruct;
    redirect: RedirectStruct;
    resourceAdmin: BytesLike;
};
export type HeaderInfoStructOutput = [
    methods: bigint,
    cache: CacheControlStructOutput,
    redirect: RedirectStructOutput,
    resourceAdmin: string
] & {
    methods: bigint;
    cache: CacheControlStructOutput;
    redirect: RedirectStructOutput;
    resourceAdmin: string;
};
export type ResponseLineStruct = {
    protocol: string;
    code: BigNumberish;
};
export type ResponseLineStructOutput = [protocol: string, code: bigint] & {
    protocol: string;
    code: bigint;
};
export type ResourceMetadataStruct = {
    mimeType: BytesLike;
    charset: BytesLike;
    encoding: BytesLike;
    language: BytesLike;
    size: BigNumberish;
    version: BigNumberish;
    lastModified: BigNumberish;
    header: BytesLike;
};
export type ResourceMetadataStructOutput = [
    mimeType: string,
    charset: string,
    encoding: string,
    language: string,
    size: bigint,
    version: bigint,
    lastModified: bigint,
    header: string
] & {
    mimeType: string;
    charset: string;
    encoding: string;
    language: string;
    size: bigint;
    version: bigint;
    lastModified: bigint;
    header: string;
};
export type HEADResponseStruct = {
    responseLine: ResponseLineStruct;
    headerInfo: HeaderInfoStruct;
    metadata: ResourceMetadataStruct;
    etag: BytesLike;
};
export type HEADResponseStructOutput = [
    responseLine: ResponseLineStructOutput,
    headerInfo: HeaderInfoStructOutput,
    metadata: ResourceMetadataStructOutput,
    etag: string
] & {
    responseLine: ResponseLineStructOutput;
    headerInfo: HeaderInfoStructOutput;
    metadata: ResourceMetadataStructOutput;
    etag: string;
};
export type DEFINEResponseStruct = {
    head: HEADResponseStruct;
    headerAddress: BytesLike;
};
export type DEFINEResponseStructOutput = [
    head: HEADResponseStructOutput,
    headerAddress: string
] & {
    head: HEADResponseStructOutput;
    headerAddress: string;
};
export type LOCATEResponseStruct = {
    head: HEADResponseStruct;
    dataPoints: BytesLike[];
};
export type LOCATEResponseStructOutput = [
    head: HEADResponseStructOutput,
    dataPoints: string[]
] & {
    head: HEADResponseStructOutput;
    dataPoints: string[];
};
export type RequestLineStruct = {
    protocol: string;
    path: string;
    method: BigNumberish;
};
export type RequestLineStructOutput = [
    protocol: string,
    path: string,
    method: bigint
] & {
    protocol: string;
    path: string;
    method: bigint;
};
export type HEADRequestStruct = {
    requestLine: RequestLineStruct;
    ifModifiedSince: BigNumberish;
    ifNoneMatch: BytesLike;
};
export type HEADRequestStructOutput = [
    requestLine: RequestLineStructOutput,
    ifModifiedSince: bigint,
    ifNoneMatch: string
] & {
    requestLine: RequestLineStructOutput;
    ifModifiedSince: bigint;
    ifNoneMatch: string;
};
export type DEFINERequestStruct = {
    head: HEADRequestStruct;
    data: HeaderInfoStruct;
};
export type DEFINERequestStructOutput = [
    head: HEADRequestStructOutput,
    data: HeaderInfoStructOutput
] & {
    head: HEADRequestStructOutput;
    data: HeaderInfoStructOutput;
};
export type OPTIONSResponseStruct = {
    responseLine: ResponseLineStruct;
    allow: BigNumberish;
};
export type OPTIONSResponseStructOutput = [
    responseLine: ResponseLineStructOutput,
    allow: bigint
] & {
    responseLine: ResponseLineStructOutput;
    allow: bigint;
};
export type DataRegistrationStruct = {
    data: BytesLike;
    chunkIndex: BigNumberish;
    publisher: AddressLike;
};
export type DataRegistrationStructOutput = [
    data: string,
    chunkIndex: bigint,
    publisher: string
] & {
    data: string;
    chunkIndex: bigint;
    publisher: string;
};
export type PATCHRequestStruct = {
    head: HEADRequestStruct;
    data: DataRegistrationStruct[];
};
export type PATCHRequestStructOutput = [
    head: HEADRequestStructOutput,
    data: DataRegistrationStructOutput[]
] & {
    head: HEADRequestStructOutput;
    data: DataRegistrationStructOutput[];
};
export type PUTRequestStruct = {
    head: HEADRequestStruct;
    mimeType: BytesLike;
    charset: BytesLike;
    encoding: BytesLike;
    language: BytesLike;
    data: DataRegistrationStruct[];
};
export type PUTRequestStructOutput = [
    head: HEADRequestStructOutput,
    mimeType: string,
    charset: string,
    encoding: string,
    language: string,
    data: DataRegistrationStructOutput[]
] & {
    head: HEADRequestStructOutput;
    mimeType: string;
    charset: string;
    encoding: string;
    language: string;
    data: DataRegistrationStructOutput[];
};
export interface Web3SiteInterface extends Interface {
    getFunction(nameOrSignature: "DEFAULT_ADMIN_ROLE" | "DEFINE" | "DELETE" | "DPR" | "DPS" | "GET" | "HEAD" | "LOCATE" | "OPTIONS" | "PATCH" | "PUT" | "_updateDefaultHeader" | "changeSiteAdmin" | "createResourceRole" | "getRoleAdmin" | "grantRole" | "hasRole" | "renounceRole" | "revokeRole" | "setDPR" | "supportsInterface"): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: "DEFINESuccess" | "DELETESuccess" | "MetadataDeleted" | "MetadataUpdated" | "OutOfBoundsChunk" | "PATCHSuccess" | "PUTSuccess" | "ResourceCreated" | "ResourceDeleted" | "ResourceRoleCreated" | "ResourceUpdated" | "RoleAdminChanged" | "RoleGranted" | "RoleRevoked" | "SiteAdminChanged"): EventFragment;
    encodeFunctionData(functionFragment: "DEFAULT_ADMIN_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "DEFINE", values: [DEFINERequestStruct]): string;
    encodeFunctionData(functionFragment: "DELETE", values: [HEADRequestStruct]): string;
    encodeFunctionData(functionFragment: "DPR", values?: undefined): string;
    encodeFunctionData(functionFragment: "DPS", values?: undefined): string;
    encodeFunctionData(functionFragment: "GET", values: [HEADRequestStruct]): string;
    encodeFunctionData(functionFragment: "HEAD", values: [HEADRequestStruct]): string;
    encodeFunctionData(functionFragment: "LOCATE", values: [HEADRequestStruct]): string;
    encodeFunctionData(functionFragment: "OPTIONS", values: [RequestLineStruct]): string;
    encodeFunctionData(functionFragment: "PATCH", values: [PATCHRequestStruct]): string;
    encodeFunctionData(functionFragment: "PUT", values: [PUTRequestStruct]): string;
    encodeFunctionData(functionFragment: "_updateDefaultHeader", values: [HeaderInfoStruct]): string;
    encodeFunctionData(functionFragment: "changeSiteAdmin", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "createResourceRole", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "getRoleAdmin", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "grantRole", values: [BytesLike, AddressLike]): string;
    encodeFunctionData(functionFragment: "hasRole", values: [BytesLike, AddressLike]): string;
    encodeFunctionData(functionFragment: "renounceRole", values: [BytesLike, AddressLike]): string;
    encodeFunctionData(functionFragment: "revokeRole", values: [BytesLike, AddressLike]): string;
    encodeFunctionData(functionFragment: "setDPR", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [BytesLike]): string;
    decodeFunctionResult(functionFragment: "DEFAULT_ADMIN_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "DEFINE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "DELETE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "DPR", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "DPS", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "GET", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "HEAD", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "LOCATE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "OPTIONS", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "PATCH", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "PUT", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "_updateDefaultHeader", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "changeSiteAdmin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createResourceRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleAdmin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setDPR", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
}
export declare namespace DEFINESuccessEvent {
    type InputTuple = [
        publisher: AddressLike,
        defineResponse: DEFINEResponseStruct
    ];
    type OutputTuple = [
        publisher: string,
        defineResponse: DEFINEResponseStructOutput
    ];
    interface OutputObject {
        publisher: string;
        defineResponse: DEFINEResponseStructOutput;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace DELETESuccessEvent {
    type InputTuple = [
        publisher: AddressLike,
        deleteResponse: HEADResponseStruct
    ];
    type OutputTuple = [
        publisher: string,
        deleteResponse: HEADResponseStructOutput
    ];
    interface OutputObject {
        publisher: string;
        deleteResponse: HEADResponseStructOutput;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace MetadataDeletedEvent {
    type InputTuple = [path: string];
    type OutputTuple = [path: string];
    interface OutputObject {
        path: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace MetadataUpdatedEvent {
    type InputTuple = [path: string];
    type OutputTuple = [path: string];
    interface OutputObject {
        path: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace OutOfBoundsChunkEvent {
    type InputTuple = [path: string, chunkIndex: BigNumberish];
    type OutputTuple = [path: string, chunkIndex: bigint];
    interface OutputObject {
        path: string;
        chunkIndex: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace PATCHSuccessEvent {
    type InputTuple = [
        publisher: AddressLike,
        patchResponse: LOCATEResponseStruct
    ];
    type OutputTuple = [
        publisher: string,
        patchResponse: LOCATEResponseStructOutput
    ];
    interface OutputObject {
        publisher: string;
        patchResponse: LOCATEResponseStructOutput;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace PUTSuccessEvent {
    type InputTuple = [
        publisher: AddressLike,
        putResponse: LOCATEResponseStruct
    ];
    type OutputTuple = [
        publisher: string,
        putResponse: LOCATEResponseStructOutput
    ];
    interface OutputObject {
        publisher: string;
        putResponse: LOCATEResponseStructOutput;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ResourceCreatedEvent {
    type InputTuple = [path: string];
    type OutputTuple = [path: string];
    interface OutputObject {
        path: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ResourceDeletedEvent {
    type InputTuple = [path: string];
    type OutputTuple = [path: string];
    interface OutputObject {
        path: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ResourceRoleCreatedEvent {
    type InputTuple = [role: BytesLike];
    type OutputTuple = [role: string];
    interface OutputObject {
        role: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace ResourceUpdatedEvent {
    type InputTuple = [path: string, chunkIndex: BigNumberish];
    type OutputTuple = [path: string, chunkIndex: bigint];
    interface OutputObject {
        path: string;
        chunkIndex: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RoleAdminChangedEvent {
    type InputTuple = [
        role: BytesLike,
        previousAdminRole: BytesLike,
        newAdminRole: BytesLike
    ];
    type OutputTuple = [
        role: string,
        previousAdminRole: string,
        newAdminRole: string
    ];
    interface OutputObject {
        role: string;
        previousAdminRole: string;
        newAdminRole: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RoleGrantedEvent {
    type InputTuple = [
        role: BytesLike,
        account: AddressLike,
        sender: AddressLike
    ];
    type OutputTuple = [role: string, account: string, sender: string];
    interface OutputObject {
        role: string;
        account: string;
        sender: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RoleRevokedEvent {
    type InputTuple = [
        role: BytesLike,
        account: AddressLike,
        sender: AddressLike
    ];
    type OutputTuple = [role: string, account: string, sender: string];
    interface OutputObject {
        role: string;
        account: string;
        sender: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace SiteAdminChangedEvent {
    type InputTuple = [oldSiteAdmin: BytesLike, newSiteAdmin: BytesLike];
    type OutputTuple = [oldSiteAdmin: string, newSiteAdmin: string];
    interface OutputObject {
        oldSiteAdmin: string;
        newSiteAdmin: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface Web3Site extends BaseContract {
    connect(runner?: ContractRunner | null): Web3Site;
    waitForDeployment(): Promise<this>;
    interface: Web3SiteInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    DEFAULT_ADMIN_ROLE: TypedContractMethod<[], [string], "view">;
    DEFINE: TypedContractMethod<[
        defineRequest: DEFINERequestStruct
    ], [
        DEFINEResponseStructOutput
    ], "nonpayable">;
    DELETE: TypedContractMethod<[
        deleteRequest: HEADRequestStruct
    ], [
        HEADResponseStructOutput
    ], "nonpayable">;
    DPR: TypedContractMethod<[], [string], "view">;
    DPS: TypedContractMethod<[], [string], "view">;
    GET: TypedContractMethod<[
        getRequest: HEADRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "view">;
    HEAD: TypedContractMethod<[
        headRequest: HEADRequestStruct
    ], [
        HEADResponseStructOutput
    ], "view">;
    LOCATE: TypedContractMethod<[
        locateRequest: HEADRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "view">;
    OPTIONS: TypedContractMethod<[
        optionsRequest: RequestLineStruct
    ], [
        OPTIONSResponseStructOutput
    ], "view">;
    PATCH: TypedContractMethod<[
        patchRequest: PATCHRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "payable">;
    PUT: TypedContractMethod<[
        putRequest: PUTRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "payable">;
    _updateDefaultHeader: TypedContractMethod<[
        _header: HeaderInfoStruct
    ], [
        void
    ], "nonpayable">;
    changeSiteAdmin: TypedContractMethod<[
        _newSiteAdmin: BytesLike
    ], [
        void
    ], "nonpayable">;
    createResourceRole: TypedContractMethod<[
        _role: BytesLike
    ], [
        void
    ], "nonpayable">;
    getRoleAdmin: TypedContractMethod<[role: BytesLike], [string], "view">;
    grantRole: TypedContractMethod<[
        role: BytesLike,
        account: AddressLike
    ], [
        void
    ], "nonpayable">;
    hasRole: TypedContractMethod<[
        role: BytesLike,
        account: AddressLike
    ], [
        boolean
    ], "view">;
    renounceRole: TypedContractMethod<[
        role: BytesLike,
        callerConfirmation: AddressLike
    ], [
        void
    ], "nonpayable">;
    revokeRole: TypedContractMethod<[
        role: BytesLike,
        account: AddressLike
    ], [
        void
    ], "nonpayable">;
    setDPR: TypedContractMethod<[_dpr: AddressLike], [void], "nonpayable">;
    supportsInterface: TypedContractMethod<[
        interfaceId: BytesLike
    ], [
        boolean
    ], "view">;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: "DEFAULT_ADMIN_ROLE"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "DEFINE"): TypedContractMethod<[
        defineRequest: DEFINERequestStruct
    ], [
        DEFINEResponseStructOutput
    ], "nonpayable">;
    getFunction(nameOrSignature: "DELETE"): TypedContractMethod<[
        deleteRequest: HEADRequestStruct
    ], [
        HEADResponseStructOutput
    ], "nonpayable">;
    getFunction(nameOrSignature: "DPR"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "DPS"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "GET"): TypedContractMethod<[
        getRequest: HEADRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "view">;
    getFunction(nameOrSignature: "HEAD"): TypedContractMethod<[
        headRequest: HEADRequestStruct
    ], [
        HEADResponseStructOutput
    ], "view">;
    getFunction(nameOrSignature: "LOCATE"): TypedContractMethod<[
        locateRequest: HEADRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "view">;
    getFunction(nameOrSignature: "OPTIONS"): TypedContractMethod<[
        optionsRequest: RequestLineStruct
    ], [
        OPTIONSResponseStructOutput
    ], "view">;
    getFunction(nameOrSignature: "PATCH"): TypedContractMethod<[
        patchRequest: PATCHRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "payable">;
    getFunction(nameOrSignature: "PUT"): TypedContractMethod<[
        putRequest: PUTRequestStruct
    ], [
        LOCATEResponseStructOutput
    ], "payable">;
    getFunction(nameOrSignature: "_updateDefaultHeader"): TypedContractMethod<[_header: HeaderInfoStruct], [void], "nonpayable">;
    getFunction(nameOrSignature: "changeSiteAdmin"): TypedContractMethod<[_newSiteAdmin: BytesLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "createResourceRole"): TypedContractMethod<[_role: BytesLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "getRoleAdmin"): TypedContractMethod<[role: BytesLike], [string], "view">;
    getFunction(nameOrSignature: "grantRole"): TypedContractMethod<[
        role: BytesLike,
        account: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "hasRole"): TypedContractMethod<[
        role: BytesLike,
        account: AddressLike
    ], [
        boolean
    ], "view">;
    getFunction(nameOrSignature: "renounceRole"): TypedContractMethod<[
        role: BytesLike,
        callerConfirmation: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "revokeRole"): TypedContractMethod<[
        role: BytesLike,
        account: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "setDPR"): TypedContractMethod<[_dpr: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "supportsInterface"): TypedContractMethod<[interfaceId: BytesLike], [boolean], "view">;
    getEvent(key: "DEFINESuccess"): TypedContractEvent<DEFINESuccessEvent.InputTuple, DEFINESuccessEvent.OutputTuple, DEFINESuccessEvent.OutputObject>;
    getEvent(key: "DELETESuccess"): TypedContractEvent<DELETESuccessEvent.InputTuple, DELETESuccessEvent.OutputTuple, DELETESuccessEvent.OutputObject>;
    getEvent(key: "MetadataDeleted"): TypedContractEvent<MetadataDeletedEvent.InputTuple, MetadataDeletedEvent.OutputTuple, MetadataDeletedEvent.OutputObject>;
    getEvent(key: "MetadataUpdated"): TypedContractEvent<MetadataUpdatedEvent.InputTuple, MetadataUpdatedEvent.OutputTuple, MetadataUpdatedEvent.OutputObject>;
    getEvent(key: "OutOfBoundsChunk"): TypedContractEvent<OutOfBoundsChunkEvent.InputTuple, OutOfBoundsChunkEvent.OutputTuple, OutOfBoundsChunkEvent.OutputObject>;
    getEvent(key: "PATCHSuccess"): TypedContractEvent<PATCHSuccessEvent.InputTuple, PATCHSuccessEvent.OutputTuple, PATCHSuccessEvent.OutputObject>;
    getEvent(key: "PUTSuccess"): TypedContractEvent<PUTSuccessEvent.InputTuple, PUTSuccessEvent.OutputTuple, PUTSuccessEvent.OutputObject>;
    getEvent(key: "ResourceCreated"): TypedContractEvent<ResourceCreatedEvent.InputTuple, ResourceCreatedEvent.OutputTuple, ResourceCreatedEvent.OutputObject>;
    getEvent(key: "ResourceDeleted"): TypedContractEvent<ResourceDeletedEvent.InputTuple, ResourceDeletedEvent.OutputTuple, ResourceDeletedEvent.OutputObject>;
    getEvent(key: "ResourceRoleCreated"): TypedContractEvent<ResourceRoleCreatedEvent.InputTuple, ResourceRoleCreatedEvent.OutputTuple, ResourceRoleCreatedEvent.OutputObject>;
    getEvent(key: "ResourceUpdated"): TypedContractEvent<ResourceUpdatedEvent.InputTuple, ResourceUpdatedEvent.OutputTuple, ResourceUpdatedEvent.OutputObject>;
    getEvent(key: "RoleAdminChanged"): TypedContractEvent<RoleAdminChangedEvent.InputTuple, RoleAdminChangedEvent.OutputTuple, RoleAdminChangedEvent.OutputObject>;
    getEvent(key: "RoleGranted"): TypedContractEvent<RoleGrantedEvent.InputTuple, RoleGrantedEvent.OutputTuple, RoleGrantedEvent.OutputObject>;
    getEvent(key: "RoleRevoked"): TypedContractEvent<RoleRevokedEvent.InputTuple, RoleRevokedEvent.OutputTuple, RoleRevokedEvent.OutputObject>;
    getEvent(key: "SiteAdminChanged"): TypedContractEvent<SiteAdminChangedEvent.InputTuple, SiteAdminChangedEvent.OutputTuple, SiteAdminChangedEvent.OutputObject>;
    filters: {
        "DEFINESuccess(address,tuple)": TypedContractEvent<DEFINESuccessEvent.InputTuple, DEFINESuccessEvent.OutputTuple, DEFINESuccessEvent.OutputObject>;
        DEFINESuccess: TypedContractEvent<DEFINESuccessEvent.InputTuple, DEFINESuccessEvent.OutputTuple, DEFINESuccessEvent.OutputObject>;
        "DELETESuccess(address,tuple)": TypedContractEvent<DELETESuccessEvent.InputTuple, DELETESuccessEvent.OutputTuple, DELETESuccessEvent.OutputObject>;
        DELETESuccess: TypedContractEvent<DELETESuccessEvent.InputTuple, DELETESuccessEvent.OutputTuple, DELETESuccessEvent.OutputObject>;
        "MetadataDeleted(string)": TypedContractEvent<MetadataDeletedEvent.InputTuple, MetadataDeletedEvent.OutputTuple, MetadataDeletedEvent.OutputObject>;
        MetadataDeleted: TypedContractEvent<MetadataDeletedEvent.InputTuple, MetadataDeletedEvent.OutputTuple, MetadataDeletedEvent.OutputObject>;
        "MetadataUpdated(string)": TypedContractEvent<MetadataUpdatedEvent.InputTuple, MetadataUpdatedEvent.OutputTuple, MetadataUpdatedEvent.OutputObject>;
        MetadataUpdated: TypedContractEvent<MetadataUpdatedEvent.InputTuple, MetadataUpdatedEvent.OutputTuple, MetadataUpdatedEvent.OutputObject>;
        "OutOfBoundsChunk(string,uint256)": TypedContractEvent<OutOfBoundsChunkEvent.InputTuple, OutOfBoundsChunkEvent.OutputTuple, OutOfBoundsChunkEvent.OutputObject>;
        OutOfBoundsChunk: TypedContractEvent<OutOfBoundsChunkEvent.InputTuple, OutOfBoundsChunkEvent.OutputTuple, OutOfBoundsChunkEvent.OutputObject>;
        "PATCHSuccess(address,tuple)": TypedContractEvent<PATCHSuccessEvent.InputTuple, PATCHSuccessEvent.OutputTuple, PATCHSuccessEvent.OutputObject>;
        PATCHSuccess: TypedContractEvent<PATCHSuccessEvent.InputTuple, PATCHSuccessEvent.OutputTuple, PATCHSuccessEvent.OutputObject>;
        "PUTSuccess(address,tuple)": TypedContractEvent<PUTSuccessEvent.InputTuple, PUTSuccessEvent.OutputTuple, PUTSuccessEvent.OutputObject>;
        PUTSuccess: TypedContractEvent<PUTSuccessEvent.InputTuple, PUTSuccessEvent.OutputTuple, PUTSuccessEvent.OutputObject>;
        "ResourceCreated(string)": TypedContractEvent<ResourceCreatedEvent.InputTuple, ResourceCreatedEvent.OutputTuple, ResourceCreatedEvent.OutputObject>;
        ResourceCreated: TypedContractEvent<ResourceCreatedEvent.InputTuple, ResourceCreatedEvent.OutputTuple, ResourceCreatedEvent.OutputObject>;
        "ResourceDeleted(string)": TypedContractEvent<ResourceDeletedEvent.InputTuple, ResourceDeletedEvent.OutputTuple, ResourceDeletedEvent.OutputObject>;
        ResourceDeleted: TypedContractEvent<ResourceDeletedEvent.InputTuple, ResourceDeletedEvent.OutputTuple, ResourceDeletedEvent.OutputObject>;
        "ResourceRoleCreated(bytes32)": TypedContractEvent<ResourceRoleCreatedEvent.InputTuple, ResourceRoleCreatedEvent.OutputTuple, ResourceRoleCreatedEvent.OutputObject>;
        ResourceRoleCreated: TypedContractEvent<ResourceRoleCreatedEvent.InputTuple, ResourceRoleCreatedEvent.OutputTuple, ResourceRoleCreatedEvent.OutputObject>;
        "ResourceUpdated(string,uint256)": TypedContractEvent<ResourceUpdatedEvent.InputTuple, ResourceUpdatedEvent.OutputTuple, ResourceUpdatedEvent.OutputObject>;
        ResourceUpdated: TypedContractEvent<ResourceUpdatedEvent.InputTuple, ResourceUpdatedEvent.OutputTuple, ResourceUpdatedEvent.OutputObject>;
        "RoleAdminChanged(bytes32,bytes32,bytes32)": TypedContractEvent<RoleAdminChangedEvent.InputTuple, RoleAdminChangedEvent.OutputTuple, RoleAdminChangedEvent.OutputObject>;
        RoleAdminChanged: TypedContractEvent<RoleAdminChangedEvent.InputTuple, RoleAdminChangedEvent.OutputTuple, RoleAdminChangedEvent.OutputObject>;
        "RoleGranted(bytes32,address,address)": TypedContractEvent<RoleGrantedEvent.InputTuple, RoleGrantedEvent.OutputTuple, RoleGrantedEvent.OutputObject>;
        RoleGranted: TypedContractEvent<RoleGrantedEvent.InputTuple, RoleGrantedEvent.OutputTuple, RoleGrantedEvent.OutputObject>;
        "RoleRevoked(bytes32,address,address)": TypedContractEvent<RoleRevokedEvent.InputTuple, RoleRevokedEvent.OutputTuple, RoleRevokedEvent.OutputObject>;
        RoleRevoked: TypedContractEvent<RoleRevokedEvent.InputTuple, RoleRevokedEvent.OutputTuple, RoleRevokedEvent.OutputObject>;
        "SiteAdminChanged(bytes32,bytes32)": TypedContractEvent<SiteAdminChangedEvent.InputTuple, SiteAdminChangedEvent.OutputTuple, SiteAdminChangedEvent.OutputObject>;
        SiteAdminChanged: TypedContractEvent<SiteAdminChangedEvent.InputTuple, SiteAdminChangedEvent.OutputTuple, SiteAdminChangedEvent.OutputObject>;
    };
}
