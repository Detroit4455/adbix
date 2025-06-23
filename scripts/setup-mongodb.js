const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('MongoDB Connection Setup');
console.log('=======================');
console.log('This script will help you set up your MongoDB connection.');
console.log('You can use a local MongoDB instance or a cloud service like MongoDB Atlas.');
console.log();

rl.question('Enter your MongoDB connection string (e.g., mongodb://localhost:27017/web-as-a-service): ', (connectionString) => {
  if (!connectionString) {
    console.log('No connection string provided. Using default local connection.');
    connectionString = 'mongodb://localhost:27017/web-as-a-service';
  }

  const envContent = `MONGODB_URI=${connectionString}`;
  const envPath = path.join(__dirname, '..', '.env.local');

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Successfully created .env.local file with your MongoDB connection string.');
    console.log('\nNext steps:');
    console.log('1. Make sure your MongoDB server is running');
    console.log('2. Start the development server with: npm run dev');
  } catch (error) {
    console.error('\n❌ Error creating .env.local file:', error.message);
  }

  rl.close();
}); 