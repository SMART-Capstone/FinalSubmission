interface NftType {
  DisplayAssetHash: string;
  DisplayAssetKey: string;
  DocType: string;
  FileHashs: string;
  FileKeys: string;
  NftId: string;
  OriginalProjectId: string;
  OwnerId: string;
  TimeStamp: number;
  DisplayAssetUrl: string | undefined;
  ProjectName: string | undefined;
}

interface NftFileIncludeType extends NftType {
  FileUrls: string[];
}

export type { NftType, NftFileIncludeType };
