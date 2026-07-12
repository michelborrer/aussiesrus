export const SITE = {
  name: 'Aussies R Us',
  lockup: "Aussies R Us — Australia's independent solar & battery guide",
  url: 'https://aussiesrus.com.au',
  description:
    "Australia's independent solar & battery guide. Every figure verified against the Clean Energy Regulator.",
  email: 'hello@aussiesrus.com.au',
  /** Owner supplies final ABN before launch — ⚠ VERIFY */
  abn: 'ABN pending confirmation',
  operator: 'Michel Borrer',
  locale: 'en-AU',
} as const;

export const FOOTER_DISCLOSURE =
  'Aussies R Us is an independent information site. We may earn a commission from some links, and this is always disclosed. Figures are general information only, not financial advice — rebate values depend on your installation date and eligibility; confirm with the Clean Energy Regulator and your installer.';

export const FORM_CONSENT =
  'I agree to be contacted about my quote request by Aussies R Us and up to three installers or quoting partners, by phone, SMS or email.';

export const NAV = [
  {
    label: 'Battery rebate',
    href: '/battery-rebate/',
    children: [
      { label: 'Current rates', href: '/battery-rebate/' },
      { label: 'Rebate calculator', href: '/battery-rebate/calculator/' },
      { label: 'What changed May 2026', href: '/battery-rebate/what-changed-may-2026/' },
      { label: 'WA', href: '/battery-rebate/wa/' },
      { label: 'NSW', href: '/battery-rebate/nsw/' },
      { label: 'VIC', href: '/battery-rebate/vic/' },
      { label: 'QLD', href: '/battery-rebate/qld/' },
      { label: 'SA', href: '/battery-rebate/sa/' },
    ],
  },
  {
    label: 'Costs & payback',
    href: '/costs/10kwh-battery-cost/',
    children: [
      { label: '10 kWh battery cost', href: '/costs/10kwh-battery-cost/' },
      { label: '13.5 kWh battery cost', href: '/costs/13-5kwh-battery-cost/' },
      { label: '6.6 kW solar cost', href: '/costs/6-6kw-solar-system-cost/' },
      { label: 'Solar + battery Perth', href: '/costs/solar-battery-package-perth/' },
      { label: 'Is a battery worth it?', href: '/guides/is-a-battery-worth-it/' },
    ],
  },
  {
    label: 'Compare',
    href: '/compare/who-owns-solarquotes/',
    children: [
      { label: 'Who owns SolarQuotes?', href: '/compare/who-owns-solarquotes/' },
      { label: 'SolarQuotes alternatives', href: '/compare/solarquotes-alternatives/' },
    ],
  },
  { label: 'About', href: '/about/' },
] as const;
