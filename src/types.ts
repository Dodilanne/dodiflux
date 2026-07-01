export type GenericEntry = {
  id: number;
  title: string;
  category: string;
  feed: string;
  feedId: number;
  publishedAt: string | undefined;
  content: string;
  isStarred: boolean;
};
