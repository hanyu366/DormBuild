import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
})

export async function* createChat(
  messages: { role: string; content: string }[],
  dormContext?: string
) {
  const systemPrompt = `你是DormBuild宿舍管理助手机手，帮助室友们管理宿舍事务。${
    dormContext ? `\n当前宿舍信息：${dormContext}` : ''
  }\n请用中文回复，简洁友好。`

  const stream = await client.chat.completions.create(
    {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    },
    { responseType: 'stream' }
  )

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

export async function parseExpense(
  text: string,
  members: { id: string; nickname: string }[]
) {
  const memberList = members.map((m) => m.nickname).join('、')
  const prompt = `从以下文本中提取费用信息，返回JSON格式。
宿舍成员：${memberList}
文本：${text}

返回格式：
{
  "title": "费用标题",
  "amount": 金额数字,
  "category": "餐饮/日用品/水电/交通/娱乐/其他",
  "splitMethod": "equal/custom",
  "payer": "付款人昵称",
  "splits": [{"nickname": "成员昵称", "amount": 分摊金额}]
}

只返回JSON，不要其他内容。`

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  })

  const content = response.choices[0]?.message?.content || ''
  try {
    const json = JSON.parse(content.replace(/```json\n?|```\n?/g, ''))
    const payer = members.find((m) => m.nickname === json.payer)
    const splits = (json.splits || []).map((s: any) => {
      const member = members.find((m) => m.nickname === s.nickname)
      return { userId: member?.id || '', amount: s.amount }
    }).filter((s: any) => s.userId)

    return {
      title: json.title,
      amount: json.amount,
      category: json.category,
      splitMethod: json.splitMethod || 'equal',
      payerId: payer?.id || members[0]?.id || '',
      splits,
    }
  } catch {
    throw new Error('无法解析费用信息，请手动输入')
  }
}

export async function parseDuty(
  text: string,
  members: { id: string; nickname: string }[]
) {
  const memberList = members.map((m) => m.nickname).join('、')
  const prompt = `从以下文本中提取值日安排信息，返回JSON格式。
宿舍成员：${memberList}
文本：${text}

返回格式：
{
  "duties": [
    {"nickname": "成员昵称", "dutyType": "值日类型", "date": "YYYY-MM-DD"}
  ]
}

只返回JSON，不要其他内容。`

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  })

  const content = response.choices[0]?.message?.content || ''
  try {
    const json = JSON.parse(content.replace(/```json\n?|```\n?/g, ''))
    const duties = (json.duties || []).map((d: any) => {
      const member = members.find((m) => m.nickname === d.nickname)
      return {
        userId: member?.id || '',
        dutyType: d.dutyType || '日常值日',
        dutyDate: d.date ? new Date(d.date) : new Date(),
      }
    }).filter((d: any) => d.userId)

    return duties
  } catch {
    throw new Error('无法解析值日信息，请手动输入')
  }
}
