export interface Campus {
  id: string;
  name: string; // e.g. "SSTC"
  fullName: string; // e.g. "Shri Shankaracharya Technical Campus"
  city: string; // e.g. "Bhilai"
  state: string; // e.g. "Chhattisgarh"
  location: string; // e.g. "Bhilai, Chhattisgarh"
}

export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  college: string;
  campus: string;
  location: string;
  bio?: string;
  avatar?: string | null;
}

export const CAMPUSES: Campus[] = [
  {
    id: 'sstc',
    name: 'SSTC',
    fullName: 'Shri Shankaracharya Technical Campus',
    city: 'Bhilai',
    state: 'Chhattisgarh',
    location: 'Bhilai, Chhattisgarh',
  },
  {
    id: 'sspu',
    name: 'SSPU',
    fullName: 'Symbiosis Skills & Professional University',
    city: 'Pune',
    state: 'Maharashtra',
    location: 'Pune, Maharashtra',
  },
  {
    id: 'iit-delhi',
    name: 'IIT Delhi',
    fullName: 'Indian Institute of Technology Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    location: 'New Delhi, Delhi',
  },
  {
    id: 'bit-durg',
    name: 'BIT Durg',
    fullName: 'Bhilai Institute of Technology Durg',
    city: 'Durg',
    state: 'Chhattisgarh',
    location: 'Durg, Chhattisgarh',
  },
  {
    id: 'ssipmt',
    name: 'SSIPMT Raipur',
    fullName: 'Shri Shankaracharya Institute of Professional Management & Technology',
    city: 'Raipur',
    state: 'Chhattisgarh',
    location: 'Raipur, Chhattisgarh',
  },
  {
    id: 'nit-raipur',
    name: 'NIT Raipur',
    fullName: 'National Institute of Technology Raipur',
    city: 'Raipur',
    state: 'Chhattisgarh',
    location: 'Raipur, Chhattisgarh',
  },
  {
    id: 'iit-bombay',
    name: 'IIT Bombay',
    fullName: 'Indian Institute of Technology Bombay',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: 'Mumbai, Maharashtra',
  },
  {
    id: 'delhi-univ',
    name: 'Delhi University',
    fullName: 'University of Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    location: 'New Delhi, Delhi',
  },
  {
    id: 'other',
    name: 'Other',
    fullName: 'Other Campuses & Colleges',
    city: 'India',
    state: 'All Locations',
    location: 'Other Campus',
  },
];

export const SAMPLE_USERS: UserSearchResult[] = [
  {
    id: 'user-007',
    name: 'Abhishek Raj',
    username: 'abhishek',
    college: 'SSTC',
    campus: 'SSTC',
    location: 'Bhilai, Chhattisgarh',
    bio: 'Electronics student & tech enthusiast. 3rd year B.Tech.',
  },
  {
    id: 'user-002',
    name: 'Priya Patel',
    username: 'priyapatel',
    college: 'SSIPMT Raipur',
    campus: 'SSIPMT Raipur',
    location: 'Raipur, Chhattisgarh',
    bio: 'Final year CS student. Active seller of semester books & notes.',
  },
  {
    id: 'user-003',
    name: 'Rohan Mehta',
    username: 'rohan',
    college: 'SSTC',
    campus: 'SSTC',
    location: 'Bhilai, Chhattisgarh',
    bio: 'Tech enthusiast selling gadgets, electronics, and accessories.',
  },
  {
    id: 'user-001',
    name: 'Aryan Sharma',
    username: 'aryan',
    college: 'IIT Delhi',
    campus: 'IIT Delhi',
    location: 'New Delhi, Delhi',
    bio: 'Engineering student. Selling textbooks, calculators & laptops.',
  },
  {
    id: 'user-005',
    name: 'Vikram Singh',
    username: 'vikram',
    college: 'IIT Bombay',
    campus: 'IIT Bombay',
    location: 'Mumbai, Maharashtra',
    bio: 'Mechanical engineering. Selling lab tools, drafting kits & notes.',
  },
  {
    id: 'user-004',
    name: 'Sneha Iyer',
    username: 'sneha',
    college: 'NIT Raipur',
    campus: 'NIT Raipur',
    location: 'Raipur, Chhattisgarh',
    bio: 'Commerce student. Books, calculators and stationery seller.',
  },
  {
    id: 'user-006',
    name: 'Ananya Krishnan',
    username: 'ananya',
    college: 'Delhi University',
    campus: 'Delhi University',
    location: 'New Delhi, Delhi',
    bio: 'Literature and economics student. Selling humanities & science notes.',
  },
  {
    id: 'user-008',
    name: 'Ayush Verma',
    username: 'ayush',
    college: 'BIT Durg',
    campus: 'BIT Durg',
    location: 'Durg, Chhattisgarh',
    bio: 'Civil engineering student. Selling drafting tools & reference books.',
  },
  {
    id: 'user-009',
    name: 'Neha Sharma',
    username: 'neha',
    college: 'SSPU',
    campus: 'SSPU',
    location: 'Pune, Maharashtra',
    bio: 'Management student. Active reader and study group contributor.',
  },
];
