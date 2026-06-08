export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
};

export type HomeNotice = {
  id: string;
  content: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
};

export type CreateHomeBannerRequest = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder?: number;
  enabled?: boolean;
  createdBy: string;
};

export type UpdateHomeBannerRequest = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder?: number;
  enabled?: boolean;
};

export type CreateHomeNoticeRequest = {
  content: string;
  sortOrder?: number;
  enabled?: boolean;
  createdBy: string;
};

export type UpdateHomeNoticeRequest = {
  content: string;
  sortOrder?: number;
  enabled?: boolean;
};
