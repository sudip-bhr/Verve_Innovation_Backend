const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');
const CaseStudy = require('./models/CaseStudy');
const TeamMember = require('./models/TeamMember');
const CompanyStat = require('./models/CompanyStat');

dotenv.config();

const services = [
  {
    title: 'App Development',
    shortDescription: 'We build native and cross-platform mobile experiences that delight users and drive engagement.',
    description: 'Our mobile team specializes in React Native and Swift to deliver high-performance applications tailored to your business needs.',
    order: 1,
  },
  {
    title: 'UX/UI Design',
    shortDescription: 'Intuitive, accessible, and beautiful interfaces backed by rigorous user research.',
    description: 'We don\'t just make things look good; we make them work seamlessly. Our design process bridges the gap between user needs and business goals.',
    order: 2,
  },
  {
    title: 'Web Development',
    shortDescription: 'Fast, secure, and scalable web applications built on modern stacks like React and Node.js.',
    description: 'From interactive marketing sites to complex SaaS platforms, we architect web solutions designed for performance and scale.',
    order: 3,
  },
  {
    title: 'Digital Marketing',
    shortDescription: 'Data-driven marketing strategies to grow your audience and convert visitors into loyal customers.',
    description: 'We leverage SEO, content strategy, and performance marketing to ensure your digital products reach the right audience.',
    order: 4,
  },
  {
    title: 'E-commerce',
    shortDescription: 'Custom commerce solutions that optimize the buying journey and maximize conversion rates.',
    description: 'Whether you are building a boutique storefront or a massive marketplace, our e-commerce solutions are built to sell.',
    order: 5,
  },
  {
    title: 'Cloud Solutions',
    shortDescription: 'Scalable infrastructure and cloud-native architectures for enterprise applications.',
    description: 'We design and deploy robust cloud architectures using AWS and Google Cloud to keep your products running smoothly 24/7.',
    order: 6,
  },
];

const caseStudies = [
  {
    title: 'FinTech Dashboard',
    categories: ['Digital Products', 'Software'],
    clientIndustry: 'Financial Services',
    summary: 'Increased user retention by 40% through a streamlined account overview.',
    description: 'We redesigned the core dashboard for a leading FinTech provider, focusing on data clarity and quick actions. The new architecture significantly reduced cognitive load and improved the overall user experience.',
    tags: ['Web App', 'UX/UI', 'React'],
    layout: 'grid',
    order: 1,
  },
  {
    title: 'Healthcare Portal',
    categories: ['Digital Products', 'Software'],
    clientIndustry: 'Health & Wellness',
    summary: 'A secure, HIPAA-compliant patient portal that simplified appointment scheduling.',
    description: 'Working closely with medical professionals, we built a portal that prioritizes patient accessibility while meeting strict security standards.',
    tags: ['Web App', 'Node.js', 'Security'],
    layout: 'grid',
    order: 2,
  },
  {
    title: 'Enterprise Logistics',
    categories: ['Software'],
    clientIndustry: 'Supply Chain Management',
    summary: 'A comprehensive modernization of a legacy system, delivering real-time tracking.',
    description: 'We replaced an outdated logistics system with a modern, cloud-native platform that provides real-time analytics for global freight operations. The new architecture improved operational efficiency by 28% in the first quarter.',
    tags: ['Enterprise Software', 'Custom Solutions', 'Cloud'],
    layout: 'feature',
    order: 3,
  },
  {
    title: 'SaaS Analytics Platform',
    categories: ['Software', 'Digital Products'],
    clientIndustry: 'B2B Software',
    summary: 'Empowering marketing teams with actionable insights and custom dashboards.',
    description: 'A powerful analytics tool designed to handle massive datasets while remaining intuitive for non-technical users.',
    tags: ['Web App', 'Dashboard'],
    layout: 'grid',
    order: 4,
  },
  {
    title: 'Mobile Banking App',
    categories: ['Mobile', 'Digital Products'],
    clientIndustry: 'FinTech',
    summary: 'Redefined mobile banking with a focus on seamless transactions and robust security.',
    description: 'A complete overhaul of a legacy mobile banking app, introducing biometric authentication and a conversational AI assistant.',
    tags: ['iOS App', 'Android App'],
    layout: 'grid',
    order: 5,
  },
  {
    title: 'E-commerce Experience',
    categories: ['Marketing', 'Digital Products'],
    clientIndustry: 'Retail & Lifestyle',
    summary: 'A premium digital storefront designed to elevate brand perception and increase conversions.',
    description: 'Combining high-performance frontend architecture with a headless CMS to deliver lightning-fast load times and immersive product discovery.',
    tags: ['E-commerce', 'Shopify', 'React Native'],
    layout: 'feature',
    order: 6,
  },
];

const teamMembers = [
  {
    name: 'Elena Rostova',
    role: 'Design Director',
    tagline: 'Turning complexity into visual clarity.',
    order: 1,
  },
  {
    name: 'Marcus Chen',
    role: 'Lead Engineer',
    tagline: 'Architecting scalable, resilient systems.',
    order: 2,
  },
  {
    name: 'Sarah Jenkins',
    role: 'Product Strategy',
    tagline: 'Aligning user needs with business goals.',
    order: 3,
  },
  {
    name: 'David Okafor',
    role: 'Creative Technologist',
    tagline: 'Bridging the gap between design and code.',
    order: 4,
  },
];

const companyStats = [
  {
    key: 'years_experience',
    value: 15,
    suffix: '+',
    label: 'Years of Experience',
  },
  {
    key: 'projects_completed',
    value: 200,
    suffix: '+',
    label: 'Projects Delivered',
  },
  {
    key: 'active_clients',
    value: 35,
    suffix: '+',
    label: 'Active Clients',
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await Service.deleteMany();
    await CaseStudy.deleteMany();
    await TeamMember.deleteMany();
    await CompanyStat.deleteMany();
    console.log('Existing data cleared.');

    // Seed new data
    await Service.insertMany(services);
    await CaseStudy.insertMany(caseStudies);
    await TeamMember.insertMany(teamMembers);
    await CompanyStat.insertMany(companyStats);
    console.log('Data successfully seeded!');

    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
