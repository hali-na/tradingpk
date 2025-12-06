'use server';

import { NextResponse } from 'next/server';

// 占位 API：实际 Paul Wei 交易数据来自 CSV，本接口仅避免 404 噪音
export async function GET() {
  return NextResponse.json({ trades: [] }, { status: 200 });
}

