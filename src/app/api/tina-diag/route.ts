import { __tinaDiag } from '@/lib/tinaClient'

// TEMP diagnostic route — remove after debugging Tina binding on Vercel.
export const dynamic = 'force-dynamic'

export async function GET() {
  const info = await __tinaDiag()
  return Response.json(info)
}
