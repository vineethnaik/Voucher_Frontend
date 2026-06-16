import { Voucher } from '../types';

export const certificationVouchers: Voucher[] = [
  {
    id: 'aws-saa',
    title: 'AWS Certified Solutions Architect - Associate',
    provider: 'AWS',
    iconName: 'Cloud',
    originalPrice: 150,
    discountPrice: 75,
    description: 'Validates ability to design and deploy secure and robust applications on AWS technologies.',
    badge: 'SAA-C03',
    requirements: ['Basic cloud architecture knowledge', '1 year AWS hands-on recommended']
  },
  {
    id: 'gcp-pca',
    title: 'Google Cloud Professional Cloud Architect',
    provider: 'Google Cloud',
    iconName: 'Server',
    originalPrice: 200,
    discountPrice: 100,
    description: 'Enables organizations to leverage Google Cloud technologies. Validates proficiency in designing cloud solutions.',
    badge: 'PCA-2026',
    requirements: ['Google Cloud console familiarity', '3+ years industry experience recommended']
  },
  {
    id: 'comptia-sec',
    title: 'CompTIA Security+',
    provider: 'CompTIA',
    iconName: 'Shield',
    originalPrice: 392,
    discountPrice: 196,
    description: 'The premier global baseline cybersecurity credential verifying core knowledge required of any cybersecurity role.',
    badge: 'SY0-701',
    requirements: ['Core security protocol understanding', '9 months network security experience recommended']
  },
  {
    id: 'sf-admin',
    title: 'Salesforce Certified Administrator',
    provider: 'Salesforce',
    iconName: 'Users',
    originalPrice: 200,
    discountPrice: 100,
    description: 'Designed for those who have experience with Salesforce administration, configuration, and data management.',
    badge: 'ADM-201',
    requirements: ['Salesforce lightning platform familiarity', '6 months admin experience recommended']
  },
  {
    id: 'az-900',
    title: 'Microsoft Certified: Azure Fundamentals',
    provider: 'Azure',
    iconName: 'Cpu',
    originalPrice: 99,
    discountPrice: 49,
    description: 'Validates foundational knowledge of cloud services and how those services are provided with Microsoft Azure.',
    badge: 'AZ-900',
    requirements: ['General IT concepts', 'Basic cloud service models']
  },
  {
    id: 'aws-ccp',
    title: 'AWS Certified Cloud Practitioner',
    provider: 'AWS',
    iconName: 'Globe',
    originalPrice: 100,
    discountPrice: 50,
    description: 'Provides an overall understanding of AWS Cloud platform core services, pricing models, and security structures.',
    badge: 'CLF-C02',
    requirements: ['No prior technical experience required', '6 months basic AWS knowledge recommended']
  }
];
