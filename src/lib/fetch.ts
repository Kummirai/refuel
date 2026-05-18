export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};

export const fetcherWithInit = (init?: RequestInit) => async (url: string) => {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};
