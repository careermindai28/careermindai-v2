'use client'

import PricingCard from './PricingCard'
import ComparisonTable from './ComparisonTable'
import TrustSignals from './TrustSignals'
import PaymentMethods from './PaymentMethods'
import FAQSection from './FAQSection'
import TestimonialCard from './TestimonialCard'

interface PricingFeature {
  text: string
  included: boolean
  limit?: string
}

interface PricingPlan {
  name: string
  price: number
  period: string
  description: string
  features: PricingFeature[]
  cta: string
  ctaLink: string
  popular?: boolean
}

interface ComparisonFeature {
  category: string
  features: {
    name: string
    free: string | boolean
    starter: string | boolean
    pro: string | boolean
  }[]
}

interface TrustSignal {
  icon: string
  title: string
  description: string
}

interface PaymentMethod {
  name: string
  icon: string
  alt: string
}

interface FAQ {
  question: string
  answer: string
}

interface Testimonial {
  name: string
  role: string
  company: string
  image: string
  alt: string
  rating: number
  text: string
}

const PricingInteractive = () => {
  const pricingPlans: PricingPlan[] = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Try the audit, see your ResumeMind Score™, then upgrade if you want more.',
      features: [
        { text: 'Resume Audit', included: true, limit: '1 lifetime / device' },
        { text: 'ResumeMind Score™ breakdown', included: true },
        { text: 'Free Tools Access', included: true },
        { text: 'AI Resume Builder', included: false },
        { text: 'Interview Cheat Sheet (PDF)', included: false },
        { text: 'Pro tools (Translation/Heatmap/Salary)', included: false },
      ],
      cta: 'Start Free Audit',
      ctaLink: '/resume-audit-tool',
    },
    {
      name: 'Starter Pass',
      price: 99,
      period: 'for 30 days',
      description: 'Best for active job seekers who are applying regularly.',
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'AI Resume Builder', included: true },
        { text: 'Multiple Resume Versions', included: true },
        { text: 'Interview Cheat Sheet (PDF)', included: true },
        { text: 'LinkedIn Post Generator', included: true },
        { text: 'CareerPath Generator', included: true },
      ],
      cta: 'Upgrade to Starter',
      ctaLink: '/user-dashboard',
      popular: true,
    },
    {
      name: 'Pro Pass',
      price: 199,
      period: 'for 30 days',
      description: 'For serious job switching: advanced tools + premium differentiators.',
      features: [
        { text: 'Everything in Starter', included: true },
        { text: 'Resume Translation', included: true },
        { text: 'Government Resume Formats', included: true },
        { text: 'Resume Heatmap', included: true },
        { text: 'Salary Analyzer', included: true },
        { text: 'Priority Support', included: true },
      ],
      cta: 'Go Pro',
      ctaLink: '/user-dashboard',
    },
  ]

  const comparisonData: ComparisonFeature[] = [
    {
      category: 'Core Resume Tools',
      features: [
        { name: 'Resume Audit', free: '1/device', starter: true, pro: true },
        { name: 'ResumeMind Score™ breakdown', free: true, starter: true, pro: true },
        { name: 'AI Resume Builder', free: false, starter: true, pro: true },
        { name: 'Multiple Resume Versions', free: false, starter: true, pro: true },
      ],
    },
    {
      category: 'Growth Tools',
      features: [
        { name: 'Interview Cheat Sheet (PDF)', free: false, starter: true, pro: true },
        { name: 'LinkedIn Post Generator', free: false, starter: true, pro: true },
        { name: 'CareerPath Generator', free: false, starter: true, pro: true },
      ],
    },
    {
      category: 'Pro Differentiators',
      features: [
        { name: 'Resume Translation', free: false, starter: false, pro: true },
        { name: 'Government Resume Formats', free: false, starter: false, pro: true },
        { name: 'Resume Heatmap', free: false, starter: false, pro: true },
        { name: 'Salary Analyzer', free: false, starter: false, pro: true },
      ],
    },
  ]

  const trustSignals: TrustSignal[] = [
    {
      icon: 'ShieldCheckIcon',
      title: '30-Day Validity',
      description: 'Starter/Pro passes are valid for 30 days from purchase',
    },
    {
      icon: 'LockClosedIcon',
      title: 'Secure Payments',
      description: 'Payments are processed securely via Razorpay',
    },
    {
      icon: 'UserGroupIcon',
      title: 'Built for Results',
      description: 'Designed to improve ATS performance and interview conversion',
    },
  ]

  const paymentMethods: PaymentMethod[] = [
    {
      name: 'UPI',
      icon: 'https://img.rocket.new/generatedImages/rocket_gen_img_1375dbf5c-1764616382238.png',
      alt: 'UPI payment logo with orange and green colors',
    },
    {
      name: 'Visa',
      icon: 'https://img.rocket.new/generatedImages/rocket_gen_img_1eb877b22-1764616381499.png',
      alt: 'Visa credit card logo in blue and white',
    },
    {
      name: 'Mastercard',
      icon: 'https://img.rocket.new/generatedImages/rocket_gen_img_1dce1487a-1764616383190.png',
      alt: 'Mastercard logo with red and orange circles',
    },
    {
      name: 'RuPay',
      icon: 'https://img.rocket.new/generatedImages/rocket_gen_img_1c26dbb77-1764616383370.png',
      alt: 'RuPay card logo in orange and green',
    },
    {
      name: 'Net Banking',
      icon: 'https://img.rocket.new/generatedImages/rocket_gen_img_184cea4af-1764616381544.png',
      alt: 'Net banking icon with bank building symbol',
    },
  ]

  const faqs: FAQ[] = [
    {
      question: 'Is this a subscription?',
      answer:
        'No. Starter and Pro are one-time passes valid for 30 days. You can renew anytime.',
    },
    {
      question: 'Do I need to login to use the free audit?',
      answer:
        'No. You can run 1 free audit without login. After results, we’ll ask for email to save it.',
    },
    {
      question: 'Can I upgrade from Starter to Pro later?',
      answer:
        'Yes. You can upgrade anytime and unlock Pro tools immediately.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'If you face a technical issue that prevents usage, contact support and we’ll help quickly.',
    },
  ]

  const testimonials: Testimonial[] = [
    {
      name: 'Priya Sharma',
      role: 'Software Engineer',
      company: 'TCS',
      image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1c91c5de7-1763296268961.png',
      alt: 'Professional headshot of Indian woman with long dark hair in business attire smiling',
      rating: 5,
      text: 'Starter Pass made my resume sharper and I got interviews within days.',
    },
    {
      name: 'Rahul Verma',
      role: 'Marketing Manager',
      company: 'Flipkart',
      image: 'https://img.rocket.new/generatedImages/rocket_gen_img_15f0f6e6a-1763295844282.png',
      alt: 'Professional headshot of Indian man with short black hair in navy blue suit',
      rating: 5,
      text: 'Pro tools like Heatmap + Salary strategy were super useful for negotiation.',
    },
    {
      name: 'Anjali Patel',
      role: 'Data Analyst',
      company: 'Amazon',
      image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d71d6fc6-1763295655575.png',
      alt: 'Professional headshot of Indian woman with shoulder-length hair in white blouse',
      rating: 5,
      text: 'Free audit convinced me. Upgraded to Starter the same day.',
    },
  ]

  return (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Choose Your Pass</h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Pay once, unlock access for 30 days. No subscriptions.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {pricingPlans.map((plan, index) => (
          <PricingCard key={index} {...plan} billingType="monthly" />
        ))}
      </section>

      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Detailed Feature Comparison</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Compare features across plans to choose the right pass.
          </p>
        </div>
        <ComparisonTable data={comparisonData} />
      </section>

      <section>
        <TrustSignals signals={trustSignals} />
      </section>

      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">What Our Users Say</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Real outcomes from real job seekers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </section>

      <section>
        <PaymentMethods methods={paymentMethods} />
      </section>

      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Quick answers — simple, transparent, no confusion.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <FAQSection faqs={faqs} />
        </div>
      </section>
    </div>
  )
}

export default PricingInteractive
