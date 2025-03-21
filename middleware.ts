import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Crear la respuesta inicial
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        },
      },
    }
  )

  // IMPORTANTE: No ejecutar código entre createServerClient y auth.getUser()

  try {
    // Verificar si hay un usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    
    // Determinar si la ruta requiere autenticación
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                       request.nextUrl.pathname.startsWith('/auth') ||
                       request.nextUrl.pathname.startsWith('/registro')
    
    // Si es una ruta pública (auth) y el usuario está autenticado, redirigir al dashboard
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Si es una ruta protegida y el usuario no está autenticado, redirigir al login
    if (!isAuthRoute && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Usuario está autenticado y accediendo a una ruta protegida - permitir acceso
    return response
  } catch (error) {
    // Si hay un error en la verificación de autenticación, redirigir al login
    console.error('Middleware auth error:', error)
    if (!request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Generated by Copilot
