export const durationtoMs = (duration: string): number | null => {
  switch (duration) {
    case '24hrs':
      return 24 * 60 * 60 * 1000;
    case '7days':
      return 7 * 24 * 60 * 60 * 1000;
    case '90days':
      return 90 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
};

export const getMuteExpiry = (duration: string): Date | null => {
  const now = new Date();
  switch (duration) {
    case '8hrs':
      return new Date(now.getTime() + 8 * 60 * 60 * 1000);
    case '1week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};
