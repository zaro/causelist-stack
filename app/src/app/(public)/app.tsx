import Hero from "./_components/Hero";
import Header from "./_components/Header";
import Section from "./_components/Section";
import Testimonial from "./_components/Testimonial";
import ContactUs from "./_components/ContactUs";
import Footer from "./_components/Footer";
import AboutUs from "./_components/AboutUs";
import CssBaseline from "@mui/material/CssBaseline";

function App({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CssBaseline />
      <Header />
      {children}
      <Footer />
    </>
  );
}

export default App;
