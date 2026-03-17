import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const voiceServerUrl = process.env.VOICE_SERVER_WSS_URL || 'wss://voiceproxe.bconclub.com';

  const formData = await req.text();
  const params = new URLSearchParams(formData);
  const callerPhone = params.get('From') || params.get('from') || '';
  const callUUID = params.get('CallUUID') || params.get('callUUID') || '';
  console.log('Vobiz answer POST params:', Object.fromEntries(params));

  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Stream bidirectional="true" keepCallAlive="true" contentType="audio/x-mulaw;rate=8000" extraHeaders="callerPhone=${callerPhone},callUUID=${callUUID}">${voiceServerUrl}/ws</Stream></Response>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
