// Proxy all /api/backend/* requests to the Express backend
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Import the Express app directly
function getBackendApp() {
  const path = require('path');
  
  const candidatePaths = [
    path.join(process.cwd(), '../backend/src/app.js'), // Local dev
    path.join(process.cwd(), '.backend/src/app.js'),   // Vercel build
  ];

  for (const candidatePath of candidatePaths) {
    try {
      const app = require(candidatePath);
      console.log(`[Backend Proxy] Loaded backend from: ${candidatePath}`);
      return app;
    } catch (error) {
      console.log(`[Backend Proxy] Failed to load from ${candidatePath}:`, (error as Error).message);
    }
  }

  throw new Error('[Backend Proxy] Could not load backend app');
}

let backendApp: any = null;

async function handleRequest(req: NextRequest, pathSegments: string[]) {
  try {
    if (!backendApp) {
      backendApp = getBackendApp();
    }

    // Reconstruct the path for the backend
    // /api/backend/auth/me/roles -> /api/auth/me/roles
    const backendPath = '/api/' + pathSegments.join('/');
    
    // Get request body
    const body = req.method !== 'GET' && req.method !== 'HEAD' 
      ? await req.text() 
      : undefined;

    // Create Node.js compatible request
    const nodeReq: any = {
      method: req.method,
      url: backendPath + (req.nextUrl.search || ''),
      headers: Object.fromEntries(req.headers.entries()),
      body,
    };

    // Create response accumulator
    let statusCode = 200;
    let responseHeaders: Record<string, string> = {};
    let responseBody: Buffer[] = [];

    const nodeRes: any = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        responseHeaders[name.toLowerCase()] = value;
      },
      getHeader(name: string) {
        return responseHeaders[name.toLowerCase()];
      },
      writeHead(code: number, headers?: Record<string, string>) {
        statusCode = code;
        if (headers) {
          Object.entries(headers).forEach(([key, val]) => {
            responseHeaders[key.toLowerCase()] = val;
          });
        }
      },
      write(chunk: any) {
        responseBody.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      },
      end(chunk?: any) {
        if (chunk) {
          responseBody.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      },
      on() {},
      once() {},
      emit() {},
    };

    // Handle the request with Express
    await new Promise<void>((resolve, reject) => {
      nodeRes.end = function(chunk?: any) {
        if (chunk) {
          responseBody.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        resolve();
      };

      try {
        backendApp(nodeReq, nodeRes);
      } catch (error) {
        reject(error);
      }
    });

    // Return the response
    const finalBody = Buffer.concat(responseBody);
    return new NextResponse(finalBody, {
      status: statusCode,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[Backend Proxy] Error:', error);
    return NextResponse.json(
      { 
        error: 'Backend proxy error',
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params.path);
}

