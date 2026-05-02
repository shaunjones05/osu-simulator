/** Activity definitions — EP costs and stat deltas from OSU Simulator master plan. */

export const ACTIVITIES = [
  {
    id: "study-valley-library",
    name: "Study at Valley Library",
    location: "Valley Library, Oregon State University",
    epCost: 3,
    effects: { gpa: 8, health: -2, happiness: -1, social: 0 },
  },
  {
    id: "class-cordley-hall",
    name: "Attend class at Cordley Hall",
    location: "Cordley Hall, Oregon State University",
    epCost: 2,
    effects: { gpa: 5, health: 0, happiness: 0, social: 2 },
  },
  {
    id: "gym-dixon-rec",
    name: "Gym at Dixon Rec Center",
    location: "Dixon Recreation Center, Oregon State University",
    epCost: 3,
    effects: { gpa: 0, health: 10, happiness: 3, social: 2 },
  },
  {
    id: "frat-party-26th",
    name: "Frat party on 26th Street",
    location: "Greek Row (26th Street), Corvallis",
    epCost: 3,
    effects: { gpa: -3, health: -5, happiness: 10, social: 10 },
  },
  {
    id: "football-reser",
    name: "Football game at Reser Stadium",
    location: "Reser Stadium, Oregon State University",
    epCost: 2,
    effects: { gpa: 0, health: 0, happiness: 8, social: 8 },
  },
  {
    id: "eat-arnold-dining",
    name: "Eat at Arnold Dining Hall",
    location: "Arnold Dining Hall, Oregon State University",
    epCost: 1,
    effects: { gpa: 0, health: 5, happiness: 3, social: 2 },
  },
  {
    id: "downward-dog-tiki-tuesday",
    name: "Downward Dog Tiki Tuesday",
    location: "Downward Dog, Corvallis",
    epCost: 2,
    effects: { gpa: -1, health: 3, happiness: 8, social: 8 },
  },
  {
    id: "rivas-taco-shop",
    name: "Late night Rivas Taco Shop",
    location: "Rivas Taco Shop, Corvallis",
    epCost: 1,
    effects: { gpa: 0, health: 3, happiness: 7, social: 4 },
  },
  {
    id: "sleep-in",
    name: "Sleep in",
    location: "On-campus housing, Corvallis",
    epCost: 1,
    effects: { gpa: 1, health: 6, happiness: 2, social: 0 },
  },
  {
    id: "club-mu",
    name: "Join a club at MU",
    location: "Memorial Union (MU), Oregon State University",
    epCost: 3,
    effects: { gpa: 1, health: 0, happiness: 4, social: 7 },
  },
  {
    id: "study-group-kelley",
    name: "Study group at Kelley Engineering Center",
    location: "Kelley Engineering Center, Oregon State University",
    epCost: 3,
    effects: { gpa: 7, health: 0, happiness: 2, social: 4 },
  },
];

export const INITIAL_STATS = {
  gpa: 50,
  health: 70,
  happiness: 65,
  social: 40,
};

export const ENERGY_BY_YEAR = {
  year1: 13,
  year2: 12,
  year3: 11,
  year4: 14,
};
