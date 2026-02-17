// app/api/setup/route.ts

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test the database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Database connected successfully'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      message: error.message 
    }, { status: 500 })
  }
}
