// Test endpoint to verify backend sync
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const path = require('path');
  const fs = require('fs');
  
  const checks = {
    backendFolderExists: false,
    backendAppExists: false,
    backendAppCanLoad: false,
    error: null as string | null,
  };
  
  try {
    const backendPath = path.join(process.cwd(), '.backend');
    checks.backendFolderExists = fs.existsSync(backendPath);
    
    const appPath = path.join(process.cwd(), '.backend/src/app.js');
    checks.backendAppExists = fs.existsSync(appPath);
    
    if (checks.backendAppExists) {
      try {
        const app = require(appPath);
        checks.backendAppCanLoad = !!app;
      } catch (loadError) {
        checks.error = (loadError as Error).message;
      }
    }
  } catch (error) {
    checks.error = (error as Error).message;
  }
  
  return NextResponse.json(checks);
}

