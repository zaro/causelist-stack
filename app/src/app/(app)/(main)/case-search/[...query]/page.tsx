import CaseSearchResults from "./case-search-result.tsx";

export default function Page({ params }: { params: { query: string[] } }) {
  return <CaseSearchResults query={params.query} />;
}
