import Hero from "./_components/Hero";
import Header from "./_components/Header";
import Section from "./_components/Section";
import Testimonial from "./_components/Testimonial";
import ContactUs from "./_components/ContactUs";
import Footer from "./_components/Footer";
import AboutUs from "./_components/AboutUs";
import FAQ from "./_components/FAQ.tsx";

// export const revalidate = 3600; // revalidate at most every hour

export default function Home() {
  return (
    <>
      <Hero />
      <Section />
      <AboutUs />
      {/* <Testimonial /> */}
      <ContactUs />
      <FAQ />
    </>
  );
}
