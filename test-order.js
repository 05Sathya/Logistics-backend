const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

async function testOrderCreation() {
  await mongoose.connect('mongodb+srv://sathyajothiyoho_db_user:7Fv3xB7XuAvXNWmm@cluster0.suymx6s.mongodb.net/logistics');
  const db = mongoose.connection.db;

  const riders = await db.collection('riders').find({ status: 'available', activeOrders: 0 }).toArray();
  console.log('Available Riders for Assignment:', riders.length);
  
  if (riders.length > 0) {
    console.log('Rider found:', riders[0]._id);
  } else {
    console.log('NO RIDERS FOUND BY QUERY! THIS IS THE BUG.');
  }

  const orders = await db.collection('orders').find({}).toArray();
  console.log('Total Orders in DB:', orders.length);

  mongoose.disconnect();
}

testOrderCreation().catch(console.error);
