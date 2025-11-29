export type GenericEntry = {
  id: number;
  title: string;
  category: string;
  feed: string;
  publishedAt: string | undefined;
  content: string;
  isStarred: boolean;
};
