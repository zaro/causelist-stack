import Hero from "./_components/Hero";
import Header from "./_components/Header";
import Section from "./_components/Section";
import Testimonial from "./_components/Testimonial";
import ContactUs from "./_components/ContactUs";
import Footer from "./_components/Footer";
import AboutUs from "./_components/AboutUs";
import {
  APP_PREVIEW_PATH,
  getAppPreviewData,
} from "./_components/app-preview-data.ts";

// export const revalidate = 3600; // revalidate at most every hour
async function getFallbackData() {
  // `getStaticProps` is executed on the server side.
  const url = APP_PREVIEW_PATH.replace(/^\/api/, "http://api");
  const randomData = await getAppPreviewData(url);
  return {
    fallback: {
      [APP_PREVIEW_PATH]: randomData,
    },
  };
}

export default async function Home() {
  const { fallback } = await getFallbackData();
  return (
    <>
      <Hero fallback={fallback} />
      <Section />
      <AboutUs />
      {/* <Testimonial /> */}
      {/* <ContactUs /> */}
    </>
  );
}
