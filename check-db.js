const mongoose = require('mongoose');

async function checkOrders() {
  await mongoose.connect('mongodb+srv://sathyajothiyoho_db_user:7Fv3xB7XuAvXNWmm@cluster0.suymx6s.mongodb.net/logistics');
  const db = mongoose.connection.db;

  const orders = await db.collection('orders').find({}).toArray();
  console.log('All Orders:', orders.map(o => ({ id: o._id, status: o.status, rider: o.assignedRider })));

  mongoose.disconnect();
}

checkOrders().catch(console.error);
