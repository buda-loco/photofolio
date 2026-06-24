import { queryQuote } from '@/lib/tinaClient'

// TEMP diagnostic route — remove after verifying Tina binding on Vercel.
export const dynamic = 'force-dynamic'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (await queryQuote('placeworks')) as any
  return Response.json({
    bound: !!r?.data,
    deliverables: r?.data?.quotes?.deliverables?.length ?? null,
    envClientId: !!process.env.TINA_PUBLIC_CLIENT_ID,
    envToken: !!process.env.TINA_TOKEN,
  })
}
