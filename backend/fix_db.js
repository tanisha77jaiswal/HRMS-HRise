import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://tanisha:abcd@cluster0.thtgkj4.mongodb.net/test?retryWrites=true&w=majority')
  .then(async () => {
    const StaffProfile = mongoose.model('StaffProfile', new mongoose.Schema({}, { strict: false }));

    // Upsert the staff profile for govind@admin.com
    await StaffProfile.updateOne(
      { email: 'govind@admin.com' },
      {
        $set: {
          name: 'Govind (Admin)',
          email: 'govind@admin.com',
          phone: '+91 99999 00000',
          location: 'Headquarters (Bangalore)',
          department: 'Executive Management',
          jobTitle: 'System Administrator',
          employeeId: 'HRise-ADM-001',
          dateJoined: '2024-01-15',
          notificationLevel: 'All Activity & Daily Summaries',
          language: 'English (US)',
          status: 'active'
        }
      },
      { upsert: true }
    );
    console.log('Successfully seeded StaffProfile for govind@admin.com');
    process.exit(0);
  })
  .catch(console.error);
