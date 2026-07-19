/**
 * students.ts
 * Single source of truth for all users in the Unify demo.
 * 160 hardcoded students (20 per department) + 2 system accounts (admin, moderator).
 * All student passwords: Student123
 * Admin password: admin123   Moderator password: mod123
 *
 * College: East West Institute of Technology (EWIT), Bangalore
 */

export interface StudentRecord {
  usn: string;
  name: string;
  username: string;
  password: string;
  email: string;
  department: string;
  semester: string;
  year: string;
  role: "user";
  avatarColor: string;
}

export interface SystemAccount {
  name: string;
  username: string;
  password: string;
  email: string;
  role: "admin" | "moderator";
  avatarColor: string;
}

// ─────────────────────────────────────────────────────────────────
// SYSTEM ACCOUNTS (not counted in the 160 students)
// ─────────────────────────────────────────────────────────────────
export const SYSTEM_ACCOUNTS: SystemAccount[] = [
  {
    name: "Administrator",
    username: "ADMIN",
    password: "admin123",
    email: "admin@ewit.edu",
    role: "admin",
    avatarColor: "#ef4444",
  },
  {
    name: "Moderator",
    username: "MODERATOR",
    password: "mod123",
    email: "moderator@ewit.edu",
    role: "moderator",
    avatarColor: "#f97316",
  },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Artificial Intelligence & Machine Learning
// USN Range: 1EW25AI001 → 1EW25AI020
// ─────────────────────────────────────────────────────────────────
const AIML_STUDENTS: StudentRecord[] = [
  { usn: "1EW25AI001", name: "Arjun Sharma", username: "arjunsh", password: "Student123", email: "arjunsh@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#7c5cff" },
  { usn: "1EW25AI002", name: "Priya Nair", username: "priyaml", password: "Student123", email: "priyaml@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#8b5cf6" },
  { usn: "1EW25AI003", name: "Rahul Venkatesh", username: "rahulvk", password: "Student123", email: "rahulvk@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#6d28d9" },
  { usn: "1EW25AI004", name: "Ananya Krishnan", username: "ananyak", password: "Student123", email: "ananyak@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#a78bfa" },
  { usn: "1EW25AI005", name: "Vikram Patel", username: "vkpatel", password: "Student123", email: "vkpatel@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#7c5cff" },
  { usn: "1EW25AI006", name: "Shreya Iyer", username: "shreyai", password: "Student123", email: "shreyai@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#c4b5fd" },
  { usn: "1EW25AI007", name: "Aditya Bose", username: "adityaml", password: "Student123", email: "adityaml@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#8b5cf6" },
  { usn: "1EW25AI008", name: "Kavya Reddy", username: "kavyar", password: "Student123", email: "kavyar@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#7c3aed" },
  { usn: "1EW25AI009", name: "Nikhil Joshi", username: "nikhilj", password: "Student123", email: "nikhilj@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#6d28d9" },
  { usn: "1EW25AI010", name: "Divya Menon", username: "divyam", password: "Student123", email: "divyam@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#a78bfa" },
  { usn: "1EW25AI011", name: "Rohan Gupta", username: "rohanvec", password: "Student123", email: "rohanvec@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#7c5cff" },
  { usn: "1EW25AI012", name: "Sneha Pillai", username: "snehaai", password: "Student123", email: "snehaai@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#8b5cf6" },
  { usn: "1EW25AI013", name: "Aman Thakur", username: "amanth", password: "Student123", email: "amanth@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#5b21b6" },
  { usn: "1EW25AI014", name: "Meera Srivastava", username: "meerasri", password: "Student123", email: "meerasri@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#c4b5fd" },
  { usn: "1EW25AI015", name: "Yash Dubey", username: "yashd", password: "Student123", email: "yashd@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#7c3aed" },
  { usn: "1EW25AI016", name: "Pooja Rao", username: "poojarao", password: "Student123", email: "poojarao@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#a78bfa" },
  { usn: "1EW25AI017", name: "Harsh Singh", username: "harshsig", password: "Student123", email: "harshsig@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#6d28d9" },
  { usn: "1EW25AI018", name: "Neha Kumar", username: "nehakr", password: "Student123", email: "nehakr@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#8b5cf6" },
  { usn: "1EW25AI019", name: "Deepak Pandey", username: "deepakp", password: "Student123", email: "deepakp@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#7c5cff" },
  { usn: "1EW25AI020", name: "Lakshmi Devi", username: "lakshmid", password: "Student123", email: "lakshmid@ewit.edu", department: "Artificial Intelligence & Machine Learning", semester: "1", year: "1st Year", role: "user", avatarColor: "#c4b5fd" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Computer Science & Engineering
// USN Range: 1EW25CS001 → 1EW25CS020
// ─────────────────────────────────────────────────────────────────
const CSE_STUDENTS: StudentRecord[] = [
  { usn: "1EW25CS001", name: "Siddharth Chauhan", username: "siddhcs", password: "Student123", email: "siddhcs@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#3b82f6" },
  { usn: "1EW25CS002", name: "Swati Mishra", username: "swatimcs", password: "Student123", email: "swatimcs@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#60a5fa" },
  { usn: "1EW25CS003", name: "Akash Rajput", username: "akashraj", password: "Student123", email: "akashraj@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#2563eb" },
  { usn: "1EW25CS004", name: "Pavitra Nair", username: "pavitran", password: "Student123", email: "pavitran@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#93c5fd" },
  { usn: "1EW25CS005", name: "Varun Khanna", username: "varuncs", password: "Student123", email: "varuncs@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#1d4ed8" },
  { usn: "1EW25CS006", name: "Ranjitha Shetty", username: "ranjitha", password: "Student123", email: "ranjitha@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#3b82f6" },
  { usn: "1EW25CS007", name: "Pradeep Verma", username: "pradeepv", password: "Student123", email: "pradeepv@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#60a5fa" },
  { usn: "1EW25CS008", name: "Sruthi Kamath", username: "sruthik", password: "Student123", email: "sruthik@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#2563eb" },
  { usn: "1EW25CS009", name: "Rajesh Kumar", username: "rajeshkcs", password: "Student123", email: "rajeshkcs@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#1d4ed8" },
  { usn: "1EW25CS010", name: "Nithya Suresh", username: "nithyasur", password: "Student123", email: "nithyasur@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#93c5fd" },
  { usn: "1EW25CS011", name: "Nitesh Pandey", username: "niteshp", password: "Student123", email: "niteshp@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#3b82f6" },
  { usn: "1EW25CS012", name: "Ramya Hegde", username: "ramyaheg", password: "Student123", email: "ramyaheg@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#60a5fa" },
  { usn: "1EW25CS013", name: "Mohit Agarwal", username: "mohitagr", password: "Student123", email: "mohitagr@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#2563eb" },
  { usn: "1EW25CS014", name: "Keerthana Bhat", username: "keerthbh", password: "Student123", email: "keerthbh@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#93c5fd" },
  { usn: "1EW25CS015", name: "Dev Kapoor", username: "devkap", password: "Student123", email: "devkap@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#1d4ed8" },
  { usn: "1EW25CS016", name: "Anusha Murthy", username: "anushacs", password: "Student123", email: "anushacs@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#3b82f6" },
  { usn: "1EW25CS017", name: "Kunal Rastogi", username: "kunalr", password: "Student123", email: "kunalr@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#60a5fa" },
  { usn: "1EW25CS018", name: "Bhavana Gowda", username: "bhavanag", password: "Student123", email: "bhavanag@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#2563eb" },
  { usn: "1EW25CS019", name: "Sachin Tomar", username: "sachint", password: "Student123", email: "sachint@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#1d4ed8" },
  { usn: "1EW25CS020", name: "Chandana Rao", username: "chandanar", password: "Student123", email: "chandanar@ewit.edu", department: "Computer Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#93c5fd" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Information Science & Engineering
// USN Range: 1EW25IS001 → 1EW25IS020
// ─────────────────────────────────────────────────────────────────
const ISE_STUDENTS: StudentRecord[] = [
  { usn: "1EW25IS001", name: "Vivek Singhania", username: "viveksin", password: "Student123", email: "viveksin@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#10b981" },
  { usn: "1EW25IS002", name: "Darshini Kumar", username: "darshini", password: "Student123", email: "darshini@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#34d399" },
  { usn: "1EW25IS003", name: "Ankit Mehta", username: "ankitmh", password: "Student123", email: "ankitmh@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#059669" },
  { usn: "1EW25IS004", name: "Esha Verma", username: "eshav", password: "Student123", email: "eshav@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#6ee7b7" },
  { usn: "1EW25IS005", name: "Sandeep Nair", username: "sandeepis", password: "Student123", email: "sandeepis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#047857" },
  { usn: "1EW25IS006", name: "Fatima Sheikh", username: "fatimash", password: "Student123", email: "fatimash@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#10b981" },
  { usn: "1EW25IS007", name: "Praveen Sharma", username: "praveenis", password: "Student123", email: "praveenis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#34d399" },
  { usn: "1EW25IS008", name: "Geetha Pillai", username: "geethap", password: "Student123", email: "geethap@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#059669" },
  { usn: "1EW25IS009", name: "Ajay Malhotra", username: "ajaymhot", password: "Student123", email: "ajaymhot@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#047857" },
  { usn: "1EW25IS010", name: "Harini Rajan", username: "hariniraj", password: "Student123", email: "hariniraj@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#6ee7b7" },
  { usn: "1EW25IS011", name: "Ramesh Iyer", username: "rameshis", password: "Student123", email: "rameshis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#10b981" },
  { usn: "1EW25IS012", name: "Iswarya Srinivasan", username: "iswarya", password: "Student123", email: "iswarya@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#34d399" },
  { usn: "1EW25IS013", name: "Gopal Reddy", username: "gopalis", password: "Student123", email: "gopalis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#059669" },
  { usn: "1EW25IS014", name: "Janani Subramanian", username: "jananis", password: "Student123", email: "jananis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#6ee7b7" },
  { usn: "1EW25IS015", name: "Sanjay Yadav", username: "sanjayis", password: "Student123", email: "sanjayis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#047857" },
  { usn: "1EW25IS016", name: "Kanika Patel", username: "kanikap", password: "Student123", email: "kanikap@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#10b981" },
  { usn: "1EW25IS017", name: "Dinesh Thakur", username: "dineshis", password: "Student123", email: "dineshis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#34d399" },
  { usn: "1EW25IS018", name: "Lavanya Menon", username: "lavanyam", password: "Student123", email: "lavanyam@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#059669" },
  { usn: "1EW25IS019", name: "Manish Gupta", username: "manishgis", password: "Student123", email: "manishgis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#047857" },
  { usn: "1EW25IS020", name: "Malathi Nambiar", username: "malathis", password: "Student123", email: "malathis@ewit.edu", department: "Information Science & Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#6ee7b7" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: IoT, Cybersecurity including Blockchain Technology
// USN Range: 1EW25IC001 → 1EW25IC020
// ─────────────────────────────────────────────────────────────────
const IOT_STUDENTS: StudentRecord[] = [
  { usn: "1EW25IC001", name: "Lokesh Bandi", username: "lokeshic", password: "Student123", email: "lokeshic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#ef4444" },
  { usn: "1EW25IC002", name: "Namitha Rao", username: "namithar", password: "Student123", email: "namithar@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#f87171" },
  { usn: "1EW25IC003", name: "Manoj Kumar", username: "manojkic", password: "Student123", email: "manojkic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#dc2626" },
  { usn: "1EW25IC004", name: "Ojaswini Sharma", username: "ojaswini", password: "Student123", email: "ojaswini@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#fca5a5" },
  { usn: "1EW25IC005", name: "Prasad Venkat", username: "prasadic", password: "Student123", email: "prasadic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#b91c1c" },
  { usn: "1EW25IC006", name: "Pallavi Singh", username: "pallavic", password: "Student123", email: "pallavic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#ef4444" },
  { usn: "1EW25IC007", name: "Ashwin Gowda", username: "ashwinic", password: "Student123", email: "ashwinic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#f87171" },
  { usn: "1EW25IC008", name: "Roshni Mehta", username: "roshnich", password: "Student123", email: "roshnich@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#dc2626" },
  { usn: "1EW25IC009", name: "Abhinav Kori", username: "abhinavic", password: "Student123", email: "abhinavic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#b91c1c" },
  { usn: "1EW25IC010", name: "Savitha Reddy", username: "savithac", password: "Student123", email: "savithac@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#fca5a5" },
  { usn: "1EW25IC011", name: "Kartik Prasad", username: "kartikic", password: "Student123", email: "kartikic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#ef4444" },
  { usn: "1EW25IC012", name: "Tanushree Pillai", username: "tanushic", password: "Student123", email: "tanushic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#f87171" },
  { usn: "1EW25IC013", name: "Tarun Balaji", username: "tarunic", password: "Student123", email: "tarunic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#dc2626" },
  { usn: "1EW25IC014", name: "Uma Rani", username: "umarani", password: "Student123", email: "umarani@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#fca5a5" },
  { usn: "1EW25IC015", name: "Vijay Krishna", username: "vijayic", password: "Student123", email: "vijayic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#b91c1c" },
  { usn: "1EW25IC016", name: "Vaishnavi Naik", username: "vaishnic", password: "Student123", email: "vaishnic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#ef4444" },
  { usn: "1EW25IC017", name: "Surya Prakash", username: "suryaic", password: "Student123", email: "suryaic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#f87171" },
  { usn: "1EW25IC018", name: "Yamini Bhat", username: "yaminiic", password: "Student123", email: "yaminiic@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#dc2626" },
  { usn: "1EW25IC019", name: "Narayan Murthy", username: "narayanm", password: "Student123", email: "narayanm@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#b91c1c" },
  // ── SPECIAL STUDENT ──
  { usn: "1EW25IC020", name: "Hemanth J R", username: "oghemz", password: "Student123", email: "oghemz@ewit.edu", department: "IoT, Cybersecurity including Blockchain Technology", semester: "1", year: "1st Year", role: "user", avatarColor: "#14b8a6" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Electronics & Communication Engineering
// USN Range: 1EW25EC001 → 1EW25EC020
// ─────────────────────────────────────────────────────────────────
const ECE_STUDENTS: StudentRecord[] = [
  { usn: "1EW25EC001", name: "Satish Babu", username: "satishec", password: "Student123", email: "satishec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#84cc16" },
  { usn: "1EW25EC002", name: "Zara Ahmed", username: "zaraah", password: "Student123", email: "zaraah@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#a3e635" },
  { usn: "1EW25EC003", name: "Venkat Subramaniam", username: "venkatec", password: "Student123", email: "venkatec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#65a30d" },
  { usn: "1EW25EC004", name: "Poornima Shenoy", username: "poornimec", password: "Student123", email: "poornimec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#bef264" },
  { usn: "1EW25EC005", name: "Shubham Saxena", username: "shubhamec", password: "Student123", email: "shubhamec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#4d7c0f" },
  { usn: "1EW25EC006", name: "Rishita Kapoor", username: "rishitak", password: "Student123", email: "rishitak@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#84cc16" },
  { usn: "1EW25EC007", name: "Gaurav Shukla", username: "gauravec", password: "Student123", email: "gauravec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#a3e635" },
  { usn: "1EW25EC008", name: "Shweta Patil", username: "shwetap", password: "Student123", email: "shwetap@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#65a30d" },
  { usn: "1EW25EC009", name: "Prashant Desai", username: "prashantec", password: "Student123", email: "prashantec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#4d7c0f" },
  { usn: "1EW25EC010", name: "Nandita Rao", username: "nanditaec", password: "Student123", email: "nanditaec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#bef264" },
  { usn: "1EW25EC011", name: "Santosh Pillai", username: "santoshec", password: "Student123", email: "santoshec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#84cc16" },
  { usn: "1EW25EC012", name: "Bhoomika Hegde", username: "bhoomikaec", password: "Student123", email: "bhoomikaec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#a3e635" },
  { usn: "1EW25EC013", name: "Chetan Naik", username: "chetanec", password: "Student123", email: "chetanec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#65a30d" },
  { usn: "1EW25EC014", name: "Sindhu Krishnan", username: "sindhuk", password: "Student123", email: "sindhuk@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#bef264" },
  { usn: "1EW25EC015", name: "Ravi Teja", username: "raviteja", password: "Student123", email: "raviteja@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#4d7c0f" },
  { usn: "1EW25EC016", name: "Madhuri Srinivas", username: "madhurisr", password: "Student123", email: "madhurisr@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#84cc16" },
  { usn: "1EW25EC017", name: "Suresh Babu", username: "sureshec", password: "Student123", email: "sureshec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#a3e635" },
  { usn: "1EW25EC018", name: "Indira Nair", username: "indiranr", password: "Student123", email: "indiranr@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#65a30d" },
  { usn: "1EW25EC019", name: "Kiran Rao", username: "kiranec", password: "Student123", email: "kiranec@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#4d7c0f" },
  { usn: "1EW25EC020", name: "Preethi Kumar", username: "preethiek", password: "Student123", email: "preethiek@ewit.edu", department: "Electronics & Communication Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#bef264" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Electrical & Electronics Engineering
// USN Range: 1EW25EE001 → 1EW25EE020
// ─────────────────────────────────────────────────────────────────
const EEE_STUDENTS: StudentRecord[] = [
  { usn: "1EW25EE001", name: "Rajkumar Nair", username: "rajkumee", password: "Student123", email: "rajkumee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f59e0b" },
  { usn: "1EW25EE002", name: "Sumitha Reddy", username: "sumithred", password: "Student123", email: "sumithred@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbbf24" },
  { usn: "1EW25EE003", name: "Balaji Krishnan", username: "balajikr", password: "Student123", email: "balajikr@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#d97706" },
  { usn: "1EW25EE004", name: "Rekha Sharma", username: "rekhaee", password: "Student123", email: "rekhaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fde68a" },
  { usn: "1EW25EE005", name: "Girish Gowda", username: "girishee", password: "Student123", email: "girishee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#b45309" },
  { usn: "1EW25EE006", name: "Sunita Iyer", username: "sunitaee", password: "Student123", email: "sunitaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f59e0b" },
  { usn: "1EW25EE007", name: "Madan Kumar", username: "madankee", password: "Student123", email: "madankee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbbf24" },
  { usn: "1EW25EE008", name: "Geeta Menon", username: "geetamee", password: "Student123", email: "geetamee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#d97706" },
  { usn: "1EW25EE009", name: "Bhuvan Rao", username: "bhuvanee", password: "Student123", email: "bhuvanee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#b45309" },
  { usn: "1EW25EE010", name: "Asha Patel", username: "ashaee", password: "Student123", email: "ashaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fde68a" },
  { usn: "1EW25EE011", name: "Suraj Hegde", username: "surajhee", password: "Student123", email: "surajhee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f59e0b" },
  { usn: "1EW25EE012", name: "Anitha Nambiar", username: "anithaee", password: "Student123", email: "anithaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbbf24" },
  { usn: "1EW25EE013", name: "Vinay Prasad", username: "vinayee", password: "Student123", email: "vinayee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#d97706" },
  { usn: "1EW25EE014", name: "Saritha Bhat", username: "sarithaee", password: "Student123", email: "sarithaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fde68a" },
  { usn: "1EW25EE015", name: "Vishal Yadav", username: "vishalee", password: "Student123", email: "vishalee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#b45309" },
  { usn: "1EW25EE016", name: "Usha Pillai", username: "ushaee", password: "Student123", email: "ushaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f59e0b" },
  { usn: "1EW25EE017", name: "Tushar Jain", username: "tusharee", password: "Student123", email: "tusharee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbbf24" },
  { usn: "1EW25EE018", name: "Nirmala Rao", username: "nirmalaee", password: "Student123", email: "nirmalaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#d97706" },
  { usn: "1EW25EE019", name: "Sameer Khan", username: "sameeree", password: "Student123", email: "sameeree@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#b45309" },
  { usn: "1EW25EE020", name: "Manjula Hegde", username: "manjulaee", password: "Student123", email: "manjulaee@ewit.edu", department: "Electrical & Electronics Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fde68a" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Mechanical Engineering
// USN Range: 1EW25ME001 → 1EW25ME020
// ─────────────────────────────────────────────────────────────────
const ME_STUDENTS: StudentRecord[] = [
  { usn: "1EW25ME001", name: "Ravi Kumar", username: "ravikme", password: "Student123", email: "ravikme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f97316" },
  { usn: "1EW25ME002", name: "Archana Iyer", username: "archanai", password: "Student123", email: "archanai@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fb923c" },
  { usn: "1EW25ME003", name: "Sunil Bajaj", username: "sunilme", password: "Student123", email: "sunilme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ea580c" },
  { usn: "1EW25ME004", name: "Deepthi Reddy", username: "deepthime", password: "Student123", email: "deepthime@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fed7aa" },
  { usn: "1EW25ME005", name: "Karthik Nair", username: "karthikme", password: "Student123", email: "karthikme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#c2410c" },
  { usn: "1EW25ME006", name: "Radhika Sharma", username: "radhikasme", password: "Student123", email: "radhikasme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f97316" },
  { usn: "1EW25ME007", name: "Pavan Kumar", username: "pavanme", password: "Student123", email: "pavanme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fb923c" },
  { usn: "1EW25ME008", name: "Soundarya Gowda", username: "soundarme", password: "Student123", email: "soundarme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ea580c" },
  { usn: "1EW25ME009", name: "Nagesh Rao", username: "nageshme", password: "Student123", email: "nageshme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#c2410c" },
  { usn: "1EW25ME010", name: "Kavitha Pillai", username: "kavithame", password: "Student123", email: "kavithame@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fed7aa" },
  { usn: "1EW25ME011", name: "Shyam Prasad", username: "shyamme", password: "Student123", email: "shyamme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f97316" },
  { usn: "1EW25ME012", name: "Savitri Nambiar", username: "savitrime", password: "Student123", email: "savitrime@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fb923c" },
  { usn: "1EW25ME013", name: "Vignesh Iyer", username: "vigneshme", password: "Student123", email: "vigneshme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ea580c" },
  { usn: "1EW25ME014", name: "Padmavathi Reddy", username: "padmavme", password: "Student123", email: "padmavme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fed7aa" },
  { usn: "1EW25ME015", name: "Harish Kumar", username: "harishme", password: "Student123", email: "harishme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#c2410c" },
  { usn: "1EW25ME016", name: "Nalini Suresh", username: "nalinime", password: "Student123", email: "nalinime@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f97316" },
  { usn: "1EW25ME017", name: "Subramaniam Pillai", username: "subramme", password: "Student123", email: "subramme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fb923c" },
  { usn: "1EW25ME018", name: "Vasudha Nair", username: "vasudhame", password: "Student123", email: "vasudhame@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ea580c" },
  { usn: "1EW25ME019", name: "Prabhu Deva", username: "prabhumv", password: "Student123", email: "prabhumv@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#c2410c" },
  { usn: "1EW25ME020", name: "Prabhakari Sharma", username: "prabhkme", password: "Student123", email: "prabhkme@ewit.edu", department: "Mechanical Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fed7aa" },
];

// ─────────────────────────────────────────────────────────────────
// DEPARTMENT: Civil Engineering
// USN Range: 1EW25CE001 → 1EW25CE020
// ─────────────────────────────────────────────────────────────────
const CE_STUDENTS: StudentRecord[] = [
  { usn: "1EW25CE001", name: "Arun Pillai", username: "arunce", password: "Student123", email: "arunce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ec4899" },
  { usn: "1EW25CE002", name: "Bindu Nair", username: "binduciv", password: "Student123", email: "binduciv@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f472b6" },
  { usn: "1EW25CE003", name: "Shankar Reddy", username: "shankarce", password: "Student123", email: "shankarce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#db2777" },
  { usn: "1EW25CE004", name: "Triveni Iyer", username: "trivence", password: "Student123", email: "trivence@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbcfe8" },
  { usn: "1EW25CE005", name: "Devraj Patel", username: "devrajce", password: "Student123", email: "devrajce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#be185d" },
  { usn: "1EW25CE006", name: "Mythili Srinivas", username: "mythilice", password: "Student123", email: "mythilice@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ec4899" },
  { usn: "1EW25CE007", name: "Ganesh Kumar", username: "ganeshce", password: "Student123", email: "ganeshce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f472b6" },
  { usn: "1EW25CE008", name: "Padma Lakshmi", username: "padmalce", password: "Student123", email: "padmalce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#db2777" },
  { usn: "1EW25CE009", name: "Sridhar Sharma", username: "sridhce", password: "Student123", email: "sridhce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#be185d" },
  { usn: "1EW25CE010", name: "Vanitha Rao", username: "vanithac", password: "Student123", email: "vanithac@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbcfe8" },
  { usn: "1EW25CE011", name: "Prakash Iyer", username: "prakashce", password: "Student123", email: "prakashce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ec4899" },
  { usn: "1EW25CE012", name: "Shakunthala Reddy", username: "shakuntce", password: "Student123", email: "shakuntce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f472b6" },
  { usn: "1EW25CE013", name: "Umesh Nair", username: "umeshce", password: "Student123", email: "umeshce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#db2777" },
  { usn: "1EW25CE014", name: "Ratna Pillai", username: "ratnace", password: "Student123", email: "ratnace@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbcfe8" },
  { usn: "1EW25CE015", name: "Hemant Gupta", username: "hemantce", password: "Student123", email: "hemantce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#be185d" },
  { usn: "1EW25CE016", name: "Latha Menon", username: "lathace", password: "Student123", email: "lathace@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#ec4899" },
  { usn: "1EW25CE017", name: "Subodh Kumar", username: "subodhce", password: "Student123", email: "subodhce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#f472b6" },
  { usn: "1EW25CE018", name: "Ambika Gowda", username: "ambikace", password: "Student123", email: "ambikace@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#db2777" },
  { usn: "1EW25CE019", name: "Ramdas Nair", username: "ramdasce", password: "Student123", email: "ramdasce@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#be185d" },
  { usn: "1EW25CE020", name: "Meghna Shetty", username: "meghnace", password: "Student123", email: "meghnace@ewit.edu", department: "Civil Engineering", semester: "1", year: "1st Year", role: "user", avatarColor: "#fbcfe8" },
];

// ─────────────────────────────────────────────────────────────────
// MASTER DATASET — 160 students across 8 departments
// Order: AI&ML, CSE, ISE, IoT/Cyber, ECE, EEE, ME, Civil
// ─────────────────────────────────────────────────────────────────
export const ALL_STUDENTS: StudentRecord[] = [
  ...AIML_STUDENTS,   // indices 0-19
  ...CSE_STUDENTS,    // indices 20-39
  ...ISE_STUDENTS,    // indices 40-59
  ...IOT_STUDENTS,    // indices 60-79  (oghemz = index 79)
  ...ECE_STUDENTS,    // indices 80-99
  ...EEE_STUDENTS,    // indices 100-119
  ...ME_STUDENTS,     // indices 120-139
  ...CE_STUDENTS,     // indices 140-159
];

// Seed marker — the special student whose existence confirms seeding is done
export const SEED_MARKER_USERNAME = "oghemz";
