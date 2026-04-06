import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    const events = await prisma.event.findMany({
        orderBy: { startsAt: 'asc' }
    })
    return NextResponse.json(events)
}

export async function POST(request: Request) {
    const data = await request.json()
    const event = await prisma.event.create({ data })
    return NextResponse.json(event)
}