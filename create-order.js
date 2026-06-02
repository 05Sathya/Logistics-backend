const mongoose = require('mongoose');

async function createMockOrder() {
  await mongoose.connect('mongodb+srv://sathyajothiyoho_db_user:7Fv3xB7XuAvXNWmm@cluster0.suymx6s.mongodb.net/logistics');
  const db = mongoose.connection.db;

  const rider = await db.collection('riders').findOne({ status: 'available', activeOrders: 0 });
  if (!rider) {
    console.log('No rider available to assign.');
    mongoose.disconnect();
    return;
  }

  // Find an admin or client user to be the creator
  const clientUser = await db.collection('users').findOne({});

  const newOrder = {
    _id: new mongoose.Types.ObjectId(),
    client: clientUser._id,
    assignedRider: rider._id,
    pickupAddress: "123 Anna Salai, Chennai",
    dropAddress: "456 T Nagar, Chennai",
    packageDetails: "Urgent Medical Supplies",
    priority: "urgent",
    status: "assigned",
    timeline: [
      { status: "pending", timestamp: new Date() },
      { status: "assigned", timestamp: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  };

  await db.collection('orders').insertOne(newOrder);
  
  // Update rider to busy
  await db.collection('riders').updateOne(
    { _id: rider._id },
    { $set: { status: 'busy', activeOrders: 1 } }
  );

  console.log('Successfully created dynamic order in DB and assigned to rider!');
  console.log('Order ID:', newOrder._id);

  mongoose.disconnect();
}

createMockOrder().catch(console.error);
