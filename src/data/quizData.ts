import { QuizQuestion } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'aws-q1',
    examType: 'AWS',
    question: 'A company needs to host a global high-performance database with sub-millisecond latency. Which AWS service is the most appropriate?',
    options: [
      'Amazon RDS PostgreSQL',
      'Amazon DynamoDB with DAX',
      'Amazon S3 with Glacier',
      'Amazon Aurora Multi-Master'
    ],
    correctAnswer: 1,
    explanation: 'Amazon DynamoDB is a fully managed NoSQL database service, and when paired with DynamoDB Accelerator (DAX), it provides microsecond latency for read-heavy workloads, satisfying the user requirement for sub-millisecond latency at high performance.'
  },
  {
    id: 'aws-q2',
    examType: 'AWS',
    question: 'Which Amazon EC2 pricing model offers the highest discount (up to 90%) for fault-tolerant and flexible workloads?',
    options: [
      'On-Demand Instances',
      'Reserved Instances',
      'Savings Plans',
      'Spot Instances'
    ],
    correctAnswer: 3,
    explanation: 'Spot Instances let you take advantage of unused EC2 capacity in the AWS cloud. Spot Instances are available at up to a 90% discount compared to On-Demand prices, making them perfect for stateless, flexible, or fault-tolerant workloads.'
  },
  {
    id: 'aws-q3',
    examType: 'AWS',
    question: 'How can a Solutions Architect securely connect an on-premises datacenter to an VPC without traversing the public internet?',
    options: [
      'AWS Direct Connect',
      'AWS Client VPN',
      'AWS Transit Gateway over Public IP',
      'Amazon Route 53 Resolver'
    ],
    correctAnswer: 0,
    explanation: 'AWS Direct Connect establishes a dedicated, private network connection from your premises to AWS, completely bypassing the public internet for superior security, reliability, and consistent throughput.'
  },
  {
    id: 'aws-q4',
    examType: 'AWS',
    question: 'A stateful application suffers from occasional server failures, resulting in lost user session data. What is the recommended way to solve this?',
    options: [
      'Scale up the ECS tasks to the largest container sizes.',
      'Configure Sticky Sessions on the Application Load Balancer.',
      'Offload session state storage to Amazon ElastiCache or Amazon DynamoDB.',
      'Use instance store volumes on EC2 instead of Elastic Block Store (EBS).'
    ],
    correctAnswer: 2,
    explanation: 'Storing session state externally in a fast cache layer like Amazon ElastiCache (Redis/Memcached) or a reliable database like Amazon DynamoDB makes the application server tier stateless, ensuring session survival even if instance nodes crash.'
  },
  {
    id: 'aws-q5',
    examType: 'AWS',
    question: 'Which AWS service assists with consolidated billing and central user permission management across multiple AWS accounts?',
    options: [
      'AWS Organizations',
      'AWS Identity and Access Management (IAM)',
      'AWS Control Tower',
      'AWS Trusted Advisor'
    ],
    correctAnswer: 0,
    explanation: 'AWS Organizations helps you centrally govern and manage multiple AWS accounts. It offers consolidated billing, account creation APIs, policy-based access control, and seamless resource sharing.'
  },
  {
    id: 'gcp-q1',
    examType: 'Google Cloud',
    question: 'You want to deploy a containerized application that autoscales from 0 instances to thousands based on HTTP traffic, paying only for the exact resources consumed during execution. Which Google Cloud option is best?',
    options: [
      'Google Kubernetes Engine (GKE) Standard',
      'Compute Engine Managed Instance Groups',
      'Cloud Run',
      'App Engine Flexible Environment'
    ],
    correctAnswer: 2,
    explanation: 'Cloud Run is a fully managed serverless platform that automatically scales container images from zero to large volumes of requests without infrastructure overhead, charging you only for the CPU, memory, and requests used during processing.'
  },
  {
    id: 'gcp-q2',
    examType: 'Google Cloud',
    question: 'Which Cloud Storage storage class is most cost-effective for backup data that is accessed at most once per year?',
    options: [
      'Standard Storage',
      'Nearline Storage',
      'Coldline Storage',
      'Archive Storage'
    ],
    correctAnswer: 3,
    explanation: 'Archive Storage is the lowest cost, highly durable service for data archiving, online backup, and disaster recovery. It is optimal for data that you intend to access less than once a year.'
  },
  {
    id: 'gcp-q3',
    examType: 'Google Cloud',
    question: 'Which Google Cloud database provides global scale, horizontal write scaling, and external consistency transactions?',
    options: [
      'Cloud SQL',
      'Cloud Spanner',
      'Cloud Bigtable',
      'Firestore'
    ],
    correctAnswer: 1,
    explanation: 'Cloud Spanner is a fully managed, enterprise-grade, globally distributed, and strongly consistent relational database service that combines the benefits of relational database structure with non-relational infinite scale.'
  },
  {
    id: 'gcp-q4',
    examType: 'Google Cloud',
    question: 'You need to connect an on-premises network to virtual machines inside Google Cloud. You require a fast, SLA-backed connection with up to 100 Gbps bandwidth. Which network service fits best?',
    options: [
      'Cloud VPN with HA',
      'Carrier Peering',
      'Dedicated Interconnect',
      'Partner Interconnect'
    ],
    correctAnswer: 2,
    explanation: 'Dedicated Interconnect provides a direct physical connection between your on-premises network and Google\'s network grid, delivering high-speed bandwidth (10G or 100G per link) with industry-leading SLAs.'
  },
  {
    id: 'gcp-q5',
    examType: 'Google Cloud',
    question: 'How do you centrally manage access controls for Google Cloud resources, ensuring users have only the minimum necessary permissions to perform their specific tasks?',
    options: [
      'Cloud Identity Accounts',
      'IAM Roles with the Principle of Least Privilege',
      'Firewall Rules with IP blocking',
      'VPC Service Controls'
    ],
    correctAnswer: 1,
    explanation: 'Identity and Access Management (IAM) lets you grant granular access to specific Google Cloud resources. Applying custom or predefined roles following the Principle of Least Privilege ensures users only get the minimum access required.'
  }
];
