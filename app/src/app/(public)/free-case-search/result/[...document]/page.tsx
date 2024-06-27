import ShowSingleCase from "../../../../(app)/(main)/case-search/result/[...document]/show-single-case.tsx";

export default function Page({ params }: { params: { document: string[] } }) {
  return <ShowSingleCase document={params.document} />;
}
