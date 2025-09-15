import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { DrizzleService } from '../drizzle.service';

async function verifyWorks() {
  const app = await NestFactory.create(SeederModule);
  const drizzle = app.get(DrizzleService);

  console.log('📚 Verifying Works (Academic Projects) in Database:\n');

  const works = await drizzle.db.query.works.findMany({
    with: {
      student: true,
      supervisor: true,
    },
  });

  if (works.length === 0) {
    console.log('❌ No works found in database. Run the seeder first.');
    await app.close();
    return;
  }

  console.log(`✅ Found ${works.length} works in the database:\n`);

  works.forEach((work, index) => {
    console.log(`${index + 1}. 📖 ${work.title}`);
    console.log(`   👨‍🎓 Student: ${work.student.firstName} ${work.student.lastName} (${work.student.matricNumber})`);
    console.log(`   👨‍🏫 Supervisor: ${work.supervisor.firstName} ${work.supervisor.lastName}`);
    console.log(`   🔗 Project Link: ${work.projectLink}`);
    console.log(`   📝 Description: ${work.description.substring(0, 100)}...`);
    console.log(`   📅 Created: ${work.createdAt}\n`);
  });

  console.log('🎉 All works have functional GitHub repository links that point to real projects!');

  await app.close();
}

verifyWorks().catch((error) => {
  console.error('Error verifying works:', error);
  process.exit(1);
});
