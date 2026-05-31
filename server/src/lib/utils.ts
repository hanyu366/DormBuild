export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function calculateSplits(
  amount: number,
  method: string,
  members: { userId: string }[],
  customAmounts?: Record<string, number>
): { userId: string; amount: number }[] {
  if (method === 'equal') {
    const perPerson = Math.round((amount / members.length) * 100) / 100
    const remainder = Math.round((amount - perPerson * members.length) * 100) / 100
    return members.map((m, i) => ({
      userId: m.userId,
      amount: i === 0 ? perPerson + remainder : perPerson,
    }))
  }

  if (method === 'custom' && customAmounts) {
    return members.map((m) => ({
      userId: m.userId,
      amount: customAmounts[m.userId] ?? 0,
    }))
  }

  if (method === 'percentage' && customAmounts) {
    return members.map((m) => ({
      userId: m.userId,
      amount: Math.round((amount * (customAmounts[m.userId] ?? 0) / 100) * 100) / 100,
    }))
  }

  return members.map((m) => ({ userId: m.userId, amount: 0 }))
}
