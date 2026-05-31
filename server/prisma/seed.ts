import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.voteRecord.deleteMany()
  await prisma.voteOption.deleteMany()
  await prisma.vote.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.anonymousMessage.deleteMany()
  await prisma.expenseSplit.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.dutySchedule.deleteMany()
  await prisma.convention.deleteMany()
  await prisma.weatherCache.deleteMany()
  await prisma.user.deleteMany()
  await prisma.dorm.deleteMany()

  const dorm = await prisma.dorm.create({
    data: {
      name: '阳光寝室302',
      city: '北京',
    },
  })

  const passwordHash = await bcrypt.hash('123456', 10)

  const xiaoming = await prisma.user.create({
    data: { nickname: '小明', passwordHash, dormId: dorm.id },
  })
  const xiaohong = await prisma.user.create({
    data: { nickname: '小红', passwordHash, dormId: dorm.id },
  })
  const xiaogang = await prisma.user.create({
    data: { nickname: '小刚', passwordHash, dormId: dorm.id },
  })
  const xiaoli = await prisma.user.create({
    data: { nickname: '小丽', passwordHash, dormId: dorm.id },
  })

  const members = [xiaoming, xiaohong, xiaogang, xiaoli]

  const expense1 = await prisma.expense.create({
    data: {
      dormId: dorm.id,
      payerId: xiaoming.id,
      title: '外卖晚餐',
      amount: 120,
      category: '餐饮',
      splitMethod: 'equal',
      splits: {
        create: members.map((m) => ({
          userId: m.id,
          amount: 30,
        })),
      },
    },
  })

  const expense2 = await prisma.expense.create({
    data: {
      dormId: dorm.id,
      payerId: xiaohong.id,
      title: '洗衣液',
      amount: 45,
      category: '日用品',
      splitMethod: 'equal',
      splits: {
        create: members.map((m) => ({
          userId: m.id,
          amount: 11.25,
        })),
      },
    },
  })

  const expense3 = await prisma.expense.create({
    data: {
      dormId: dorm.id,
      payerId: xiaogang.id,
      title: '电费',
      amount: 200,
      category: '水电',
      splitMethod: 'equal',
      splits: {
        create: members.map((m) => ({
          userId: m.id,
          amount: 50,
        })),
      },
    },
  })

  await prisma.convention.createMany({
    data: [
      {
        dormId: dorm.id,
        type: '作息',
        title: '安静时间',
        content: '晚上11点后保持安静，不影响他人休息',
        pinned: true,
        priority: 1,
        createdBy: xiaoming.id,
      },
      {
        dormId: dorm.id,
        type: '卫生',
        title: '卫生值日',
        content: '每天轮流值日，保持宿舍整洁',
        pinned: true,
        priority: 2,
        createdBy: xiaohong.id,
      },
      {
        dormId: dorm.id,
        type: '安全',
        title: '用电安全',
        content: '禁止使用大功率电器，离开宿舍时关闭电源',
        pinned: false,
        priority: 0,
        createdBy: xiaogang.id,
      },
    ],
  })

  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const dutyDate = new Date(today)
    dutyDate.setDate(dutyDate.getDate() + i)
    await prisma.dutySchedule.create({
      data: {
        dormId: dorm.id,
        userId: members[i % members.length].id,
        dutyDate,
        dutyType: '日常值日',
        completed: i < 0,
      },
    })
  }

  const vote1 = await prisma.vote.create({
    data: {
      dormId: dorm.id,
      title: '周末聚餐地点',
      description: '选择周末聚餐的餐厅',
      isAnonymous: false,
      multiChoice: false,
      createdBy: xiaoming.id,
      options: {
        create: [
          { content: '火锅' },
          { content: '烧烤' },
          { content: '日料' },
          { content: '自助餐' },
        ],
      },
    },
  })

  const vote2 = await prisma.vote.create({
    data: {
      dormId: dorm.id,
      title: '空调温度设定',
      description: '夏天空调温度设多少度？',
      isAnonymous: true,
      multiChoice: false,
      createdBy: xiaohong.id,
      options: {
        create: [
          { content: '24度' },
          { content: '26度' },
          { content: '28度' },
        ],
      },
    },
  })

  await prisma.anonymousMessage.createMany({
    data: [
      {
        dormId: dorm.id,
        content: '希望晚上能早点关灯睡觉',
        likes: 3,
      },
      {
        dormId: dorm.id,
        content: '厕所卫生需要大家共同维护',
        likes: 5,
      },
      {
        dormId: dorm.id,
        content: '建议每周大扫除一次',
        likes: 2,
      },
    ],
  })

  console.log('种子数据创建完成！')
  console.log(`宿舍: ${dorm.name} (邀请码: ${dorm.inviteCode})`)
  console.log(`成员: ${members.map((m) => m.nickname).join('、')}`)
  console.log('所有成员密码: 123456')
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
