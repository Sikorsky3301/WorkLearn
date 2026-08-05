import MarketingNav from './components/MarketingNav'
import MarketingFooter from './components/MarketingFooter'
import HeroSection from './sections/HeroSection'
import TrustSection from './sections/TrustSection'
import HowItWorksSection from './sections/HowItWorksSection'
import SimulationsShowcase from './sections/SimulationsShowcase'
import PricingSection from './sections/PricingSection'
import FinalCtaSection from './sections/FinalCtaSection'

/** Public marketing landing page at `/`. Composition only — each section
 * owns its own content and data fetching. Carries its own nav/footer rather
 * than MainLayout, whose Navbar hard-depends on authenticated queries. */
export default function LandingPage() {
  return (
    <div className="bg-white">
      <MarketingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TrustSection />
        <SimulationsShowcase />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </div>
  )
}
