import MarketingNav from './components/MarketingNav'
import MarketingFooter from './components/MarketingFooter'
import HeroSection from './sections/HeroSection'
import ProductTourSection from './sections/ProductTourSection'
import FeaturesBentoSection from './sections/FeaturesBentoSection'
import HowItWorksSection from './sections/HowItWorksSection'
import TrustSection from './sections/TrustSection'
import SimulationsShowcase from './sections/SimulationsShowcase'
import PricingSection from './sections/PricingSection'
import FinalCtaSection from './sections/FinalCtaSection'

/** Public marketing landing page at `/`. Composition only — each section
 * owns its own content and data fetching. Carries its own nav/footer rather
 * than MainLayout, whose Navbar hard-depends on authenticated queries.
 *
 * The page is light throughout — rhythm comes from alternating white and
 * `surface-low` bands plus the colour accents, not from dark sections:
 * hero → tour → features → how → trust → catalogue → pricing → CTA. */
export default function LandingPage() {
  return (
    <div className="bg-white">
      <MarketingNav />
      <main>
        <HeroSection />
        <ProductTourSection />
        <FeaturesBentoSection />
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
