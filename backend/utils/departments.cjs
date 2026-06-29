const DEFAULT_DEPARTMENTS = [
  { id: 'public-works', name: 'Public Works', categories: ['Roads & Potholes', 'Drainage'] },
  { id: 'electricity', name: 'Electricity', categories: ['Lighting & Power', 'Street Light'] },
  { id: 'water-supply', name: 'Water Supply', categories: ['Water & Leakages', 'Water Leakage'] },
  { id: 'sanitation', name: 'Sanitation', categories: ['Garbage & Sanitation', 'Garbage'] },
  { id: 'traffic-police', name: 'Traffic Police', categories: ['Public Safety'] },
  { id: 'parks-recreation', name: 'Parks & Recreation', categories: ['Parks & Infrastructure'] },
];

const CATEGORY_TO_DEPARTMENT = {
  'Roads & Potholes': 'Public Works',
  'Drainage': 'Public Works',
  'Lighting & Power': 'Electricity',
  'Street Light': 'Electricity',
  'Water & Leakages': 'Water Supply',
  'Water Leakage': 'Water Supply',
  'Garbage & Sanitation': 'Sanitation',
  'Garbage': 'Sanitation',
  'Public Safety': 'Traffic Police',
  'Parks & Infrastructure': 'Parks & Recreation',
};

const getDepartmentForCategory = (category) => {
  return CATEGORY_TO_DEPARTMENT[category] || 'Public Works';
};

module.exports = {
  DEFAULT_DEPARTMENTS,
  CATEGORY_TO_DEPARTMENT,
  getDepartmentForCategory,
};
