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
