import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('Test webhook received:', new Date().toISOString())
  
  try {
    const body = await req.text()
    const headers = Object.fromEntries(req.headers.entries())
    
    console.log('Request headers:', headers)
    console.log('Request body:', body)
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Test webhook received',
      timestamp: new Date().toISOString(),
      bodyLength: body.length
    })
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'success', 
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString()
  })
}
