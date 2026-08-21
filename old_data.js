export const products = [
  { id: 1, name: "A4 Ruled Notebook", category: "Stationery", stock: 84, price: 65, supplier: "Navneet Edu.", barcode: "8901072003849" },
  { id: 2, name: "Classmate Geometry Box", category: "School", stock: 32, price: 125, supplier: "ITC Ltd.", barcode: "8901234567890" },
  { id: 3, name: "Reynolds 045 Pen (10pk)", category: "Stationery", stock: 7, price: 95, supplier: "Reynolds", barcode: "8901098765432" },
  { id: 4, name: "Moral Stories for Kids", category: "Books", stock: 18, price: 220, supplier: "Naveen Pub.", barcode: "9780123456789" },
  { id: 5, name: "Faber-Castell Color Pens", category: "School", stock: 0, price: 185, supplier: "Faber-Castell", barcode: "8901111222333" },
  { id: 6, name: "Gift Wrap Set Premium", category: "Gifts", stock: 41, price: 150, supplier: "LocalArt Co.", barcode: "8901444555666" },
  { id: 7, name: "Sticky Notes 3x3 (5pk)", category: "Office", stock: 5, price: 75, supplier: "3M India", barcode: "8901777888999" },
  { id: 8, name: "NCERT Maths Class 9", category: "Books", stock: 12, price: 80, supplier: "NCERT", barcode: "9788120403543" },
  { id: 9, name: "Rubik's Cube 3x3", category: "Toys", stock: 22, price: 350, supplier: "ToyMaster", barcode: "8901321654987" },
  { id: 10, name: "Highlighter Set (6 colors)", category: "Stationery", stock: 3, price: 110, supplier: "Camlin", barcode: "8901654321789" },
];

export const customers = [
  { id: 1, name: "Priya Sharma", phone: "9876543210", email: "priya@gmail.com", total: 4280 },
  { id: 2, name: "Rahul Gupta", phone: "9812345678", email: "rahul.g@gmail.com", total: 1860 },
  { id: 3, name: "Anjali Mehta", phone: "9900112233", email: "anjali.m@yahoo.com", total: 7320 },
  { id: 4, name: "Vikram Patel", phone: "9988776655", email: "vikramp@gmail.com", total: 980 },
  { id: 5, name: "Sunita Rao", phone: "9765432109", email: "sunita.rao@outlook.com", total: 3140 },
];

export const purchases = [
  { id: "PO-001", supplier: "Navneet Education", date: "2026-05-20", items: 8, amount: 14500, status: "received" },
  { id: "PO-002", supplier: "ITC Ltd.", date: "2026-05-18", items: 12, amount: 28000, status: "received" },
  { id: "PO-003", supplier: "Reynolds India", date: "2026-05-22", items: 5, amount: 9800, status: "pending" },
  { id: "PO-004", supplier: "Faber-Castell", date: "2026-05-17", items: 6, amount: 18600, status: "received" },
  { id: "PO-005", supplier: "NCERT Publications", date: "2026-05-23", items: 20, amount: 6400, status: "transit" },
];
