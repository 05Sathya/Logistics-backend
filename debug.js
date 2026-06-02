const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect('mongodb+srv://sathyajothiyoho_db_user:7Fv3xB7XuAvXNWmm@cluster0.suymx6s.mongodb.net/logistics');
  
  const db = mongoose.connection.db;
  
  const riders = await db.collection('riders').find({}).toArray();
  console.log('--- RIDERS ---');
  riders.forEach(r => console.log(`Rider ID: ${r._id}, User ID: ${r.user}, Status: ${r.status}, ActiveOrders: ${r.activeOrders}`));
  
  const orders = await db.collection('orders').find({}).toArray();
  console.log('\n--- ORDERS ---');
  orders.forEach(o => console.log(`Order ID: ${o._id}, Client: ${o.client}, AssignedRider: ${o.assignedRider}, Status: ${o.status}`));
  
  mongoose.disconnect();
}

debug().catch(console.error);
